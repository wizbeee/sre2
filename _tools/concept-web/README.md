# 개념서, 활동지 모범 답안 페이지 만드는 법

밑줄(_)로 시작하는 폴더라 사이트에는 올라가지 않습니다.

## 파일
- `content_v3.js`: 개념서 원고(PDF 개념서와 같은 원고)
- `build_site.js`: 원고로 `concept/index.html`(개념서)과 `answer/index.html`(모범 답안)을 만듭니다.
- `add_nav.py`: 단원 페이지(1-1, 1-2, 1-3, 1-4, 1-5, 2-1)에 '활동지 모범 답안', '개념서' 단추와 떠 있는 '홈으로' 단추를 넣습니다. 이미 넣은 파일은 건너뜁니다.

## 다시 만들기
1. 원고를 고치면: `node _tools/concept-web/build_site.js _tools/concept-web/content_v3.js .`
2. 모범 답안 PDF가 바뀌면
   - `answer/pdf/<단원>.pdf`를 바꿉니다.
   - 그림을 다시 만듭니다: `pdftoppm -r 150 -jpeg -jpegopt quality=80,progressive=y answer/pdf/<단원>.pdf answer/img/<단원>`
   - 쪽 번호 앞의 0을 뺍니다(1-4-01.jpg → 1-4-1.jpg).
   - 1번을 다시 합니다.
3. 단원 페이지 파일을 새로 바꿔 넣었으면: `python3 _tools/concept-web/add_nav.py .`

1-6, 2-3은 넣지 않습니다(2026-11-15 결정).
