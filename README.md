# 오조사마

> 최애 애니 캐릭터를 구독하면, SNS에 흩어진 소식 중 **그 캐릭터와 관련된 게시물만** 모아 보여주는 팬덤 피드 서비스.

애니 팬덤을 위한 **구독형 캐릭터 정보 서비스**입니다. 좋아하는 캐릭터를 고르면,
여러 SNS 계정에서 긁어온 게시물을 캐릭터별로 필터링해 개인화된 피드로 띄워줍니다.

## 어떻게 동작하나요

1. **구독** — `캐릭터 탐색`에서 **작품 전체**를 구독하거나, 작품 카드에 함께 뜨는
   **대표 캐릭터**(예: 「나루토」의 나루토·사스케·사쿠라)를 하나씩 따로 구독할 수
   있습니다. 둘 다 구독 목록(로컬 스토리지)에 같이 저장되고, 작품 구독은 그 작품의
   모든 캐릭터 소식을, 캐릭터 구독은 그 캐릭터 소식만 가져옵니다.
2. **소식 수집(스크래핑)** — X(트위터) 소스 계정들을 Apify로 수집합니다. (`/api/feed/sync`)
3. **캐릭터 매칭/필터링** — 수집한 게시물의 캡션·해시태그를 캐릭터의 키워드와 대조해,
   관련된 게시물만 남기고 어떤 캐릭터의 소식인지 태깅합니다. (`src/lib/matching.ts`)
4. **개인화 피드** — 구독한 캐릭터의 소식만 홈 피드에 최신순으로 모아 보여줍니다. 특정
   캐릭터를 골라 보면 그 캐릭터의 굿즈 매물도 함께 섞여 보입니다.
5. **굿즈 매물 수집** — 당근마켓 · 번개장터를 Apify로 검색해 캐릭터 굿즈 매물을 모읍니다.
   (`/api/goods/sync`)

Apify 토큰이 없어도 번들된 **샘플 소식**으로 전체 흐름이 그대로 동작하도록 만들어,
설정 없이도 서비스를 체험할 수 있습니다. 토큰을 넣으면 라이브 소식이 위에 병합됩니다.

## 주요 화면

- **홈 피드** — 맨 위 **행사 배너**(수집된 게시물에서 뽑은 실제 행사, 개막일 순 · D-day 표시)
  아래로 구독 캐릭터의 소식만. 상단 칩으로 특정 캐릭터만 골라 보기. 캐릭터를 하나 선택하면
  그 캐릭터의 굿즈 매물이 소식과 함께 최신순으로 섞여 보입니다.
- **입덕 온보딩** — 첫 방문 시 5스테이지 취향 입력. 안내 캐릭터 미쿠가 선택마다
  말을 걸고, 답할수록 차오르는 덕력 게이지, 작품 표지 아트로 고르는 작품 선택,
  마지막엔 오시 카드(OSHI PASS) 발급.
- **캐릭터 탐색** — 인기·카테고리별로 작품을 둘러보고 구독/해제. 대표 캐릭터가 있는
  작품은 카드에 캐릭터 칩이 함께 떠서 탭 한 번으로 캐릭터만 따로 구독할 수 있습니다.
  캐릭터 이름으로 검색하면 그 캐릭터의 개별 카드도 바로 나옵니다.
- **캐릭터/작품 상세** — 소개, 관련 해시태그, 관련 소식, 그 캐릭터의 굿즈 매물. 캐릭터
  상세에는 소속 작품으로 돌아가는 링크가 함께 있습니다. 캐릭터는 아직 사진이 없어서,
  작품과 동일하게 이모지+그라데이션 아바타로 표시해 시각적으로 어색하지 않게 맞췄습니다.
