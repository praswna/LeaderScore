# LeaderScore

지도자의 공(+)과 과(−)를 사건별 점수로 매기고, 합계로 랭킹을 보여주는 모바일 웹앱.
기획은 [SPEC.md](SPEC.md), 화면 목업은 [mockups/](mockups/).

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

DB 환경변수가 없으면 `data/*.json`에 있는 내용으로 바로 동작합니다(샘플 모드). 이때 관리자 비밀번호는 `admin`이고, 채점 저장은 서버 메모리에만 남습니다.

```bash
npm test           # 점수 계산·프롬프트·응답 검증 + 내용 데이터 검사
npm run typecheck
npm run build
npm run seed       # data/*.json → supabase/seed.sql 다시 생성
```

## Supabase 연결

1. **프로젝트 만들기:** [supabase.com](https://supabase.com)에 가입하고 **New project**를 누릅니다. 이름은 자유, DB 비밀번호는 아무거나(앱에서는 안 씁니다), Region은 **Northeast Asia (Seoul)**.
2. **표 만들기:** 왼쪽 메뉴 **SQL Editor**에서 `supabase/schema.sql` 내용을 통째로 붙여넣고 **Run**.
3. **내용 넣기:** SQL Editor에서 새 쿼리를 열고 `supabase/seed.sql` 내용을 붙여넣고 **Run**. **Table Editor**에서 `leaders`, `events` 표에 데이터가 보이면 성공입니다.
4. **키 복사:** **Project Settings → API Keys**(또는 상단 **Connect** 버튼)에서 두 가지를 복사합니다.
   - Project URL (`https://xxxx.supabase.co`)
   - **secret** 키 (`sb_secret_...`). 예전 프로젝트라면 Legacy 탭의 **service_role** 키. publishable / anon 키가 **아닙니다**.
5. **환경변수:** `.env.example`을 `.env.local`로 복사해서 채웁니다.
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ADMIN_PASSWORD=원하는비밀번호
   ```
6. `npm run dev` → **설정** 탭에 "샘플 데이터 모드" 안내가 사라졌으면 연결된 것입니다.

secret 키는 DB 전체 권한이라 깃에 올리거나 남에게 보내면 안 됩니다. `.env.local`은 `.gitignore`에 들어 있습니다. 배포(Vercel 등)할 때는 같은 환경변수 세 개를 배포 설정에 넣습니다.

**무료 플랜 주의:** 7일 동안 요청이 없으면 프로젝트가 일시정지됩니다. 대시보드에서 **Restore**를 누르면 데이터 그대로 다시 켜집니다.

## 내용 관리

- 지도자·사건·점수의 원본은 `data/*.json`이고, 작성 기준은 `data/BRIEF.md`입니다.
- 내용을 고친 뒤에는 `npm test`로 형식을 검사하고 `npm run seed`로 `supabase/seed.sql`을 다시 만든 다음, SQL Editor에서 실행합니다. 같은 id는 덮어씁니다.
- 앱의 관리자 채점(설정 탭)으로 다시 매긴 점수는 DB에만 저장됩니다. seed를 다시 실행하면 원본 점수로 돌아가니 주의하세요.
- 생존 인물은 수록하지 않았습니다.

## 채점 흐름

설정 탭 → 관리자 로그인 → 지도자 선택 → **채점 프롬프트 복사** → ChatGPT·Claude 등 AI 채팅에 붙여넣기 → AI 응답을 앱에 붙여넣기 → **저장**.
저장할 때 JSON 형식, 사건 ID, 점수 범위(−10~+10 정수, 0 제외), 누락된 사건을 검사하고, 문제가 있으면 저장하지 않습니다.
