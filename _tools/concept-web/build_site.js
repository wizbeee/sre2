// 개념서 원고와 모범 답안 그림 → 사이트의 개념서 · 모범 답안 페이지
// node build_site.js <원고.js> <사이트 폴더> [이전 원고.js 저장판번호]
//   예) node build_site.js content_v4.js . content_v3.js 2
//   원고에 개념을 더하거나 빼면 빈칸 번호가 밀린다. 그때는 이전 원고와 새 저장판 번호(2, 3, …)를 함께 준다.
//   학생 기기에 저장된 이전 판(sre2.concept.v<번호-1>)의 답을, 같은 개념의 같은 답 빈칸으로 옮겨 새 판에 담는다.
// 만드는 것: <사이트>/concept/index.html, <사이트>/answer/index.html
// (모범 답안 그림 answer/img/<단원>-<쪽>.jpg 와 PDF answer/pdf/<단원>.pdf 는 미리 넣어 둔다)
const fs = require('fs'), path = require('path');
const C = require(path.resolve(process.argv[2]));
const SITE = path.resolve(process.argv[3]);
const PREV = process.argv[4] ? require(path.resolve(process.argv[4])) : null;
const STORE_VER = process.argv[5] ? +process.argv[5] : 1;

// ---- 글자 다루기: 개념서 빌드(build.js)와 같은 규칙 ----
const esc0 = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const esc = s => esc0(s).replace(/ ([+−×÷=→±]) /g, ' $1 ').replace(/(\d) (cm|mm|m|m\/s²|N·s|N|kg|kg·m\/s|mg|°C|기압|%)(?![A-Za-z])/g, '$1 $2');
const gapW = a => Math.max(3, a.replace(/\s/g, '').length * 1.05 + 1);

// ---- 단원 정보 (1-6, 2-3 은 넣지 않는다) ----
const UNIT_KEY = { 'Ⅰ-1': '1-1', 'Ⅰ-2': '1-2', 'Ⅰ-3': '1-3', 'Ⅰ-4': '1-4', 'Ⅰ-5': '1-5', 'Ⅱ-1': '2-1', 'Ⅱ-2': '2-2' };
const CLASS_URL = { '1-1': '../1-1/', '1-2': '../1-2/', '1-3': '../1-3/', '1-4': '../1-4/', '1-5': '../1-5/', '2-1': '../2-1/', '2-2': '../2-1/?lesson=2' };
const ANS_OF = { '1-1': '1-1', '1-2': '1-2', '1-3': '1-3', '1-4': '1-4', '1-5': '1-5', '2-1': '2-1', '2-2': '2-1' };
const SHEETS = [
  { k: '1-1', tab: 'Ⅰ-1', file: '1-1_팝콘_모범답안_활동지.pdf', units: ['Ⅰ-1'] },
  { k: '1-2', tab: 'Ⅰ-2', file: '1-2_유사과학_모범답안_활동지.pdf', units: ['Ⅰ-2'] },
  { k: '1-3', tab: 'Ⅰ-3', file: '1-3_외래생물_모범답안_활동지.pdf', units: ['Ⅰ-3'] },
  { k: '1-4', tab: 'Ⅰ-4', file: '1-4_가속도_모범답안_활동지.pdf', units: ['Ⅰ-4'] },
  { k: '1-5', tab: 'Ⅰ-5', file: '1-5_달걀헬멧_모범답안_활동지.pdf', units: ['Ⅰ-5'] },
  { k: '2-1', tab: 'Ⅱ-1, Ⅱ-2', file: '2-1_2-2_센서_모범답안_활동지.pdf', units: ['Ⅱ-1', 'Ⅱ-2'] }
];

const units = [];
C.sessions.forEach(S => S.units.forEach(u => { if (UNIT_KEY[u.code]) units.push(u); }));
const unitByCode = {}; units.forEach(u => { unitByCode[u.code] = u; });
const mainTitle = t => t.split(' — ')[0];

