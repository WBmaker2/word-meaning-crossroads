# Word Meaning Crossroads Education Web App Redesign Report

작성일: 2026-08-30
실행 모드: full
대상: `/Volumes/ External Drive 256G/Dev2/codex/word-meaning-crossroads`
현재 상태: 리디자인 구현·자동 검증·GitHub Pages 배포 완료; 사람 검토와 VoiceOver는 범위 밖

## 1. 범위와 결론

기존 앱은 Next.js가 아닌 Vite 8 + React 19 + TypeScript 6 기반의 정적 SPA였습니다. 초등 3~4학년 학습자가 첫 화면에서 할 일을 빨리 이해하고, 각 단계의 핵심 행동과 다음 행동을 놓치지 않도록 입구·공통 셸·문맥·진행 표시·기록 화면의 위계를 리디자인했습니다.

다음 계약은 그대로 보존했습니다.

- `입구 → 문맥 → 단서 → 뜻 → 비교 → 단서 가리기 → 문장 정비 → 탐사 기록` 상태 전이와 core·extension·all 경로
- 8개 낱말, 24개 장면, 8개 단서 가리기, 8개 문장 정비 콘텐츠와 기존 평가 함수·reducer·기록 모델
- 화면 텍스트만 사용하는 MVP. 음성 재생·녹음·TTS·교사용 읽어주기·VoiceOver 구현/검증은 범위에서 제외
- 학생 이름·학번·반·학교·이메일을 받지 않는 개인정보 경계, 저장소·쿠키·외부 요청·원격 폰트·분석 SDK 미사용
- `gi-pulse`는 필수 학습 CTA인 `단서 찾기`, `뜻 확인`에만 적용하고 reduced-motion에서는 정적 외곽선과 `필수` 배지로 대체

자동 검증 기준은 모두 통과했습니다. 실제 초등학생·교사 사용성 승인과 VoiceOver는 이 범위에 포함하지 않았고, HVC 등록은 수행하지 않았습니다.

## 2. 먼저 확인한 규칙과 계획

| 문서/경로 | 확인 결과 | 적용 내용 |
|---|---|---|
| 저장소 루트 `AGENTS.md` | 없음 | 사용자·상위 지침과 제품 설계 문서를 기준으로 삼음 |
| 저장소 루트 `EDUCATION_DESIGN.md` | 없음 | 별도 문서가 없어 설계 문서와 기존 구현 계약을 적용 |
| `design-system/MASTER.md` | 존재, 2026-08-29 작성 | 라이트 모드, 읽기 폭, 토큰, 카드·버튼·포커스·반응형·모션 규칙 적용 |
| `2026-08-26-word-meaning-crossroads-design.md` | 전체 확인 | 학습 목표, 콘텐츠·판정, 접근성, 개인정보, MVP와 완료 기준 보존 |
| `2026-08-26-word-meaning-crossroads-implementation-plan.md` | 확인 | 기존 구현 범위와 파일·테스트 계약을 침범하지 않음 |
| `work/education-webapp-redesign-plan.md` | 이번 작업 계획 | 조사 → 감사 → TDD → 구현 → 검증 순서와 롤백·릴리스 경계 기록 |

초기 감사와 자산 감사는 구현 전에 저장했습니다.

- [계획 문서](./education-webapp-redesign-plan.md)
- [초기 UX/UI 감사](./education-webapp-redesign-audit.md)
- [자산 감사](./education-webapp-redesign-assets.md)
- [디자인 시스템](../design-system/MASTER.md)

## 3. 지원 Skill 점검

| Skill | 상태·실제 경로 | 2026-08-30 실행 내용 |
|---|---|---|
| `impeccable` | available — `/Users/kimhongnyeon/.codex/skills/impeccable/SKILL.md` | 컨텍스트 점검과 최종 detector 실행. 결과 `[]` |
| `ui-ux-pro-max` | available — `/Users/kimhongnyeon/.codex/skills/ui-ux-pro-max/SKILL.md` | 교육용 모바일·키보드·반응형 검색을 참고. 일반 Neumorphism 권고는 기존 교육용 라이트 시스템과 맞지 않아 채택하지 않음 |
| `redesign-existing-projects` | available — `/Users/kimhongnyeon/.codex/skills/redesign-existing-projects/SKILL.md` | 기존 라우팅·콘텐츠·상태를 보존하는 점진적 리디자인 원칙 적용 |
| `imagegen` | available — `/Users/kimhongnyeon/.codex/skills/imagegen/SKILL.md` | 자산 교체가 필요하지 않아 실행하지 않음. 관련 안전 기준은 `references/asset-safety.md`를 확인 |

초기 감사 문서의 당시 지원 스킬 미제공 기록은 감사 시점의 환경 기록이며, 이번 구현 시점에는 위 경로의 문서를 실제로 읽고 적용했습니다. 별도의 사람 디자인 승인이나 학습자 승인을 자동 검증 결과로 대신하지 않았습니다.

## 4. 구현 결과

### 화면 구조와 학습 위계

