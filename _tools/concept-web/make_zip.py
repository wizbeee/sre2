# 활동지 모범 답안 PDF 6개를 ZIP 하나로 묶고, 묶은 것을 확인한다.
# python3 _tools/concept-web/make_zip.py .      → answer/pdf/all.zip
# 확인: 6개가 다 들어 있는지, 압축이 깨지지 않았는지, 원본 PDF와 똑같은지(sha256), PDF로 열리는지(쪽수)
import sys, os, zipfile, hashlib, subprocess, tempfile

SITE = sys.argv[1]
PDF = os.path.join(SITE, 'answer', 'pdf')
OUT = os.path.join(PDF, 'all.zip')
FILES = [  # (사이트 파일, ZIP 안 이름) — build_site.js 의 SHEETS 와 같은 이름
    ('1-1.pdf', '1-1_팝콘_모범답안_활동지.pdf'),
    ('1-2.pdf', '1-2_유사과학_모범답안_활동지.pdf'),
    ('1-3.pdf', '1-3_외래생물_모범답안_활동지.pdf'),
    ('1-4.pdf', '1-4_가속도_모범답안_활동지.pdf'),
    ('1-5.pdf', '1-5_달걀헬멧_모범답안_활동지.pdf'),
    ('2-1.pdf', '2-1_2-2_센서_모범답안_활동지.pdf'),
]
sha = lambda b: hashlib.sha256(b).hexdigest()

# 1) 묶기 — 한글 이름은 UTF-8 표시를 붙여 넣는다(파이썬 zipfile 이 자동으로 붙임)
tmp = OUT + '.tmp'
with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for src, name in FILES:
        info = zipfile.ZipInfo(name, date_time=(2026, 11, 15, 0, 0, 0))  # 날짜를 고정해 다시 만들어도 같은 파일이 되게
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        with open(os.path.join(PDF, src), 'rb') as f:
            z.writestr(info, f.read())
os.replace(tmp, OUT)

# 2) 확인
ok = True
with zipfile.ZipFile(OUT) as z:
    bad = z.testzip()
    if bad: print('깨진 항목:', bad); ok = False
    names = z.namelist()
    if names != [n for _, n in FILES]: print('목록 다름:', names); ok = False
    with tempfile.TemporaryDirectory() as td:
        for (src, name), info in zip(FILES, z.infolist()):
            data = z.read(name)
            same = sha(data) == sha(open(os.path.join(PDF, src), 'rb').read())
            utf8 = bool(info.flag_bits & 0x800)
            p = os.path.join(td, 'x.pdf'); open(p, 'wb').write(data)
            pages = subprocess.run(['pdfinfo', p], capture_output=True, text=True).stdout
            pages = next((l.split()[-1] for l in pages.splitlines() if l.startswith('Pages:')), '열리지 않음')
            print(f'{name}  {len(data):>9,}바이트  {pages}쪽  원본과 같음:{same}  한글이름표시:{utf8}')
            ok = ok and same and utf8 and pages.isdigit()
print('ZIP', OUT, f'{os.path.getsize(OUT):,}바이트', '확인 통과' if ok else '확인 실패')
sys.exit(0 if ok else 1)
