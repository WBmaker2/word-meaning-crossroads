# Word Meaning Crossroads Elementary Learner UX Improvement Plan

작성일: 2026-08-31
대상: `/Volumes/ External Drive 256G/Dev2/codex/word-meaning-crossroads`
실행 모드: `full`
현재 단계: 구현·검증·커밋·푸시·배포 완료

## Goal

초등학교 3~4학년(8~10세) 학습자가 화면을 처음 보았을 때 “어디를 읽고, 무엇을 눌러야 하는지”를 바로 찾도록 문장 안내와 조작 단서를 개선한다. 현재 앱의 다음 학습 계약은 그대로 보존한다.

- `입구 → 문맥 → 단서 조사 → 뜻 표지판 → 비교 갈림길 → 단서 가리기 → 문장 정비 → 탐사 기록` 상태 흐름
- 기본·확장·전체 경로, 8개 낱말·24개 장면·8개 단서 가리기·8개 문장 정비의 순서와 판정 결과
- `ContextSceneScreenProps`, `ClueInvestigationScreenProps`, `ComparisonScreenProps`, `RequiredActionButton`, `FeedbackInput`, reducer/evaluator 인터페이스
- 학생 이름·학번·반·학교·이메일을 받지 않는 개인정보 경계와 메모리 전용 응답
- 텍스트 전용 범위. 음성 재생·녹음·TTS·읽어주기·미디어 컨트롤·VoiceOver 구현 및 검증은 추가하지 않는다.

### 관찰로 정한 개선 목표

1. 제목과 선택 카드에서 한글 단어가 음절 단위로 갈라지지 않도록 읽기 단위를 보존한다.
2. 단서 조사 화면의 선택 가능한 말에 처음부터 알아볼 수 있는 점선 밑줄을 제공한다. 선택했을 때의 기존 체크·실선 밑줄은 유지한다.
3. 어린이 안내에서 `어절`을 `말`로 바꾸고, 단서 가리기 활동의 목적을 한 문장으로 먼저 알려 준다.

## Evidence and scope boundary

### 수행한 기준 점검

- Stage 0 preflight: `work/elementary-webapp-ux-bootstrap.md`, 상태 `ready`.
- 기존 리디자인 계획·감사·디자인 시스템·교육과정·사전·포용성 문서를 확인했다. 기존 리디자인은 이미 출시되어 있으므로 이번 문서는 중복 리디자인이 아니라 학습자 언어와 조작 발견성에 대한 후속 개선으로 한정한다.
- 기존 preview에서 `npx playwright test tests/e2e/student-flow.spec.ts tests/e2e/responsive.spec.ts tests/e2e/keyboard.spec.ts --project=chromium --workers=1`을 외부 실행 경로로 수행했고 13/13이 통과했다. 첫 샌드박스 실행은 macOS Chromium `MachPortRendezvous ... Permission denied`로 시작 전에 종료되어 환경 실패로 분리했다.
- 기준 화면 캡처: `/private/tmp/wmc-ux-baseline-entrance-mobile.png`, `/private/tmp/wmc-ux-baseline-entrance-desktop.png`, `/private/tmp/wmc-ux-mobile-context.png`, `/private/tmp/wmc-ux-mobile-clue.png`, `/private/tmp/wmc-ux-mobile-meaning.png`, `/private/tmp/wmc-ux-mobile-comparison.png`, `/private/tmp/wmc-ux-mobile-hidden-cue.png`, `/private/tmp/wmc-ux-mobile-wrong-meaning.png`.

### 관찰 판정

관찰은 실제 학생의 대면 사용성 승인 결과가 아니라 `student-personas.md`의 주 사용자 준호(초등 3~4학년)를 가정한 도구 기반 시뮬레이션이다. 375×812 화면에서 문맥·단서·뜻·비교·단서 가리기 화면을 순서대로 확인했다.