- `src/app/App.tsx`: 읽기 설정을 `읽기 설정` 제목·힌트·컨트롤이 있는 패널로 묶고, 활동 화면에서 진행 표시가 카드보다 먼저 오도록 셸을 정리했습니다.
- `src/components/screens/EntranceScreen.tsx`: 학습 목표(`entrance-goal`)와 경로 목록(`entrance-routes`)을 분리하고 첫 경로에 `처음이라면 여기부터` 배지를 추가했습니다. 기존 경로 순서·버튼 이름·`onStartRoute` 계약은 유지했습니다.
- `src/components/screens/ContextSceneScreen.tsx`: 문장·텍스트 전용 안내·최초 예상 입력·`단서 찾기`를 `context-action-zone`으로 묶어 첫 행동을 찾기 쉽게 했습니다. 60자 제한, 레이블, ARIA와 개인정보 문구는 유지했습니다.
- `src/components/common/ProgressHeader.tsx`: 기존 accessible name `현재 낱말 x/y · 장면 x/3`을 유지하면서 시각적 진행 rail/fill을 추가했습니다.
- `src/components/screens/ExplorationRecordScreen.tsx`: 배운 점·해낸 것 요약 바로 뒤에 다시 하기·입구·인쇄 조작을 배치해 상세 응답을 읽기 전에 다음 행동을 찾게 했습니다. 인쇄 동작과 기록 데이터는 바꾸지 않았습니다.

### 스타일과 토큰

- `src/styles/tokens.css`: 카드·패널 반경과 카드 그림자 토큰을 추가했습니다.
- `src/styles/base.css`, `layout.css`, `components.css`: 공통 타이포그래피·셸 폭·카드·패널·버튼·상태 표면을 정리하고 기존 CSS 소유권 계약을 유지했습니다.
- `src/styles/redesign.css`: 진행 rail, 입구·문맥·기록의 화면별 간격과 320/375/768/1280px 압축 규칙을 별도 파일로 분리했습니다.
- `src/main.tsx`: `redesign.css`를 `components.css` 다음, `motion.css` 이전에 불러옵니다.
- `src/styles/print.css`: 인쇄 시 읽기 설정 패널을 숨기고 기록 출력 순서를 보존합니다.
- 모든 변경·신규 소스·테스트·스타일 파일은 500줄 미만입니다. 기존 `tests/e2e/helpers/cssSyntax.ts`가 499줄로 상한에 가장 가깝고, 기능을 더 합치지 않았습니다.

### 콘텐츠·자산·업데이트 기록

- `src/content/updateHistory.ts` 맨 앞에 `2026-08-29` 리디자인 내역을 추가했습니다.
- `src/components/common/NeutralCrossroadsIllustration.tsx`의 의미 중립 inline SVG와 `public/favicon.svg`는 정답·낱말 뜻을 노출하지 않으므로 그대로 보존했습니다. 새 이미지·원격 폰트·CDN·`<img>` 자산을 추가하지 않았고, 따라서 imagegen은 실행하지 않았습니다.

### 테스트 보강

- `src/app/App.test.tsx`: 읽기 설정 패널, 진행 rail, 업데이트 날짜·순서를 고정했습니다.
- `src/components/screens/EntranceAndContextScreens.test.tsx`: 입구 목표·경로 위계와 문맥 action zone을 검증합니다.
- `src/components/screens/ExplorationRecordScreen.test.tsx`: 결과 요약 다음에 조작이 오는 순서를 검증합니다.
- `src/components/common/LiveRegion.test.tsx`: 새 업데이트 날짜를 검증합니다.
- `tests/e2e/responsive.spec.ts`: 375px에서 첫 경로 CTA가 viewport에 도달하는 계약을 추가했습니다.
- `tests/e2e/helpers/cssOwnership.ts`, `tests/e2e/style-ownership.spec.ts`: 새 클래스의 CSS 책임과 소유권을 고정했습니다.

## 5. TDD 및 검증 결과

구현은 실패 테스트를 먼저 만든 뒤 최소 구조·스타일을 추가하고 같은 테스트를 통과시키는 순서로 진행했습니다.

1. RED: 새 DOM 순서·래퍼·진행 rail assertion을 추가한 직후 5개 assertion이 실패했습니다. 누락된 대상은 `reading-settings`, 진행 label/rail, 입구 래퍼, 문맥 action zone, 기록 action 순서였습니다.
2. GREEN: 필요한 래퍼와 토큰·CSS만 구현하고 상태 전이·평가·콘텐츠를 건드리지 않았습니다.
3. REGRESSION: 전체 단위·브라우저·스타일 소유권·반응형·모션·개인정보·학습 흐름 게이트를 다시 실행했습니다.

