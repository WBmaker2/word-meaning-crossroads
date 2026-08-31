# Elementary Learner UX Improvement Report

작성일: 2026-08-31
대상: `/Volumes/ External Drive 256G/Dev2/codex/word-meaning-crossroads`
상태: 구현·자동 검증·커밋·푸시·GitHub Pages 배포 완료

## 결과 요약

초등학교 3~4학년 준호를 가정한 도구 기반 학습자 관찰에서 찾은 P2/P3 문제를 세 가지 작은 변경으로 해결했다.

1. 단서 안내의 `어절`을 `말`로 바꾸어 처음 행동을 바로 이해하게 했다.
2. 단서 가리기 전에 “단서 하나를 가리고도 뜻이 보이는지 살펴봐요.”를 보여 주고 accessible description으로 연결했다.
3. 단서 선택 버튼에 점선 밑줄을 표시하고, 제목·선택 카드의 한글 단어가 음절 중간에서 끊기지 않게 했다.

학습 판정, reducer 상태 전이, 콘텐츠 ID·문장·순서, 개인정보 경계, `gi-pulse`·reduced-motion, 텍스트 전용 범위는 그대로 유지했다. 앱 수정 날짜는 업데이트 내역에 `2026-08-31`로 기록했다.

## 관찰 근거

- 주 사용자 모델: `student-personas.md`의 초등 3~4학년 준호.
- 확인 화면: 입구, 첫 문맥, 단서 조사, 뜻 선택, 오답 피드백, 비교, 단서 가리기.
- 확인 뷰포트: 375×812와 1280×900, 200% 글자·넓은 줄 간격 회귀.
- 캡처: `/private/tmp/wmc-ux-final-mobile-context.png`, `/private/tmp/wmc-ux-final-mobile-clue.png`, `/private/tmp/wmc-ux-final-mobile-meaning.png`, `/private/tmp/wmc-ux-final-desktop-clue.png`.
- 기존 리디자인 감사·출시 보고서는 중복 수행하지 않고 기준선으로 재사용했다.

실제 초등학생·교사 대면 사용성 세션이 아니라 화면·DOM·자동화에 기반한 시뮬레이션이다. 대면 승인을 통과했다고 표현하지 않는다.

## 변경 파일과 책임

| 파일 | 변경 |
|---|---|
| `src/components/screens/ClueInvestigationScreen.tsx` | 학생용 clue-help 문구와 `token-choice--available` class |
| `src/components/screens/ComparisonScreen.tsx` | 단서 가리기 목적 문단과 `aria-describedby` 연결 |
| `src/styles/components.css` | 미선택 token 점선, 선택 token 실선 우선순위 |
| `src/styles/redesign.css` | 한글 단어 단위 줄바꿈, 200% 확대용 min-width 경계 |
| `tests/e2e/helpers/cssOwnership.ts` | 새 class·declaration의 소유권 허용 목록 |
| `src/components/screens/ClueInvestigationScreen.test.tsx` | 새 clue-help와 token class assertion |
| `src/components/screens/ComparisonScreen.test.tsx` | 목적 문구·accessible description assertion |
| `tests/e2e/responsive.spec.ts` | 375px heading word-break·점선 computed style assertion |
| `tests/e2e/screen-reader.spec.ts` | necessity accessible description 회귀 |
| `src/content/updateHistory.ts` | 2026-08-31 개선 날짜·내역 |
| `src/app/App.test.tsx`, `src/components/common/LiveRegion.test.tsx` | 최신 날짜·업데이트 목록 회귀 |

모든 구현·테스트·스타일 파일은 500줄 미만이며, 현재 가장 큰 파일은 기존 `tests/e2e/helpers/cssSyntax.ts` 499줄이다.

## TDD 기록

1. RED: 문구·class·description assertion을 먼저 추가했고 focused Vitest에서 2건이 실패했다.
2. GREEN: 화면 문구·semantic class·CSS·description만 추가해 focused Vitest 37/37을 통과시켰다.
3. 회귀 중 `word-break: keep-all`이 200%에서 의미 선택 fieldset를 410px로 키우는 문제를 geometry로 확인했다.
4. 선택 group/card와 grid 자식에 `min-width: 0`을 추가하고 build 후 확대·오답 회복 2/2를 통과시켰다.
5. CSS 소유권 목록에 새 class와 `text-decoration-style`을 등록한 뒤 전체 E2E를 재실행했다.

## 검증 결과

| 검증 | 명령 | 결과 |
|---|---|---|
| 단위·컴포넌트 | `npm run test:run` | 14 files, 149 tests passed; jsdom canvas 경고 4건은 기능 실패 아님 |
| 린트 | `npm run lint` | exit 0, warning 0 |
| 타입·빌드 | `npm run build` | exit 0, TypeScript와 Vite production build 성공 |
| 전체 Chromium | `npx playwright test --project=chromium --workers=1` | 34/34 passed |
| 핵심 학습 흐름 | `student-flow.spec.ts` | core·extension·all·오답 회복 통과 |
| 반응형·확대 | `responsive.spec.ts` | 375px·200%·넓은 줄 간격, horizontal overflow 0 |
| DOM·axe·키보드 | `screen-reader.spec.ts`, `keyboard.spec.ts` | role/name/description·axe·키보드 흐름 통과 |
| 모션·인쇄·개인정보 | `motion.spec.ts`, `print.spec.ts`, `privacy.spec.ts` | reduced-motion·인쇄·text-only/privacy 계약 통과 |
| CSS 소유권 | `style-ownership.spec.ts` | 8/8 passed |
| 공백·파일 크기 | `git diff --check`, `wc -l` | diff 오류 0, 500줄 이상 구현 파일 0 |

첫 샌드박스 Chromium 실행은 macOS `MachPortRendezvous ... Permission denied`로 시작 전에 종료되었다. Playwright wrapper는 root 소유 npm cache EPERM이 두 차례 확인되어 재호출하지 않았고, 외부 실행 승인된 프로젝트 로컬 `npx playwright`로 최종 34/34를 확인했다.

## 릴리스 증거

- 기능 커밋: `be94aee` — `fix: clarify elementary learner cues`
- 병합 커밋: `7323301` — PR [#5](https://github.com/WBmaker2/word-meaning-crossroads/pull/5)
- Pages workflow: [33348994248](https://github.com/WBmaker2/word-meaning-crossroads/actions/runs/33348994248) — build·deploy 모두 성공
- 공개 주소: [https://wbmaker2.github.io/word-meaning-crossroads/](https://wbmaker2.github.io/word-meaning-crossroads/)
- 배포 후 공개 브라우저 확인: 제목 `낱말 뜻 갈림길`, 입구의 `기본 길 4개`, 첫 문맥 화면, 375×812 가로 넘침 0, HTTP 실패 응답 0, 콘솔 오류 0

## 범위 제외와 현재 공개 상태

- VoiceOver 실제 음성 검증, TTS, 음성 재생·녹음은 텍스트 전용 요청에 따라 구현·검증하지 않았다.
- 실제 학생·교사 대면 검증은 아직 수행하지 않았다.
- HVC 등록은 실행하지 않았다.
- 위 공개 주소에 이번 개선 커밋이 반영되었고, 배포 후 learner path 확인까지 완료했다.