| 관찰 | 영향 | 개선 계약 |
|---|---|---|
| `문장을 읽고 처음 생각을 적어 보아요`와 뜻 카드 설명이 모바일에서 `보아/요`, `얼/음`처럼 음절 중간에서 줄바꿈됨 | 읽는 속도가 끊기고 어린이가 다른 단어로 오해할 수 있음 | 제목·범례·선택 카드의 단어 단위 줄바꿈을 우선하고, 200% 글자에서도 가로 넘침이 없어야 함 |
| 단서 조사 문장의 선택 버튼이 배경·테두리 없이 일반 글자처럼 보임 | “어떤 말을 눌러야 하나요?”를 스스로 발견하기 어려움 | 미선택 `.token-choice`에 은은한 점선 밑줄, 선택 상태에는 기존 실선 밑줄·체크 유지 |
| `뜻을 결정하는 데 도움이 되는 어절`과 `필요 단서를 찾아 보아요`가 첫 안내에서 추상적으로 느껴짐 | 첫 행동 전에 교육 용어를 해석해야 함 | `뜻을 알려 주는 말을 최대 두 개 골라요`, `단서 하나를 가리고도 뜻이 보이는지 살펴봐요`로 짧게 안내 |
| 오답 피드백, 텍스트 전용 안내, 개인정보 안내는 현재 색·레이아웃 계약으로 구분 가능 | 새 결함 없음 | 이번 범위에서는 색상 체계·피드백 구조·privacy 문구를 변경하지 않음 |

## Architecture

상태와 교육 판정은 건드리지 않고, 학생이 읽고 조작하는 화면 계층만 보강한다.

```text
App shell
  ├─ ProgressHeader (기존 단계·장면 진행)
  └─ phase screen
       ├─ ContextSceneScreen (문장 읽기·첫 생각)
       ├─ ClueInvestigationScreen (선택 가능한 말의 시각 affordance)
       ├─ MeaningSignpostScreen (단어 단위 선택 카드 줄바꿈)
       └─ ComparisonScreen (단서 가리기 목적 안내)
```

- `ClueInvestigationScreen`은 `TokenButton`에 `token-choice--available` 클래스를 추가한다. `aria-pressed`, `aria-label`, `TokenId`, 최대 두 개 선택, evaluator 호출은 그대로 둔다.
- `ComparisonScreen`은 `necessity-challenge` 안에 `necessity-help` 단락을 추가하고 section에 `aria-describedby="necessity-help"`를 연결한다. 기존 heading accessible name과 `challenge` 데이터는 변경하지 않는다.
- 제목·legend·선택 카드·버튼·레이블에는 `word-break: keep-all`을 적용하고, 길이가 긴 비한글 문자열만 `overflow-wrap: anywhere`로 안전하게 줄바꿈한다.
- 새로운 전역 상태·라우터·스토리지·네트워크·이미지·폰트는 만들지 않는다.

## Tech Stack

- Vite 8, React 19, TypeScript 6
- Vitest + Testing Library + `@testing-library/user-event`
- Playwright Chromium와 기존 `playwright.config.ts`
- 기존 CSS custom properties와 `src/styles/base.css`, `components.css`, `redesign.css`, `motion.css`
- 새 npm 패키지 설치 없음

## Spec

### 학생용 문구

| 파일 | 현재 문구 | 변경 문구 | 합격 조건 |
|---|---|---|---|
| `src/components/screens/ClueInvestigationScreen.tsx` | `목표 낱말을 빼고, 뜻을 결정하는 데 도움이 되는 어절을 최대 두 개 골라요.` | `목표 낱말은 빼고, 뜻을 알려 주는 말을 최대 두 개 골라요.` | `#clue-help`와 sentence description에 새 문구가 보이고 기존 최대 2개 규칙이 동작함 |
| `src/components/screens/ComparisonScreen.tsx` | 단서 가리기 전 목적 설명 없음 | `단서 하나를 가리고도 뜻이 보이는지 살펴봐요.` | `#necessity-help`가 heading 다음에 보이고 section accessible description에 포함됨 |

기존 문맥·뜻·정비·기록 문구는 교육과정·사전·포용성 승인 문서와 이미 맞으므로 이번 범위에서 바꾸지 않는다. `어절`이라는 용어가 필요한 내부 문서나 숨김 설명은 학생에게 노출되는 안내와 구분해 유지한다.

### 조작 발견성

- `TokenButton` 미선택 상태: 클래스 `token-choice token-choice--available`, 점선 밑줄과 충분한 대비를 제공한다.
- 선택 상태: `token-choice--selected token-underline`와 체크·`선택됨` accessible name을 유지한다.
- hover/focus 상태: 기존 배경·`focus-visible` 고대비 외곽선을 유지하고 점선이 포커스 링을 대신하지 않게 한다.
- 일반 버튼·뜻 카드·문장 정비 카드에는 `token-choice--available`을 붙이지 않는다.

### 읽기 단위와 반응형