| 검증 | 명령/방법 | 결과 |
|---|---|---|
| 린트 | `npm run lint` | exit 0, 경고 0 |
| 단위·컴포넌트 | `npm run test:run` | 14개 파일, 149개 테스트 통과. jsdom canvas `getContext` 경고 4건만 있었고 기능 실패는 없음 |
| 타입·프로덕션 빌드 | `npm run build` | exit 0, `tsc -b`와 Vite production build 성공 |
| CSS 소유권 | `npx playwright test tests/e2e/style-ownership.spec.ts --project=chromium --workers=1` | 8 passed |
| 전체 Chromium E2E | `npx playwright test --project=chromium --workers=1` | 34 passed. 첫 sandbox 실행의 macOS Chromium `MachPortRendezvous` 오류는 환경 lifecycle 문제였으며, 별도 안정 preview에서 재실행해 34/34 확인 |
| 리디자인 detector | `node /Users/kimhongnyeon/.codex/skills/impeccable/scripts/detect.mjs --json ...변경 UI/CSS 파일` | exit 0, 결과 `[]` |
| 수평·확대·모션 수동 스크립트 | production preview에서 `/private/tmp/wmc-final-responsive-audit.mjs` 실행 | 320/375/768/1280px 모두 `scrollWidth === clientWidth`, 200%에서도 가로 넘침 없음, reduced-motion 애니메이션 `none` |

전체 Chromium E2E에는 core·extension·all learner flow, 오답 회복, 키보드 흐름, axe·DOM 의미 구조, 개인정보·텍스트 전용, print, motion, responsive가 포함됩니다. `tests/e2e`는 현재 구성된 34개 테스트를 사용했으며, VoiceOver 실제 음성 검증은 실행하지 않았습니다.

## 6. 반응형·시각 검수 관찰

production preview에서 다음 뷰포트를 확인했습니다.

- 320px: 카드와 버튼이 잘리지 않고 가로 넘침이 없습니다. 첫 CTA는 자연스러운 세로 스크롤 뒤에 도달합니다.
- 375×812px: 목표·경로 위계가 읽히며 첫 경로 CTA가 viewport 하단에 걸쳐 보이고 테스트의 `toBeInViewport()`를 통과합니다.
- 768px: 카드가 읽기 순서를 유지하는 단일 열 중심으로 쌓이며 텍스트가 겹치지 않습니다.
- 1280×900px: 약 60rem 읽기 폭 안에 목표·경로 카드가 정돈되고 첫 경로가 시각적으로 구분됩니다.
- 200% 글자: `scrollWidth`와 `clientWidth`가 같고 정보가 잘리지 않습니다.
- `prefers-reduced-motion: reduce`: 필수 CTA의 pulse가 애니메이션 없이 정적 외곽선·배지로 표시됩니다.

스크린샷은 `/private/tmp/wmc-final-entrance-320.png`, `/private/tmp/wmc-final-entrance-375.png`, `/private/tmp/wmc-final-entrance-768.png`, `/private/tmp/wmc-final-entrance-1280.png`에 임시 생성했으며 저장소에는 추가하지 않았습니다. 이는 도구 기반 시각 관찰이지 초등학생·교사의 대면 승인 결과가 아닙니다.

## 7. 접근성·안전 확인

- heading/landmark/fieldset legend, 버튼 accessible name, `:focus-visible` 고대비 외곽선, 44px 조작면, 키보드 Tab·Enter·Space 흐름을 유지했습니다.
- 전역 `data-feedback-announcer` live region은 하나만 유지하고, 시각 피드백과 중복 발표하지 않습니다.
- 브라우저 axe·DOM 의미 구조·키보드 E2E는 통과했습니다. VoiceOver 구현·수동 검증·자동화는 사용자 범위 지시에 따라 제외했습니다.
- React 기본 텍스트 렌더링을 유지해 unsafe HTML sink를 추가하지 않았습니다.
- 학생 입력은 기존 메모리 상태에만 머물며 localStorage/sessionStorage/IndexedDB/cookie, 네트워크 요청, 외부 이미지·폰트·분석 SDK가 없습니다.
- 답을 암시할 수 있는 semantic ID를 새로 만들지 않았고, 기존 텍스트 콘텐츠·평가 경계도 수정하지 않았습니다.

## 8. 릴리스 결과와 남은 단계

사용자의 별도 커밋·푸시·배포 승인에 따라 다음 릴리스를 완료했습니다.

1. 리디자인 변경을 `0280589` (`feat: redesign learner experience`)로 커밋했습니다.
2. 작업 브랜치 `codex/education-webapp-redesign`를 원격에 푸시하고 [PR #1](https://github.com/WBmaker2/word-meaning-crossroads/pull/1)을 `main`에 병합했습니다. 병합 커밋은 `1b2edd7`입니다.
3. [GitHub Pages workflow 33291827271](https://github.com/WBmaker2/word-meaning-crossroads/actions/runs/33291827271)의 build/deploy job이 모두 성공했습니다.
4. 공개 학습자 경로 [https://wbmaker2.github.io/word-meaning-crossroads/](https://wbmaker2.github.io/word-meaning-crossroads/)가 HTTP 200을 반환했고 제목 `낱말 뜻 갈림길`, 생성 JS/CSS 자산 HTTP 200을 확인했습니다.

현재 작업트리는 `main`과 `origin/main`이 `1b2edd7`에서 일치하며 깨끗합니다. 실제 초등학생·교사 사용성 세션과 HVC 등록은 별도 승인 후 진행할 수 있습니다. VoiceOver와 음성 기능은 명시된 텍스트 전용 범위에서 제외합니다.
