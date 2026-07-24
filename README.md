# 오시노티 · OshiNoti

> 최애 애니 캐릭터를 구독하면, SNS에 흩어진 소식 중 **그 캐릭터와 관련된 게시물만** 모아 보여주는 팬덤 피드 서비스.

애니 팬덤을 위한 **구독형 캐릭터 정보 서비스**입니다. 좋아하는 캐릭터를 고르면,
여러 SNS 계정에서 긁어온 게시물을 캐릭터별로 필터링해 개인화된 피드로 띄워줍니다.

## 어떻게 동작하나요

1. **캐릭터 구독** — `캐릭터 탐색`에서 최애를 고르면 구독 목록(로컬 스토리지)에 저장됩니다.
2. **소식 수집(스크래핑)** — 각 캐릭터에 연결된 SNS 소스 계정을 Apify Instagram
   스크래퍼로 수집합니다. (`/api/feed/sync`)
3. **캐릭터 매칭/필터링** — 수집한 게시물의 캡션·해시태그를 캐릭터의 키워드와 대조해,
   관련된 게시물만 남기고 어떤 캐릭터의 소식인지 태깅합니다. (`src/lib/matching.ts`)
4. **개인화 피드** — 구독한 캐릭터의 소식만 홈 피드에 최신순으로 모아 보여줍니다.

Apify 토큰이 없어도 번들된 **샘플 소식**으로 전체 흐름이 그대로 동작하도록 만들어,
설정 없이도 서비스를 체험할 수 있습니다. 토큰을 넣으면 라이브 소식이 위에 병합됩니다.

## 주요 화면

- **홈 피드** — 구독 캐릭터의 소식만. 상단 칩으로 특정 캐릭터만 골라 보기.
- **캐릭터 탐색** — 인기·작품별로 캐릭터를 둘러보고 구독/해제.
- **캐릭터 상세** — 캐릭터 소개, 관련 해시태그, 그 캐릭터의 모든 소식.
- **AI 3줄 요약** — 게시물을 팬 관점에서 한 문장으로 요약 (서버 Gemini, 선택).

## 개발

```bash
bun install          # 또는 npm install
bun run dev          # http://localhost:3000  (Express + Vite)
bun run build        # 프론트엔드 + 서버 번들
bun run start        # 프로덕션 서버 (dist/server.cjs)
bun run lint         # tsc 타입 체크
```

### 환경 변수 (`.env`)

| 변수 | 설명 |
| --- | --- |
| `APIFY_API_TOKEN` | Apify Instagram 스크래퍼 사용. 없으면 샘플 소식으로 동작. |
| `GEMINI_API_KEY` | 게시물 AI 요약. 없으면 요약 기능만 비활성화. |

## 구조

```
server.ts                 Express: 이미지 프록시 · /api/feed/sync · /api/ai/summarize
src/
  characters.ts           구독 가능한 캐릭터 카탈로그 (키워드·해시태그·소스 계정)
  data.ts                 번들 샘플 소식
  types.ts                Character · FeedPost · PostMatch 타입
  lib/matching.ts         캐릭터 관련도 매칭/필터 (서버·클라 공용)
  lib/{utils,api}.ts       시간·이미지·색상 유틸 / 백엔드 호출
  hooks/useSubscriptions.ts   구독 상태(로컬 스토리지)
  components/             Sidebar · FeedView · DiscoverView · CharacterDetailView · PostCard …
```

> 캐릭터 아바타는 저작권 이슈를 피하기 위해 이모지 + 그라데이션으로 표현합니다.
