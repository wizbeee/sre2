# 단원 페이지에 '활동지 모범 답안', '개념서' 단추(위쪽)와 떠 있는 '홈으로' 단추를 넣는다.
# python3 add_nav.py <사이트 폴더>   — 이미 넣은 파일은 건너뛴다(표시 주석으로 확인)
import sys, os
SITE = sys.argv[1]
MARK = '<!-- [사이트 이동 단추] '
# 단원 주소 → (모범 답안 u, 개념서 u). 2-1 은 차시에 따라 개념서가 Ⅱ-1 또는 Ⅱ-2 가 된다.
UNITS = {'1-1': ('1-1', '1-1'), '1-2': ('1-2', '1-2'), '1-3': ('1-3', '1-3'),
         '1-4': ('1-4', '1-4'), '1-5': ('1-5', '1-5'), '2-1': ('2-1', 'LESSON')}

CSS = '''<style>
/* 위쪽 줄: 이 단원의 활동지 모범 답안, 개념서로 가는 단추 */
#sre2-docs{padding:8px 0 0}
#sre2-docs .sre2-in{width:100%; max-width:1180px; margin:0 auto; padding:0 14px; display:flex; justify-content:flex-end; gap:6px; flex-wrap:wrap}
#sre2-docs a{display:inline-flex; align-items:center; min-height:34px; padding:5px 13px; border:1px solid #cdc6b8; border-radius:999px;
  background:#fffefb; color:#20262e; font-weight:700; font-size:.86rem; line-height:1.2; text-decoration:none; box-shadow:0 1px 2px rgba(32,38,46,.05)}
#sre2-docs a:hover{background:#f8f5ee; border-color:#8a9099}
/* 떠 있는 홈으로 단추 — 왼쪽 아래(오른쪽 아래는 타이머 자리). 수업 화면, 알림 창(z-index 60 이상)보다 아래에 둔다 */
#sre2-home{position:fixed; left:16px; bottom:16px; z-index:40; display:inline-flex; align-items:center; gap:6px; padding:10px 16px; border-radius:999px;
  background:#fffefb; border:1px solid #cdc6b8; color:#20262e; font-weight:800; font-size:.95rem; line-height:1.2; text-decoration:none;
  box-shadow:0 2px 6px rgba(32,38,46,.12), 0 10px 24px rgba(32,38,46,.14)}
#sre2-home:hover{background:#f8f5ee}
@media (max-width:520px){#sre2-docs .sre2-in{padding:0 11px} #sre2-home{left:11px; bottom:11px; padding:9px 14px}}
@media print{#sre2-docs, #sre2-home{display:none !important}}
</style>'''

def snippet(unit):
    ans, con = UNITS[unit]
    if con == 'LESSON':
        con_js = ('function conU(){ return (typeof LESSON !== "undefined" && LESSON === 2) ? "2-2" : "2-1"; }')
    else:
        con_js = 'function conU(){ return "%s"; }' % con
    js = '''<script>
(function(){
  /* 2026-11-15 발주자 요청 — 이 파일의 수업 기능과는 따로 움직인다. 실패해도 수업 화면은 그대로다. */
  try {
    %s
    var bar = document.createElement("div"), inn = document.createElement("div"), a1 = document.createElement("a"), a2 = document.createElement("a");
    bar.id = "sre2-docs"; inn.className = "sre2-in";
    a1.href = "../answer/?u=%s"; a1.textContent = "활동지 모범 답안";
    a2.href = "../concept/?u=" + conU(); a2.textContent = "개념서";
    /* 2-1 은 누르는 순간의 차시를 따른다 */
    a2.onclick = function(){ this.href = "../concept/?u=" + conU(); };
    inn.appendChild(a1); inn.appendChild(a2); bar.appendChild(inn);
    document.body.insertBefore(bar, document.body.firstChild);
    var home = document.createElement("a");
    home.id = "sre2-home"; home.href = "../"; home.textContent = "\\u2302 홈으로"; home.setAttribute("aria-label", "첫 화면으로");
    document.body.appendChild(home);
  } catch (e) {}
})();
</script>''' % (con_js, ans)
    return MARK + '활동지 모범 답안, 개념서, 홈으로 — 2026-11-15 -->\n' + CSS + '\n' + js + '\n'

for unit in UNITS:
    p = os.path.join(SITE, unit, 'index.html')
    s = open(p, encoding='utf-8').read()
    if MARK in s:
        print('건너뜀', unit); continue
    assert s.count('</body>') == 1, unit
    s = s.replace('</body>', snippet(unit) + '</body>')
    open(p, 'w', encoding='utf-8').write(s)
    print('넣음', unit)