// ---- 두 페이지가 같이 쓰는 모양(사이트의 디자인 토큰을 그대로 옮김) ----
const BASE_CSS = `
:root{--ink:#20262e;--ink-2:#525b66;--ink-3:#8a9099;--line:#e7e2d8;--line-2:#cdc6b8;--bg:#f4f1ea;--grid:rgba(120,110,92,.09);
--card:#fffefb;--card-2:#f8f5ee;--chrome:#2f3a44;--chrome-d:#1a222a;--chrome-soft:rgba(47,58,68,.07);--focus:#2f3a44;
--ans:#b42318;--r:16px;--r-s:11px;--r-xs:7px;--sh-1:0 1px 2px rgba(32,38,46,.05);--sh:0 1px 3px rgba(32,38,46,.07),0 6px 18px rgba(32,38,46,.055)}
*{box-sizing:border-box}
html{font-size:16px}
body{margin:0;color:var(--ink);
 background:linear-gradient(var(--grid) 1px,transparent 1px) 0 0/23px 23px,linear-gradient(90deg,var(--grid) 1px,transparent 1px) 0 0/23px 23px,var(--bg);
 font-family:"Pretendard","Pretendard Variable",-apple-system,BlinkMacSystemFont,"Segoe UI","Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",sans-serif;
 font-size:1rem;line-height:1.6;-webkit-text-size-adjust:100%;word-break:keep-all;overflow-wrap:break-word;padding-bottom:84px}
h1,h2,h3,p,ol,ul{margin:0}
button,input{font:inherit;color:inherit}
a{color:inherit}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.wrap{width:100%;max-width:920px;margin:0 auto;padding:0 14px}
.btn{appearance:none;-webkit-appearance:none;border:1px solid var(--line-2);background:var(--card);color:var(--ink);padding:6px 12px;border-radius:var(--r-s);
 cursor:pointer;font-weight:650;line-height:1.2;min-height:38px;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:var(--sh-1);
 text-decoration:none;font-size:.92rem;white-space:nowrap}
.btn:hover{background:var(--card-2);border-color:var(--ink-3)}
.btn.primary{background:linear-gradient(180deg,#3b4854,var(--chrome));border-color:var(--chrome-d);color:#fff}
.btn.primary:hover{background:linear-gradient(180deg,#46545f,#37434e)}
.top{position:-webkit-sticky;position:sticky;top:0;z-index:20;background:rgba(244,241,234,.95);border-bottom:1px solid var(--line-2);box-shadow:0 6px 16px -12px rgba(32,38,46,.5)}
.top-in{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 0 6px}
.top-name{flex:1 1 auto;min-width:0}
.top-name b{display:block;font-size:1.06rem;line-height:1.3;letter-spacing:-.02em}
.top-name span{display:block;font-size:.8rem;color:var(--ink-3)}
.tabs{display:flex;gap:6px;overflow-x:auto;padding:4px 0 10px;scrollbar-width:thin}
.tab{flex:0 0 auto;border:1px solid var(--line-2);background:var(--card);border-radius:999px;padding:5px 13px;font-size:.88rem;font-weight:700;color:var(--ink-2);text-decoration:none;white-space:nowrap}
.tab:hover{border-color:var(--ink-3)}
.tab.on{background:var(--chrome);border-color:var(--chrome-d);color:#fff}
#home-fab{position:fixed;left:16px;bottom:16px;z-index:40;display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:999px;
 background:var(--card);border:1px solid var(--line-2);box-shadow:0 2px 6px rgba(32,38,46,.12),0 10px 24px rgba(32,38,46,.14);
 color:var(--ink);font-weight:800;font-size:.95rem;text-decoration:none}
#home-fab:hover{background:var(--card-2)}
.sheet-h,.unit-h{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.links{display:flex;gap:6px;flex-wrap:wrap;margin-left:auto}
@media (max-width:520px){.wrap{padding:0 11px}#home-fab{left:11px;bottom:11px;padding:9px 14px}}
@media print{.top,#home-fab,.links,.no-print{display:none !important}body{background:#fff;padding:0}}
`;
const HOME_FAB = '<a id="home-fab" href="../" aria-label="첫 화면으로">⌂ 홈으로</a>';
const PARSE_U = 'function getU(){var m=/[?&]u=([^&#]+)/.exec(location.search);return m?decodeURIComponent(m[1]):"";}';

