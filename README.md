# LeaderScore

지도자의 공(+)과 과(−)를 사건별 점수로 매기고, 합계로 랭킹을 보여주는 모바일 웹앱.
기획은 [SPEC.md](SPEC.md), 화면 목업은 [mockups/](mockups/).

DB가 없습니다. 지도자·사건·점수는 모두 `data/*.json`에 있고, 빌드할 때 정적 페이지로 만들어집니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm test           # 점수 계산·프롬프트·응답 검증 + 내용 데이터 검사
npm run typecheck
npm run build
```

## 배포 (Vercel)

1. [vercel.com](https://vercel.com)에 GitHub 계정으로 가입합니다.
2. **Add New → Project**에서 이 저장소를 고르고 **Deploy**를 누릅니다. 환경변수는 필요 없습니다.
3. 이후 연결된 브랜치에 푸시할 때마다 자동으로 다시 배포됩니다.

## 내용 수정

- 지도자·사건·점수의 원본은 `data/*.json`이고, 작성 기준은 `data/BRIEF.md`입니다.
- 고친 뒤에는 `npm test`로 형식(점수 범위, 국가·구분 값, id 중복 등)을 검사하고 푸시합니다.
- 생존 인물은 수록하지 않았습니다.