- **굿즈** — 당근마켓 · 번개장터에서 모은 캐릭터 굿즈 매물. 캐릭터/플랫폼 필터, 가격순 정렬.
- **번역** — 게시물을 한국어로 번역 (Google 번역, 무료·비공식 엔드포인트).
- **통계** (관리자 전용) — 사용자 테스트용 행동 통계 대시보드. 아래 [사용자 테스트
  통계](#사용자-테스트-통계) 참고.

## 개발

```bash
bun install          # 또는 npm install
bun run dev          # http://localhost:3000  (Express + Vite)
bun run build        # 프론트엔드 + 서버 번들
bun run start        # 프로덕션 서버 (dist/server.cjs)
bun run lint         # tsc 타입 체크
bun run scrape-once  # Apify로 트위터/굿즈를 한 번에 긁어서 data/ + src/sample*.json 갱신
```

### 환경 변수 (`.env`)

`.env.example`에 전체 목록과 기본값이 주석으로 정리되어 있습니다. 핵심만 요약하면:

| 변수 | 설명 |
| --- | --- |
| `APIFY_API_TOKEN` | 라이브 스크래핑(트위터 피드 + 굿즈 탭)에 필요. 없으면 번들 샘플 데이터로만 동작. |
| `APIFY_API_TOKEN_2` | (선택) `bun run scrape-once` 전용 — 토큰 1을 다 쓰면 자동으로 넘어가는 두 번째 토큰. |
| `APIFY_TWITTER_ACTOR` / `APIFY_BUNJANG_ACTOR` / `APIFY_DANGGEUN_ACTOR` | 사용할 Apify 액터 id. |

### Vercel 배포와 `/api` 서버리스 함수

`vercel.json`은 Vite 프런트엔드만 빌드합니다 — `server.ts`(Express)는 로컬 개발/자체 호스팅
전용이고 Vercel에는 올라가지 않습니다. 그래서 번역·피드·굿즈 동기화는 `api/*.ts`에 Vercel
서버리스 함수로 **따로** 구현되어 있고(`api/translate.ts`, `api/feed/sync.ts`,
`api/goods/sync.ts`, `api/image-proxy.ts`), 실제 로직은 `src/server/*.ts`에 있는 공용
모듈을 Express와 서버리스 함수가 함께 가져다 씁니다. `APIFY_API_TOKEN`은 Vercel 프로젝트의
Environment Variables에 등록하면 됩니다.

서버리스 함수는 상태를 유지하지 못하므로(재시작마다 초기화, `/tmp`도 같은 인스턴스에서만
유지), 커밋된 `data/feed-store.json` · `data/goods-store.json`을 "항상 존재하는 기본
데이터"로 번들하고, 그 위에 `force: true` 요청이 오면 라이브 스크래핑 결과를 얹는 방식으로
동작합니다. 진짜로 데이터셋을 불려나가려면 `bun run scrape-once`를 실행해 이 파일들을
갱신하고 커밋하세요.

### `bun run scrape-once` 실행 시 알아둘 점

이 프로젝트를 만든 개발 환경은 Apify/X/당근/번개장터로 나가는 외부 접속이 막혀 있어서,
스크래핑 코드는 실제 인터넷이 되는 환경(로컬 PC 등)에서 처음 실행했을 때 다음이
확인/수정되었습니다:

- **굿즈(당근마켓·번개장터)** — 실제로 잘 동작합니다. 캐릭터 키워드 하나당 액터를
  한 번씩 호출합니다(`GOODS_PER_QUERY`개씩, 기본 30개) — 처음엔 모든 키워드를 한 번에
  보내려 했지만, 두 액터 모두 `query`(단수) 필드만 읽고 나머지 키워드를 무시하는 걸
  실제 실행으로 확인해서 키워드별 반복 호출로 고쳤습니다. 당근마켓은 동네 기반이라
  검색당 결과가 적게 나오는 게 정상입니다(`DANGGEUN_REGIONS`로 지역 추가 가능).
- **트위터/X** — 기본 액터는 `parseforge/x-com-scraper`입니다. 대안으로 제안됐던
  `apidojo/tweet-scraper`는 실제 실행해보니 무료 Apify 플랜에서는 API 호출 자체를
  거부해서(유료 플랜 필요), 기본값을 다시 `parseforge/x-com-scraper`로 되돌렸습니다
  — 유료 플랜이 있다면 `APIFY_TWITTER_ACTOR`로 바꿔 쓸 수 있습니다.
- `bun run scrape-once`는 두 토큰을 순서대로 소진하며 굿즈 + 트위터 49개 계정을 한
  번에 긁어 `data/*.json`과 `src/sample*.json`에 저장합니다(기존 값과 병합되므로
  여러 번 실행해도 안전합니다). 실행 후 `git diff`로 확인하고 커밋/푸시하세요.

## 구조

```
server.ts                 Express: 로컬 개발/자체 호스팅용 (이미지 프록시 · feed/goods sync · 번역 · analytics)
api/                      Vercel 서버리스 함수 (server.ts와 같은 API를 프로덕션에 제공)
  translate.ts            POST /api/translate
  image-proxy.ts          GET  /api/image-proxy
  feed/sync.ts            POST /api/feed/sync
  goods/sync.ts           POST /api/goods/sync
scripts/scrape-once.ts    한 번 실행하는 수동 스크래핑 스크립트 (bun run scrape-once)
data/                     커밋되는 스크래핑 캐시 (feed-store.json · goods-store.json; analytics-store.json은 gitignore)
src/
  works.json              큐레이션된 작품(대표 캐릭터 포함) — 소수 작품만 수동 정리
  characterFills.json     나머지 작품의 대표 캐릭터 일괄 데이터 (works.json에 없는 작품용)
  characters.ts           구독 가능한 카탈로그: 작품(kind:'work') + 대표 캐릭터(kind:'character')
  data.ts                 번들 샘플 소식 · 샘플 굿즈
  events.ts               수집된 게시물에서 추린 실제 행사 (홈 피드 배너용)
  types.ts                Character · Work · FeedPost · GoodsListing · PostMatch 타입
  analyticsTypes.ts       사용자 테스트 이벤트 스키마 (클라이언트·서버 공용)
  server/                 스크래핑 로직 (Express·서버리스 함수·scrape-once가 공용으로 사용)
    twitter.ts            X/Twitter 스크래핑 (Apify parseforge/x-com-scraper)
    goods.ts              당근마켓·번개장터 스크래핑 (Apify oxygenated_quagmire/*)
    translate.ts          Google 번역 프록시
    apifyTokens.ts        여러 Apify 토큰을 순서대로 소진하는 TokenRotator
  lib/matching.ts         캐릭터 관련도 매칭/필터 (서버·클라 공용, 게시물·굿즈 모두 지원)
  lib/analytics.ts        클라이언트 이벤트 트래커 (큐잉·전송, 페이지뷰/이탈/구독/온보딩 등)
  lib/analyticsSummary.ts 수집된 이벤트를 통계로 집계 (서버 전용)
  lib/{utils,api}.ts       시간·이미지·색상 유틸 / 백엔드 호출
  hooks/useSubscriptions.ts   구독 상태(로컬 스토리지, 작품·캐릭터 id 공용)
  components/             Sidebar · FeedView · GoodsView · EventBanner · DiscoverView ·
                           CharacterDetailView · CharacterCard · StatsView · PostCard · GoodsCard …
```

> 캐릭터 아바타는 저작권 이슈를 피하기 위해 이모지 + 그라데이션으로 표현합니다. 대표
> 캐릭터도 실제 사진이 없어서 동일한 방식(캐릭터 고유 id로 결정되는 이모지·그라데이션)을
> 그대로 써서, 작품 카드 옆에 있어도 어색하지 않게 맞췄습니다.

> 행사 배너 이미지는 원본 게시물의 사진을 그대로 쓰지 않고, 마스크로 왼쪽 경계를 선 따서
> 배너 그라데이션에 녹여 넣습니다. 사진이 없는 게시물이나 로드 실패 시에는 자체 라인아트로
> 대체합니다.

## 사용자 테스트 통계

앱 사용 중 발생하는 행동을 서버에 모아 몇 가지 질문에 답할 수 있게 자동 집계합니다.

| 질문 | 어떻게 집계하나요 |
| --- | --- |
| 어디서 멈추는지 | 세션이 마지막으로 머문 화면, 화면별 평균 체류 시간 |
| 어디서 되돌아가는지 | 캐릭터 상세의 ‘뒤로’ 버튼이 눌린 화면 |
| 언제 포기하는지 | 온보딩 5단계 퍼널 도달률 + 완료 못 하고 이탈한 단계 |
| 어떤 표정인지 | 온보딩 안내 캐릭터(미쿠)가 반응한 순간·대사 |
| 핵심 기능은 무엇인지 | 구독·검색·번역·필터 등 실제 사용 빈도 순위 |
| 무엇을 선호하는지 | 가장 많이 구독된 작품/캐릭터, 작품 vs 캐릭터 구독 비율, 온보딩 취향 분포 |

- 클라이언트(`src/lib/analytics.ts`)가 브라우저에서 이벤트를 모아뒀다가 주기적으로,
  또는 탭이 닫힐 때 `/api/analytics/events`로 전송합니다. 서버가 없는 정적 배포(GitHub
  Pages 등)에서는 조용히 실패하고 앱 동작에는 영향이 없습니다.
- 서버는 `data/analytics-store.json`에 이벤트를 쌓고(`.gitignore` 처리되어 커밋되지
  않음), `GET /api/analytics/summary`로 집계 결과를 돌려줍니다.
- **통계** 대시보드(`StatsView`)는 다른 테스터의 행동을 보여주는 화면이라 기본적으로
  숨겨져 있습니다. 이 기기에서 한 번 `?stats=1`을 붙여 접속하면 (예:
  `http://localhost:3000/?stats=1`) 이후로는 사이드바/하단 탭에 **통계** 메뉴가 계속
  나타납니다.
- 이 API들은 별도 인증이 없습니다 — 내부 테스트용 계측이므로, 외부에 공개된 배포에서는
  URL을 아는 사람이면 누구나 집계 결과를 볼 수 있다는 점을 유의하세요.