- `h1`~`h5`, fieldset legend, 학생에게 보이는 label·button·선택 카드 copy에 `word-break: keep-all`을 적용한다.
- `p`, 문장 토큰, 기록 응답은 현재 `overflow-wrap` 계약을 유지해 긴 입력이나 예상 밖 문자열이 가로로 넘치지 않게 한다.
- 320px, 375×812px, 768px, 1280px 및 200% 글자·`넓게` 줄 간격에서 `document.documentElement.scrollWidth <= clientWidth`를 유지한다.

### 접근성·안전

- `#clue-help`, `#necessity-help`, 기존 `aria-describedby` 연결을 DOM 테스트와 axe 테스트로 확인한다.
- 선택 가능한 말은 색만으로 구분하지 않고 점선·버튼 role·`aria-pressed`를 함께 사용한다.
- 단계 전환·키보드 순서·단일 live region·오답 회복은 변경하지 않는다.
- VoiceOver와 실제 음성 출력은 구현·검증하지 않는다. 키보드·브라우저 의미 구조·axe만 실행한다.

## Global Constraints

1. 이 계획 문서와 감사 문서를 저장한 뒤 소스 코드를 변경한다.
2. `src/domain/evaluation.ts`, `src/domain/sessionReducer.ts`, `src/domain/sessionTypes.ts`, `src/content/wordPacks/*.ts`의 판정·ID·문장은 변경하지 않는다.
3. React 텍스트 렌더링만 사용하고 `dangerouslySetInnerHTML`, 저장소 API, 쿠키, 외부 요청, 원격 폰트·이미지를 추가하지 않는다.
4. `gi-pulse`는 기존 필수 학습 버튼 `단서 찾기`, `뜻 확인`에만 남긴다. 새 애니메이션을 만들지 않고 `prefers-reduced-motion: reduce` 대체 규칙을 유지한다.
5. 단일 소스·테스트·스타일 파일은 500줄 미만으로 유지한다. 현재 상한에 가까운 파일을 더 합치지 않는다.
6. 기존 사용 중인 `.worktrees/implementation`과 관련 없는 사용자 변경은 읽기·수정하지 않는다.
7. 이번 범위에는 커밋·푸시·배포·HVC 등록을 포함하지 않는다. 구현과 검증이 끝난 뒤 별도 승인으로 결정한다.
8. 동일한 원인의 실행 실패가 세 번 반복되면 더 시도하지 않고 원인과 안전한 대안을 기록한다. Playwright wrapper의 npm cache EPERM은 이미 두 차례 확인했으므로 다시 호출하지 않고 프로젝트 로컬 runner를 사용한다.

## 예상 파일 구조와 책임

| 경로 | 책임 |
|---|---|
| `src/components/screens/ClueInvestigationScreen.tsx` | 학생용 단서 안내 문구와 선택 가능한 말의 semantic class |
| `src/components/screens/ComparisonScreen.tsx` | 단서 가리기 목적 안내와 accessible description |
| `src/styles/redesign.css` | 제목·legend·label·button의 단어 단위 줄바꿈과 200% 최소 너비 경계 |
| `src/styles/components.css` | 미선택 token의 점선 affordance와 선택 상태 우선순위 |
| `src/components/screens/ClueInvestigationScreen.test.tsx` | 안내 문구, token class, aria 상태, 최대 두 개 선택 |
| `src/components/screens/ComparisonScreen.test.tsx` | 단서 가리기 도움말과 accessible description |
| `src/content/updateHistory.ts` | 2026-08-31 개선 날짜와 짧은 내역 |
| `src/components/common/LiveRegion.test.tsx`, `src/app/App.test.tsx` | 업데이트 내역의 최신 날짜·목록 개수 회귀 |
| `tests/e2e/responsive.spec.ts` | 375/200%에서 줄바꿈·overflow·선택 버튼 가시성 |
| `tests/e2e/screen-reader.spec.ts` | DOM accessible name/description, axe serious·critical 0 (VoiceOver 제외) |
| `tests/e2e/student-flow.spec.ts` | core·extension·all 경로와 새 안내 문구가 실제 흐름을 막지 않음 |
| `work/elementary-webapp-ux-plan.md` | 이번 후속 개선의 범위·TDD·수용 기준 |
| `work/elementary-webapp-ux-language-audit.md` | 변경 전·후 학생용 문구와 등급 판정 |
| `work/elementary-webapp-ux-simulation-decision.md` | DOM/SVG 텍스트 상호작용 유지 결정과 시뮬레이션 불필요 사유 |
| `work/elementary-webapp-ux-audit.md` | 관찰 근거, 구현 후 재검수, 남은 human gate |
| `work/elementary-webapp-ux-report.md` | 최종 변경·검증·미실행 범위 보고 |