// ================= 개념서 =================
let bid = 0;
function blanksHtml(s, key, inTable) {
  return esc(s).replace(/\{\{(.+?)\}\}/g, (m, a) => {
    const id = key + '.' + (bid++);
    return '<span class="bk">(<input class="gap' + (inTable ? ' sm' : '') + '" type="text" data-id="' + id + '" style="width:' + gapW(a).toFixed(1) +
      'em" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="빈칸"><span class="fill">' + a + '</span>)</span>';
  });
}
const srcTag = (src, ref) => (src || ref) ? ' <span class="src t-only">[' + esc([src, ref].filter(Boolean).join(' · ')) + ']</span>' : '';
function unitHtml(u, qStart) {
  const k = UNIT_KEY[u.code], [main, ...rest] = u.title.split(' — ');
  bid = 0;
  let h = '<section class="unit" data-u="' + k + '" id="u-' + k + '">';
  h += '<div class="unit-h"><h2><span class="code">' + esc(u.code) + '.</span> ' + esc(main) + (rest.length ? ' <span class="tsub">(' + esc(rest.join(' — ')) + ')</span>' : '') + '</h2>';
  h += '<span class="pg">' + esc(u.pages) + '</span>';
  h += '<span class="links"><a class="btn" href="' + CLASS_URL[k] + '">수업 열기</a><a class="btn" href="../answer/?u=' + ANS_OF[k] + '">활동지 모범 답안</a></span></div>';
  h += '<div class="part"><h3>■ 개념 정리</h3><ol class="cons">';
  u.concepts.forEach((c, i) => { h += '<li>' + blanksHtml(c.t, k + '.c' + i, false) + srcTag(c.src, c.ref) + '</li>'; });
  h += '</ol></div>';
  (u.tables || []).forEach((t, ti) => {
    h += '<div class="part"><p class="cap">' + esc(t.cap) + srcTag(t.src, t.ref) + '</p><div class="tbl"><table class="grid"><tr>' + t.head.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr>';
    t.rows.forEach((r, ri) => { h += '<tr>' + r.map((x, ci) => '<td>' + blanksHtml(x, k + '.t' + ti + '.' + ri + '.' + ci, true) + '</td>').join('') + '</tr>'; });
    h += '</table></div></div>';
  });
  if (u.questions.length) h += '<div class="part qs"><h3>■ 확인 문제</h3>';
  u.questions.forEach((q, i) => {
    if (/\{\{/.test(q.q)) throw new Error('문제 발문에 빈칸이 있음: ' + u.code);
    const qid = k + '.q' + i;
    h += '<div class="q"><p class="qt"><b>' + (qStart + i) + '.</b> ' + esc(q.q) + '</p>';
    if (q.box) h += '<div class="qbox">' + q.box.map(x => '<p>' + esc(x) + '</p>').join('') + '</div>';
    if (q.data) h += '<div class="tbl"><table class="grid qdata">' + q.data.map((r, j) => '<tr>' + r.map(x => (j ? '<td>' : '<th>') + esc(x) + (j ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</table></div>';
    if (q.choices) h += '<div class="ch" role="radiogroup">' + q.choices.map((c, j) => '<label><input type="radio" name="' + qid + '" value="' + j + '" data-id="' + qid + '"><span>' + '①②③④⑤'[j] + ' ' + esc(c) + '</span></label>').join('') + '</div>';
    h += '<div class="ans t-only"><b>[정답] ' + esc(q.answer) + '</b>' + (q.explain ? '<br>' + esc(q.explain) : '') +
      (q.src ? '<br><span class="src">[근거] ' + esc(q.src) + (q.ref ? ' · ' + esc(q.ref) : '') + '</span>' : '') + '</div>';
    h += '</div>';
  });
  h += (u.questions.length ? '</div>' : '') + '</section>';
  return h;
}
// ---- 이전 판 빈칸 → 새 판 빈칸(학생 기기에 저장된 답 옮기기) ----
// 빈칸 id 는 unitHtml 과 같은 차례로 매긴다: 개념(차례대로) → 표(행, 열 차례). 단원마다 0부터.
function blankList(content) {
  const out = {};
  content.sessions.forEach(S => S.units.forEach(u => {
    const k = UNIT_KEY[u.code]; if (!k) return;
    let b = 0; const list = [];
    const scan = (s, place) => { const seen = {}; String(s).replace(/\{\{(.+?)\}\}/g, (m, a) => {
      seen[a] = (seen[a] || 0) + 1; list.push({ id: place.key + '.' + (b++), ans: a, occ: seen[a], place }); return m; }); };
    u.concepts.forEach((c, i) => scan(c.t, { type: 'c', i, key: k + '.c' + i }));
    (u.tables || []).forEach((t, ti) => t.rows.forEach((r, ri) => r.forEach((x, ci) => scan(x, { type: 't', key: k + '.t' + ti + '.' + ri + '.' + ci }))));
    out[k] = { list, concepts: u.concepts.map(c => c.t) };
  }));
  return out;
}
let MIG_CACHE = null;
function migration() {
  if (MIG_CACHE) return MIG_CACHE;
  const map = {};
  if (PREV) {
    const o = blankList(PREV), n = blankList(C), plain = s => s.replace(/\{\{(.+?)\}\}/g, '\u0000');
    let all = 0, moved = 0; const lost = [];
    Object.keys(o).forEach(k => {
      if (!n[k]) return;
      // 이전 개념 i → 새 개념 j: 이전 글에서 빈칸이 아닌 가장 긴 조각을 품은 새 개념(개념은 더하기만 했다)
      const cmap = {};
      o[k].concepts.forEach((t, i) => {
        // 긴 조각부터 하나씩 대 보아, 새 개념 한 곳에만 들어 있는 조각(8자 이상)으로 정한다(글 가운데에 더한 경우도 잡힘)
        const segs = plain(t).split('\u0000').filter(x => x.length >= 8).sort((a, b) => b.length - a.length);
        for (const seg of segs) {
          const hits = n[k].concepts.map((nt, j) => plain(nt).indexOf(seg) >= 0 ? j : -1).filter(j => j >= 0);
          if (hits.length === 1) { cmap[i] = hits[0]; break; }
        }
      });
      o[k].list.forEach(ob => {
        all++;
        const target = ob.place.type === 'c' ? (cmap[ob.place.i] == null ? null : k + '.c' + cmap[ob.place.i]) : ob.place.key;
        const nb = target && n[k].list.find(x => x.place.key === target && x.ans === ob.ans && x.occ === ob.occ);
        if (nb) { map[ob.id] = nb.id; moved++; } else lost.push(ob.id + '(' + ob.ans + ')');
      });
    });
    console.log('저장된 답 옮기기: 이전 빈칸 ' + all + '개 가운데 ' + moved + '개를 새 빈칸에 이음' + (lost.length ? ' · 못 이음: ' + lost.join(', ') : ''));
  }
  return (MIG_CACHE = map);
}

function conceptPage() {
  let body = '', q = 1;
  C.sessions.forEach(S => {
    const list = S.units.filter(u => UNIT_KEY[u.code]);
    if (!list.length) return;
    body += '<section class="sess"><h1 class="sess-h">' + esc(S.name) + '<span>' + esc(S.part) + '</span></h1>';
    S.units.forEach(u => { if (UNIT_KEY[u.code]) body += unitHtml(u, q); q += u.questions.length; });
    body += '</section>';
  });
  const tabs = '<a class="tab" data-k="" href="./">전체</a>' + units.map(u => '<a class="tab" data-k="' + UNIT_KEY[u.code] + '" href="?u=' + UNIT_KEY[u.code] + '">' + esc(u.code) + '</a>').join('');
  const css = BASE_CSS + `
.intro{margin:14px 0 4px;padding:10px 13px;background:var(--card);border:1px solid var(--line);border-radius:var(--r-s);font-size:.92rem;color:var(--ink-2);display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.intro p{flex:1 1 260px}
.t-banner{display:none;margin:14px 0 4px;padding:10px 13px;border:1px solid var(--ans);border-radius:var(--r-s);background:#fff6f5;color:var(--ans);font-weight:700;font-size:.92rem}
.sess-h{font-size:1.12rem;margin:22px 0 0;padding:0 0 5px;border-bottom:2px solid var(--ink);line-height:1.5}
.sess-h span{font-size:.92rem;font-weight:500;margin-left:10px;color:var(--ink-2)}
.unit{margin:16px 0 0;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:16px 18px 18px}
.unit-h{border-bottom:1px solid var(--line-2);padding-bottom:8px}
.unit-h h2{font-size:1.12rem;line-height:1.45;letter-spacing:-.02em}
.unit-h .tsub{font-size:.92rem;font-weight:500;color:var(--ink-2)}
.unit-h .pg{font-size:.82rem;color:var(--ink-3)}
.part{margin-top:12px}
h3{font-size:.98rem;margin:0 0 6px}
ol.cons{padding-left:1.5em;font-size:1.04rem;line-height:2.05}
ol.cons li{margin:0 0 6px}
.bk{white-space:nowrap}
input.gap{display:inline-block;border:0;border-bottom:2px solid var(--ink-3);background:#fbf8f1;border-radius:4px 4px 0 0;padding:0 4px;margin:0 2px;
 height:1.7em;line-height:1.7em;vertical-align:baseline;max-width:calc(100vw - 80px);font-size:1rem;color:#1d4ed8;font-weight:700;text-align:center}
input.gap:focus{outline:0;border-bottom-color:var(--chrome);background:#fff}
input.gap.sm{font-size:16px}
.fill{display:none;color:var(--ans);font-weight:800;padding:0 4px}
.src{font-size:.74rem;color:var(--ink-3);font-weight:400}
.t-only{display:none}
html.t-on .t-only{display:inline}
html.t-on div.t-only{display:block}
html.t-on .t-banner{display:block}
html.t-on .intro{display:none}
html.t-on input.gap{display:none}
html.t-on .fill{display:inline}
.cap{font-size:.92rem;font-weight:700;margin:4px 0 4px}
.tbl{overflow-x:auto;-webkit-overflow-scrolling:touch}
table.grid{width:100%;border-collapse:collapse;background:#fff;min-width:420px}
table.grid th,table.grid td{border:1px solid #444;padding:6px 8px;line-height:1.7;vertical-align:middle;font-size:.95rem}
table.grid th{background:#f0eee8;font-weight:700;text-align:center;font-size:.9rem}
.q{margin-top:4px}
.qt{line-height:1.75}
.ch{display:flex;flex-direction:column;gap:6px;margin:8px 0 0 .6em}
.ch label{position:relative;cursor:pointer}
.ch input{position:absolute;opacity:0;left:0;top:0}
.ch span{display:block;border:1px solid var(--line-2);border-radius:var(--r-xs);padding:6px 11px;background:#fff;line-height:1.55}
.ch label:hover span{border-color:var(--ink-3)}
.ch input:checked + span{border-color:var(--chrome);background:var(--chrome-soft);font-weight:700;box-shadow:inset 3px 0 0 var(--chrome)}
.ch input:focus-visible + span{outline:3px solid var(--focus);outline-offset:2px}
.ans{margin:10px 0 0 .6em;border:1px solid var(--ans);border-radius:var(--r-xs);background:#fff;padding:7px 12px;font-size:.95rem;line-height:1.7}
.ans b{color:var(--ans)}
.tnote{margin-top:22px;background:var(--card);border:1px solid var(--line-2);border-radius:var(--r-s);padding:10px 14px;font-size:.84rem;line-height:1.75;color:#444}
html.one .sess-h,html.one .tnote{display:none !important}
@media (max-width:520px){.unit{padding:13px 12px 14px}ol.cons{font-size:1rem}}
`;
  const js = `(function(){
${PARSE_U}
var KEY="sre2.concept.v${STORE_VER}",store={},canSave=true,i;
try{store=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){canSave=false;store={};}
${STORE_VER > 1 ? `/* 이전 판에 적은 답 옮기기 — 새 판에 아무것도 없을 때 한 번만(이전 판은 지우지 않는다) */
var MIG=${JSON.stringify(migration())};
try{var hasNew=false,kk;for(kk in store){if(store.hasOwnProperty(kk)){hasNew=true;break;}}
 var old=localStorage.getItem("sre2.concept.v${STORE_VER - 1}");
 if(!hasNew&&old){old=JSON.parse(old)||{};for(kk in old){if(!old.hasOwnProperty(kk))continue;
  if(MIG.hasOwnProperty(kk))store[MIG[kk]]=old[kk];else if(/\\.q\\d+$/.test(kk))store[kk]=old[kk];}
  localStorage.setItem(KEY,JSON.stringify(store));}}catch(e){}` : ''}
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){canSave=false;paintSave();}}
function paintSave(){var n=document.getElementById("save-note");if(n&&!canSave)n.textContent="이 기기에서는 저장이 안 돼요. 새로 고치면 적은 것이 사라져요.";}
var u=getU(),secs=document.querySelectorAll(".unit"),found=false;
for(i=0;i<secs.length;i++){if(secs[i].getAttribute("data-u")===u)found=true;}
if(!found)u="";
if(u){document.documentElement.className+=" one";
 for(i=0;i<secs.length;i++){if(secs[i].getAttribute("data-u")!==u)secs[i].style.display="none";}
 var t=secs.length&&document.querySelector('.unit[data-u="'+u+'"] .code');if(t)document.title=t.textContent.replace(/\\.$/,"")+" 개념 정리 | 과학탐구실험2";}
var tabs=document.querySelectorAll(".tab");
for(i=0;i<tabs.length;i++){if(tabs[i].getAttribute("data-k")===u)tabs[i].className+=" on";}
var ins=document.querySelectorAll("input[data-id]");
function onText(){var id=this.getAttribute("data-id");if(this.value)store[id]=this.value;else delete store[id];save();}
function onPick(){store[this.getAttribute("data-id")]=this.value;save();}
for(i=0;i<ins.length;i++){var el=ins[i],id=el.getAttribute("data-id");
 if(el.type==="radio"){if(store[id]===el.value)el.checked=true;el.onchange=onPick;}
 else{if(store[id]!=null)el.value=store[id];el.oninput=onText;el.onchange=onText;}}
paintSave();
var tb=document.getElementById("btn-teacher"),on=false;
tb.onclick=function(){on=!on;var c=document.documentElement;
 if(on){c.className+=" t-on";tb.textContent="학생용으로 돌아가기";}
 else{c.className=c.className.replace(/\\s*t-on/g,"");tb.textContent="교사용 답 보기";}
 tb.setAttribute("aria-pressed",on?"true":"false");};
var cb=document.getElementById("btn-clear"),armed=null;
cb.onclick=function(){
 if(!armed){cb.textContent="한 번 더 누르면 지워요";armed=setTimeout(function(){armed=null;cb.textContent="적은 것 지우기";},3000);return;}
 clearTimeout(armed);armed=null;cb.textContent="적은 것 지우기";
 for(var j=0;j<ins.length;j++){var x=ins[j];if(u&&x.getAttribute("data-id").indexOf(u+".")!==0)continue;
  if(x.type==="radio")x.checked=false;else x.value="";delete store[x.getAttribute("data-id")];}
 save();};
})();`;
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
    '<meta name="color-scheme" content="light"><title>개념 정리 | 과학탐구실험2</title><style>' + css + '</style></head><body>' +
    '<header class="top"><div class="wrap"><div class="top-in"><div class="top-name"><b>' + esc(C.title) + '</b><span>개념서, 빈칸을 직접 채워요</span></div>' +
    '<button class="btn primary" type="button" id="btn-teacher" aria-pressed="false">교사용 답 보기</button></div>' +
    '<nav class="tabs" aria-label="단원 고르기">' + tabs + '</nav></div></header>' +
    '<main class="wrap"><div class="intro"><p>괄호 안을 눌러 답을 적어요. 문제는 답을 눌러 골라요. <span id="save-note">적은 것은 이 기기에만 저장돼요.</span></p>' +
    '<button class="btn" type="button" id="btn-clear">적은 것 지우기</button></div>' +
    '<div class="t-banner">교사용 답을 보고 있어요. 빨간 글자가 빈칸의 답이에요. 위의 [학생용으로 돌아가기]를 누르면 내가 적은 것이 다시 보여요.</div>' +
    body + (C.tnote ? '<p class="tnote t-only">' + esc(C.tnote) + '</p>' : '') + '</main>' + HOME_FAB + '<script>' + js + '</script></body></html>';
}

// ================= 모범 답안 =================
function answerPage() {
  const imgDir = path.join(SITE, 'answer', 'img');
  const all = fs.readdirSync(imgDir);
  let body = '';
  SHEETS.forEach(s => {
    const pages = all.filter(f => f.startsWith(s.k + '-') && /\.jpg$/.test(f)).map(f => +f.slice(s.k.length + 1, -4)).sort((a, b) => a - b);
    if (!pages.length) throw new Error('그림 없음: ' + s.k);
    if (!fs.existsSync(path.join(SITE, 'answer', 'pdf', s.k + '.pdf'))) throw new Error('PDF 없음: ' + s.k);
    const titles = s.units.map(c => '<span class="code">' + esc(c) + '.</span> ' + esc(mainTitle(unitByCode[c].title))).join('<br>');
    const ck = UNIT_KEY[s.units[0]];
    body += '<section class="sheet" data-k="' + s.k + '" id="s-' + s.k + '"><div class="sheet-h"><h2>' + titles + '</h2><span class="links">' +
      '<a class="btn primary" href="pdf/' + s.k + '.pdf" download="' + esc(s.file) + '">PDF로 받기</a>' +
      '<a class="btn" href="' + CLASS_URL[ck] + '">수업 열기</a>' +
      '<a class="btn" href="../concept/?u=' + ck + '">개념서</a></span></div>' +
      '<p class="pcount">' + pages.length + '쪽</p>' +
      pages.map(n => '<img class="page" src="img/' + s.k + '-' + n + '.jpg" width="1240" height="1754" loading="lazy" decoding="async" alt="' + esc(s.tab) + ' 모범 답안 ' + n + '쪽">').join('') +
      '</section>';
  });
  if (!fs.existsSync(path.join(SITE, 'answer', 'pdf', 'all.zip'))) throw new Error('ZIP 없음: make_zip.py 를 먼저 실행');
  const tabs = '<a class="tab" data-k="" href="./">전체</a>' + SHEETS.map(s => '<a class="tab" data-k="' + s.k + '" href="?u=' + s.k + '">' + esc(s.tab) + '</a>').join('');
  const css = BASE_CSS + `
.sheet{margin:18px 0 0}
.sheet-h{padding:4px 0 8px;border-bottom:1px solid var(--line-2)}
.sheet-h h2{font-size:1.08rem;line-height:1.5;letter-spacing:-.02em}
.pcount{font-size:.82rem;color:var(--ink-3);margin:6px 0 0}
img.page{display:block;width:100%;height:auto;margin:10px 0 0;background:#fff;border:1px solid var(--line-2);border-radius:6px;box-shadow:var(--sh)}
`;
  const js = `(function(){
${PARSE_U}
var u=getU();if(u==="2-2")u="2-1";
var secs=document.querySelectorAll(".sheet"),found=false,i;
for(i=0;i<secs.length;i++){if(secs[i].getAttribute("data-k")===u)found=true;}
if(!found)u="";
if(u){for(i=0;i<secs.length;i++){if(secs[i].getAttribute("data-k")!==u)secs[i].style.display="none";}}
var tabs=document.querySelectorAll(".tab");
for(i=0;i<tabs.length;i++){if(tabs[i].getAttribute("data-k")===u){tabs[i].className+=" on";if(u)document.title=tabs[i].textContent+" 활동지 모범 답안 | 과학탐구실험2";}}
})();`;
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
    '<meta name="color-scheme" content="light"><title>활동지 모범 답안 | 과학탐구실험2</title><style>' + css + '</style></head><body>' +
    '<header class="top"><div class="wrap"><div class="top-in"><div class="top-name"><b>활동지 모범 답안</b><span>과학탐구실험2, 단원을 골라 봐요</span></div>' +
    // 6개 PDF를 한 번에 받는 ZIP(2026-11-15 요청). 만들고 확인하는 것은 make_zip.py
    '<a class="btn" href="pdf/all.zip" download="과학탐구실험2_활동지_모범답안_전체.zip">전체 PDF 한 번에 받기 (ZIP)</a></div>' +
    '<nav class="tabs" aria-label="단원 고르기">' + tabs + '</nav></div></header>' +
    '<main class="wrap">' + body + '</main>' + HOME_FAB + '<script>' + js + '</script></body></html>';
}

fs.mkdirSync(path.join(SITE, 'concept'), { recursive: true });
fs.writeFileSync(path.join(SITE, 'concept', 'index.html'), conceptPage());
fs.writeFileSync(path.join(SITE, 'answer', 'index.html'), answerPage());
console.log('concept, answer 만듦');