## 작업 순서와 TDD 계약

### Step 1 — 학습자 언어 감사 문서 저장

- **Files:** `work/elementary-webapp-ux-language-audit.md`
- **Interfaces:** 학생에게 보이는 문자열, `ClueInvestigationScreen`, `ComparisonScreen`, `child-language-rubric.md`
- **작업:** 후보 스크립트의 테스트·문서 false positive를 제외하고 실제 runtime 문자열만 대조한다. `어절`→`말`과 단서 가리기 도움말을 짧음·구체성·행동 명확성·포용성 기준으로 기록한다.
- **합격 조건:** 각 변경 문자열에 원문, 변경문, 대상 화면, 어린이에게 기대하는 행동, P0~P3 등급, 교육 의미 보존 근거가 있다.

### Step 2 — 시뮬레이션 판정 문서 저장

- **Files:** `work/elementary-webapp-ux-simulation-decision.md`
- **Interfaces:** 기존 DOM 버튼·radio·fieldset, `NeutralCrossroadsIllustration`, `educational-interactive-simulation-policy.md`
- **작업:** 학습 목표가 문장 속 단서 찾기이므로 새 게임·canvas·drag simulation이 필요한지 판정한다. 현재 DOM 버튼과 텍스트·중립 SVG가 목표 행동을 직접 지원하므로 `not-needed`로 기록한다.
- **합격 조건:** 구현하지 않는 상호작용의 이유, 유지하는 DOM/SVG 근거, 위험·대안, 테스트 범위가 명시되어 있다.

### Step 3 — RED: 문구·affordance·줄바꿈 계약 테스트 추가

- **Files:** `src/components/screens/ClueInvestigationScreen.test.tsx`, `src/components/screens/ComparisonScreen.test.tsx`, `tests/e2e/responsive.spec.ts`, `tests/e2e/screen-reader.spec.ts`
- **TDD 작업:**
  1. Clue 단위 테스트에 `#clue-help`의 새 문구와 선택 가능한 첫 토큰의 `token-choice--available` 클래스를 추가한다.
  2. Comparison 단위 테스트에 `#necessity-help` 텍스트와 section accessible description을 추가한다.
  3. 브라우저 테스트에 375px에서 available token의 점선 computed style, 200%에서 heading computed `word-break: keep-all`, 수평 overflow 0을 추가한다.
  4. `npm run test:run -- src/components/screens/ClueInvestigationScreen.test.tsx src/components/screens/ComparisonScreen.test.tsx`와 targeted Playwright를 실행해 새 assertion이 현재 코드에서 실패하는 RED를 확인한다.
- **예상 RED:** 새 문구·클래스·도움말·CSS computed 값이 없어 해당 assertion이 실패하고 기존 학습 흐름 assertion은 통과한다.

### Step 4 — GREEN: 최소 소스·스타일 구현

- **Files:** `src/components/screens/ClueInvestigationScreen.tsx`, `src/components/screens/ComparisonScreen.tsx`, `src/styles/redesign.css`, `src/styles/components.css`
- **Interfaces:** 기존 props와 callbacks, `TokenButton`, `ContextScene`, `CueNecessityChallenge`
- **작업:**
  1. `TokenButton`에 미선택 available class를 추가하고 선택 class 우선순위를 유지한다.
  2. Clue help 문구를 `목표 낱말은 빼고, 뜻을 알려 주는 말을 최대 두 개 골라요.`로 바꾼다.
  3. Comparison necessity section에 `p#necessity-help`와 `aria-describedby`를 연결한다.
  4. 단어 단위 줄바꿈과 점선 밑줄을 최소 CSS로 추가한다. 토큰·버튼의 44px 조작면과 reduced-motion은 바꾸지 않는다.
- **합격 조건:** Step 3의 모든 새 테스트가 GREEN이고, evaluator/reducer 호출 횟수·결정값·phase 전이가 기존과 같다.

### Step 5 — 회귀 검증과 시각 재검수

- **Files:** 변경된 소스·테스트·CSS, `work/elementary-webapp-ux-audit.md`
- **명령(구현 후 실행):**
  ```sh
  npm run test:run -- src/components/screens/ClueInvestigationScreen.test.tsx src/components/screens/ComparisonScreen.test.tsx
  npm run test:run
  npm run lint
  npm run build
  npx playwright test tests/e2e/responsive.spec.ts tests/e2e/screen-reader.spec.ts tests/e2e/student-flow.spec.ts --project=chromium --workers=1
  git diff --check
  find src tests -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 | xargs -0 wc -l
  ```
- **예상 결과:** focused 테스트는 새 문구·class·description을 통과하고, 전체 Vitest·lint·build·Chromium E2E·diff check가 성공한다. `src`와 `tests`의 구현 파일에 500줄 이상이 없다. VoiceOver는 실행하지 않는다.
- **시각 확인:** 375×812와 1280×900에서 제목 단어가 음절 중간에서 끊기지 않고, 단서 선택 말의 점선 밑줄·선택 체크·주요 CTA가 보인다. 200% 글자·`넓게`·reduced motion에서도 overflow·겹침이 없다.

### Step 6 — 보고서와 릴리스 증거

- **Files:** `work/elementary-webapp-ux-audit.md`, `work/elementary-webapp-ux-language-audit.md`, `work/elementary-webapp-ux-simulation-decision.md`, `work/elementary-webapp-ux-report.md`
- **작업:** 초기 관찰과 구현 후 결과를 분리해 기록하고, 실제 초등학생·교사 승인과 VoiceOver는 실행하지 않은 범위로 남긴다. 커밋·푸시·Pages 배포와 공개 learner path 확인은 승인 후 완료했다.
- **완료된 릴리스 단계:**
  1. `git diff --check`와 전체 검증 로그를 확인했다.
  2. 변경 소스·테스트·감사 문서만 포함해 `be94aee`를 커밋했다.
  3. 작업 브랜치를 원격에 푸시하고 PR [#5](https://github.com/WBmaker2/word-meaning-crossroads/pull/5)를 `main`에 병합해 `7323301`을 만들었다.
  4. Pages workflow [33348994248](https://github.com/WBmaker2/word-meaning-crossroads/actions/runs/33348994248)의 build·deploy 성공과 공개 learner path를 확인했다.

## Acceptance matrix

| 영역 | 합격 기준 | 증거 |
|---|---|---|
| 학습 흐름 | core·extension·all이 기존 순서로 기록 화면에 도달 | `student-flow.spec.ts` |
| 문구 | `어절` 대신 `말`, 단서 가리기 목적 문장 노출, 교육 의미 불변 | `ClueInvestigationScreen.test.tsx`, `ComparisonScreen.test.tsx`, language audit |
| 조작 발견성 | 미선택 단서 토큰 점선, 선택 시 체크·실선, 일반 버튼에는 점선 class 없음 | component test, responsive browser evidence |
| 읽기 | 375px·200%에서 제목·선택 카드 단어 단위 줄바꿈, horizontal overflow 0 | responsive E2E, computed style observation |
| 접근성 | help description 연결, role/name/state 보존, axe serious·critical 0 | screen-reader DOM/axe E2E; VoiceOver 제외 |
| 모션 | 기존 두 필수 CTA만 `gi-pulse`, reduced motion에서 animation none | `motion.spec.ts` 기존 게이트 |
| 개인정보·텍스트 전용 | 저장소·쿠키·외부 요청·`audio` 요소 0, 음성 코드 없음 | `privacy.spec.ts`와 정적 검토 |
| 파일 크기 | 단일 구현·테스트·스타일 파일 500줄 미만 | `wc -l` 결과 |

## Rollback boundary

새 문구·class·CSS·도움말로 기존 테스트나 학습 흐름이 깨지면 변경 파일만 되돌리고 evaluator/reducer·콘텐츠를 건드리지 않는다. 브라우저 실행 환경이 다시 `MachPortRendezvous`로 실패하면 같은 원인의 세 번째 재시도는 하지 않고, 통과한 CI/로컬 단위·정적 증거와 `not run (environment)`를 보고서에 분리한다.

## Implementation completion

- RED에서 문구·class·description assertion 2건이 실패하는 것을 확인했다.
- GREEN에서 `ClueInvestigationScreen`, `ComparisonScreen`, `components.css`, `redesign.css`, CSS 소유권 테스트를 최소 변경했다.
- 2026-08-31 `UPDATE_HISTORY`에 실제 개선 날짜와 내역을 추가하고 최신 날짜·목록 개수 회귀를 갱신했다.
- 전체 Vitest 149/149, lint, build, Chromium E2E 34/34, `git diff --check`를 통과했다.
- VoiceOver·음성 구현/검증·HVC 등록은 실행하지 않았다. 커밋·푸시·Pages 배포는 `be94aee` → `7323301`과 workflow `33348994248`로 완료했다.
