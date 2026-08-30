# Word Meaning Crossroads Education Web App Redesign Plan

작성일: 2026-08-29
실행 모드: full
현재 단계: 구현·자동 검증 완료; 사람 검토·배포는 별도 승인 대기

## Goal

초등 3~4학년 학습자가 첫 화면에서 오늘 할 일을 바로 이해하고, 각 단계에서 해야 할 행동·선택한 근거·다음 행동을 놓치지 않도록 기존 `낱말 뜻 갈림길`의 화면 위계와 반응형 UI를 리디자인한다. 문맥에 따라 낱말 뜻을 구별하고, 단서가 부족할 때 판단을 보류하고, 모호한 문장을 명확하게 고치는 기존 학습 목표와 판정 로직은 보존한다.

리디자인 완료 조건은 다음과 같다.

1. 입구에서 학습 목표, 권장 시간, 경로 선택 순서가 375px 화면의 첫 스크롤 안에서 명확하다.
2. 활동 화면마다 제목·현재 진행·본문·다음 행동의 시각적 위계가 일관되고, 필수 행동 버튼은 기존 `gi-pulse` 계약을 유지한다.
3. 오답 피드백과 다시 선택 조작이 화면 안에서 보이며, 오류 뒤에도 학습 흐름이 끊기지 않는다.
4. 문맥·단서·뜻·비교·정비·기록 화면의 의미 구조, 키보드 순서, 44px 이상 조작면, `prefers-reduced-motion` 대체가 유지된다.
5. 화면 텍스트만으로 모든 학습 정보를 제공하며 음성 녹음·재생·TTS·교사용 읽어주기·VoiceOver 검증은 범위에 포함하지 않는다.
6. 학생 입력, 콘텐츠 ID, 외부 요청, 브라우저 저장소, 인쇄 기록의 기존 개인정보·안전 계약이 바뀌지 않는다.

## Architecture

현재 Vite + React + TypeScript SPA의 `App` → `useMissionSession` → `sessionReducer` → 순수 평가 함수 → 화면 컴포넌트 경계를 유지한다. 리디자인은 프레젠테이션 계층과 CSS 토큰을 중심으로 수행하고, 콘텐츠·평가·상태 전이·기록 검증은 변경하지 않는다.

학습자 화면은 다음 공통 구조를 사용한다.

```text
site header
  ├─ 서비스명
  ├─ 업데이트 내역
  └─ 읽기 설정
progress header (활동 중에만)
single learner card
  ├─ stage kicker
  ├─ focused heading
  ├─ one learning prompt
  ├─ evidence/choice surface
  └─ one primary next action
single live region
```

`App.tsx`는 셸과 공통 설정·진행 표시만 배치한다. `EntranceScreen`은 목표와 경로 선택의 위계를 담당하고, 각 활동 화면은 자신의 콘텐츠·상태·행동만 렌더링한다. 공통 스타일은 `tokens.css` → `base.css` → `layout.css` → `components.css` → `redesign.css` → `motion.css` → `print.css` 순서를 유지한다. `redesign.css`는 리디자인으로 추가된 화면별 간격·반응형 압축 규칙을 담당하며, 기존 CSS 소유권 테스트가 검사하는 셸·레이아웃·컴포넌트 규칙과 충돌하지 않도록 제한한다.

## Tech Stack

- Vite 8, React 19, TypeScript 6
- 기존 React 컴포넌트, CSS 토큰·레이아웃·컴포넌트·모션·인쇄 스타일
- Vitest 4, React Testing Library, `@testing-library/user-event`, `vitest-axe`
- Playwright Chromium, `@axe-core/playwright`
- ESLint
- 새 런타임 의존성·외부 UI 프레임워크·외부 이미지 CDN은 추가하지 않는다.
- 현재의 중립 inline SVG는 정답을 암시하지 않는 개념 자산이므로 유지한다. 일반 장식 자산 교체가 필요하지 않아 imagegen은 `not run`으로 기록한다.

## Spec

### 근거 문서와 범위

- 적용 문서 조사 결과: 저장소 안에 `AGENTS.md`, `EDUCATION_DESIGN.md`, `design-system/MASTER.md`가 없다.
- 제품 설계 기준: `/Volumes/ External Drive 256G/Dev2/codex/word-meaning-crossroads/2026-08-26-word-meaning-crossroads-design.md`
- 기존 구현 계획: `/Volumes/ External Drive 256G/Dev2/codex/word-meaning-crossroads/2026-08-26-word-meaning-crossroads-implementation-plan.md`
- 기존 학습자 개선 계획: `/Volumes/ External Drive 256G/Dev2/codex/word-meaning-crossroads/2026-08-28-word-meaning-crossroads-learner-ux-improvement-plan.md`

### 현재 학습자 여정

`입구 → 경로 선택 → 문맥 읽기·최초 예상 → 단서 조사 → 뜻 선택 → 두 문맥 비교 → 단서 가리기 판단 → 문장 정비 → 탐사 기록`의 상태 전이를 그대로 사용한다. core·extension·all 경로의 낱말 순서와 24개 장면, 8개 단서 가리기 문제, 8개 문장 정비 문제를 바꾸지 않는다.

### 리디자인 계약

| 영역 | 변경 내용 | 보존할 계약 |
|---|---|---|
| 입구 | 목표를 짧은 요약 블록으로 묶고 경로 카드를 한눈에 비교한다. 첫 경로 CTA가 모바일에서 먼저 보이도록 카드 간격과 패딩을 조정한다. | `RouteDefinition`, `onStartRoute`, 기존 버튼 이름·경로 순서 |
| 공통 셸 | 헤더·업데이트 버튼·읽기 설정을 한 묶음의 상단 영역으로 정리하고, 활동 중에는 진행 표시를 콘텐츠보다 먼저 둔다. | `UpdateHistoryDialog`, `TextScaleControls`, `LineSpacingControls`, `ProgressHeader` 인터페이스 |
| 문맥 | 목표 낱말, 문장, 텍스트 전용 읽기 안내, 최초 예상 입력, `단서 찾기`의 위계를 강화한다. 장식 SVG는 낮은 시각 위계로 둔다. | `ContextSceneScreenProps`, 60자 제한, `data-context-order`, `text-only-reading-notice` |
| 단서 | 문장 어절과 선택 단서 바구니를 두 영역으로 명확히 구분하고 `뜻 확인`을 선택 완료 뒤의 단일 다음 행동으로 둔다. | `aria-pressed`, 최대 두 단서, `ClueDecision`, `RequiredActionButton` |
| 뜻 | 세 선택지의 라디오 카드와 오답 피드백·다시 선택을 같은 카드 안에 배치한다. 피드백은 시각 영역과 단일 live region으로 중복되지 않게 한다. | `MeaningDecisionId`, `meaning-feedback`, retry 동작, 평가 함수 |
| 비교 | 두 문맥 카드와 단서 가리기 판단을 순서가 보이는 비교 패널로 묶는다. | `ComparisonScreenProps`, `CONFIRM_CUE_NECESSITY` |
| 정비 | 원문·선택지·미리보기·다른 유효 해법의 순서를 유지하고 제출 후 선택한 해법을 잃지 않는다. | `RepairSolutionId`, 복수 해법 표시, 제출 중복 방지 |
| 기록 | 학습목표·배운 점·해낸 것·다음 행동을 먼저 보여 주고 상세 응답과 기록 조작을 뒤에 둔다. | `ExplorationRecord`, 인쇄·다시 하기·입구 복귀 |
| 업데이트 | 새 개선 날짜와 짧은 내역을 배열 앞에 추가한다. | `UpdateHistoryEntry`, 모달 포커스·닫기·인쇄 동작 |

### 시각 시스템

- 라이트 모드만 사용한다. `prefers-color-scheme: dark` 규칙은 추가하지 않는다.
- 배경은 따뜻한 종이색, 본문은 짙은 잉크색, 주요 행동은 기존 청록 계열, 보조 알림은 기존 주황 계열을 사용한다.
- 카드·패널·버튼의 반경과 테두리 계층을 토큰으로 통일한다. 화면별 임의 색상과 inline 레이아웃 스타일을 늘리지 않는다.
- 본문 기본 글자와 줄 간격 설정은 기존 컨트롤로 조정할 수 있어야 하며, 200% 확대에서 정보 손실이나 가로 스크롤이 없어야 한다.
- 필수 다음 행동인 `단서 찾기`, `뜻 확인`만 `gi-pulse`를 유지한다. `prefers-reduced-motion: reduce`에서는 정적 3px 외곽선·`필수` 배지로 대체한다.
- 모든 주요 조작면은 최소 44×44 CSS px, 포커스는 `:focus-visible` 3px 고대비 외곽선으로 유지한다.

### 반응형 기준

- 320px: 본문·버튼·라디오 카드가 잘리지 않고 세로로 쌓인다.
- 375×812px: 입구의 첫 경로 CTA와 활동 화면의 현재 행동이 첫 화면 또는 한 번의 자연스러운 스크롤 안에 보인다.
- 768px: 카드와 비교 패널이 읽기 순서를 해치지 않는 1~2열로 전환된다.
- 1280px: 콘텐츠 최대 폭 60rem을 유지하고 빈 공간보다 읽기 폭을 우선한다.
- 200% 글자·`넓게` 줄 간격·reduced motion에서 넘침·겹침·진행 차단이 없어야 한다.

### 접근성·안전 범위

- 제목 계층, landmark, 라디오 그룹 legend, 버튼 accessible name, 단일 `data-feedback-announcer`를 유지한다.
- 단계 진입 시 `FocusHeading`이 현재 화면 제목을 포커스 대상으로 사용한다.
- 키보드 Tab/Enter/Space 흐름과 모달 포커스 격리를 유지한다.
- VoiceOver 구현·수동 검증·자동화는 이번 리디자인에서 제외한다. axe, 브라우저 의미 구조, 키보드, 일반 DOM 검증만 실행한다.
- 학생 이름·학번·반·학교·이메일 입력, localStorage/sessionStorage/IndexedDB/cookie, 외부 요청, 원격 폰트·이미지·분석 SDK를 추가하지 않는다.
- 학습 정보는 화면 텍스트로 제공하며 음성 녹음·재생·TTS·교사용 읽어주기·미디어 컨트롤을 추가하지 않는다.

## Global Constraints

1. 계획 문서와 초기 감사 문서를 먼저 저장한 뒤 소스 코드를 수정한다.
2. 현재 working tree가 시작 시 깨끗했으므로 이후 관련 없는 변경이 나타나면 보존하고 보고한다.
3. 콘텐츠 ID, 후보 뜻, 평가 함수, reducer action, 기록 모델, 개인정보 경계를 변경하지 않는다.
4. 단일 TypeScript/TSX/CSS 파일은 500줄 미만으로 유지한다. 기존 500줄 미만 파일을 기능이 섞인 거대 파일로 만들지 않는다.
5. 새 의존성, 외부 서비스, 원격 폰트, 이미지 생성 자산을 추가하지 않는다.
6. 코드에서 정답을 직접 비교하지 않고 기존 `src/domain/evaluation.ts`를 사용한다.
7. 필수 CTA 외에는 깜빡이는 강조를 추가하지 않는다. reduced-motion 대체 스타일을 같은 변경에서 검증한다.
8. 모든 학생용 문구는 초등 3~4학년이 읽을 수 있는 쉬운 한국어로 유지하고, 교육적 의미를 바꾸는 카피 수정은 콘텐츠 테스트와 함께 수행한다.
9. 시각 감사·콘텐츠 사실성·저작권·사람의 학습자 검증·VoiceOver 승인을 자동 테스트 통과로 포장하지 않는다.
10. 이번 요청에는 커밋·푸시·배포·HVC 등록을 포함하지 않는다.
11. 같은 명령이나 원인이 같은 실패가 세 번 반복되면 추가 시도 대신 원인·증거·안전한 선택지를 보고한다.

## 예상 파일 구조와 책임

### 새 문서

| 경로 | 책임 |
|---|---|
| `work/education-webapp-redesign-plan.md` | 본 계획, 범위, 수용 기준, 롤백 절차 |
| `work/education-webapp-redesign-audit.md` | 초기·최종 UX/UI 감사와 영향도별 근거 |
| `work/education-webapp-redesign-assets.md` | 자산 목록, 교체 판단, 원본 보존, 검토 상태 |
| `work/education-webapp-redesign-report.md` | 변경 요약, 자동·브라우저·수동 검증, 미해결 항목 |
| `design-system/MASTER.md` | 리디자인에 적용한 교육용 토큰·컴포넌트·반응형 규칙 |

### 변경 후보

| 경로 | 책임 |
|---|---|
| `src/app/App.tsx` | 셸 래퍼와 공통 영역의 시각적 그룹화만 조정 |
| `src/components/screens/EntranceScreen.tsx` | 학습 목표·경로 선택 위계와 어린이용 카피 배치 |
| `src/components/screens/ContextSceneScreen.tsx` | 문맥 읽기·최초 예상 영역의 순서와 text-only 안내 |
| `src/components/screens/ClueInvestigationScreen.tsx` | 어절 선택과 선택 단서 요약의 위계 |
| `src/components/screens/MeaningSignpostScreen.tsx` | 뜻 카드·오답 피드백·retry 시각 상태 |
| `src/components/screens/ComparisonScreen.tsx` | 비교 카드와 단서 가리기 판단의 읽기 순서 |
| `src/components/screens/SentenceRepairScreen.tsx` | 원문·해법·미리보기·복수 해법 표시 |
| `src/components/screens/ExplorationRecordScreen.tsx` | 결과 요약과 다음 행동의 상단 배치 |
| `src/components/common/ProgressHeader.tsx` | 진행 표시의 시각 계층과 accessible name 보존 |
| `src/components/common/RequiredActionButton.tsx` | `gi-pulse`/필수 배지 계약 보존 |
| `src/components/common/UpdateHistoryDialog.tsx` | 업데이트 모달 구조는 유지하고 스타일만 정리 |
| `src/content/updateHistory.ts` | 실제 리디자인 날짜와 한 줄 내역 추가 |
| `src/styles/tokens.css` | 색·간격·반경·포커스·표면 토큰 |
| `src/styles/base.css` | 전역 타이포그래피·포커스·본문 간격 |
| `src/styles/layout.css` | 셸·콘텐츠 폭·반응형 그리드 |
| `src/styles/components.css` | 카드·버튼·피드백·비교·기록 컴포넌트 스타일 |
| `src/styles/redesign.css` | 리디자인 전용 화면 간격·진행 rail·입구/문맥/기록의 반응형 보정 |
| `src/styles/motion.css` | `gi-pulse`와 reduced-motion 대체 |
| `src/styles/print.css` | 기록 인쇄 순서와 장식 숨김 |

### 테스트 후보

| 경로 | 확인 책임 |
|---|---|
| `src/app/App.test.tsx` | 셸 순서, 업데이트 날짜, 공통 진행 표시 |
| `src/components/screens/EntranceAndContextScreens.test.tsx` | 입구 위계, 문맥 text-only 안내, 그림 독립성 |
| `src/components/screens/ClueInvestigationScreen.test.tsx` | 선택 단서 상태와 다음 행동 |
| `src/components/screens/MeaningSignpostScreen.test.tsx` | 라디오 카드, 오답 피드백, retry |
| `src/components/screens/ComparisonScreen.test.tsx` | 비교·필요 단서 흐름 |
| `src/components/screens/SentenceRepairScreen.test.tsx` | 복수 해법과 제출 중복 방지 |
| `src/components/screens/ExplorationRecordScreen.test.tsx` | 결과 요약·다음 행동·인쇄 조작 |
| `src/components/common/RequiredActionButton.test.tsx` | 강조 허용 범위와 reduced-motion CSS 계약 |
| `tests/e2e/responsive.spec.ts` | 320/375/768/1280px와 200% 글자 |
| `tests/e2e/keyboard.spec.ts` | 키보드 학습 흐름·모달 경계 |
| `tests/e2e/motion.spec.ts` | 두 필수 CTA만 애니메이션, reduced-motion 정적 강조 |
| `tests/e2e/screen-reader.spec.ts` | axe·브라우저 의미 구조·live region; VoiceOver 제외 |
| `tests/e2e/student-flow.spec.ts` | core·extension·all 학습자 여정과 기록 |
| `tests/e2e/privacy.spec.ts` | 저장소·쿠키·외부 요청·미디어 요소 부재 |
| `tests/e2e/helpers/cssOwnership.ts` | 스타일 소유권 테스트가 허용하는 리디자인 클래스 목록 |
| `tests/e2e/style-ownership.spec.ts` | 레이아웃·컴포넌트·모션 CSS 소유권 회귀 |

## 작업 순서와 TDD 계약

### Step 1 — 초기 감사 문서 저장

- **Files:** `work/education-webapp-redesign-audit.md`
- **Interfaces:** 현재 공개 Pages 화면, React DOM, 기존 Playwright 선택자, `src/styles/*.css` 토큰
- **작업:** 375×812와 1280×900에서 입구·첫 문맥을 캡처하고, 실제 learner flow의 시작·활동·오답·기록 화면을 관찰한다. 제목 위계, CTA 위치, 진행 표시, 포커스·스크롤, 모바일 넘침, 색 대비, 반복 패턴, 개인정보 문구를 영향도별로 기록한다. `public/favicon.svg`와 inline SVG 사용처를 자산 목록으로 분류한다.
- **합격 조건:** P0/P1 문제마다 화면·경로·관찰 근거·수정 제안·수용 기준이 있으며, 이미지 교체가 불필요하면 그 이유가 문서에 남는다.
- **실행 명령:** `npm run test:run`, `npm run lint`, `npm run build`, 별도 preview에서 `npx playwright test --project=chromium --workers=1`
- **예상 결과:** 기준 자동 게이트가 통과하고, 브라우저 감사 문서에 자동 결과와 수동 관찰이 구분된다.

### Step 2 — 디자인 시스템 문서화

- **Files:** `design-system/MASTER.md`
- **Interfaces:** CSS custom properties, existing class names, `FocusHeading`, `RequiredActionButton`, `ProgressHeader`
- **작업:** 현재 토큰을 폐기하지 않고 어린이 읽기 폭·색 대비·카드 표면·버튼 계층·포커스·반응형·reduced-motion 규칙으로 정리한다. 화면별 예외가 없으면 `design-system/pages/`를 만들지 않는다.
- **합격 조건:** 모든 새 토큰이 사용처와 값·목적을 갖고, 필수 CTA·읽기 설정·모달·인쇄 규칙이 문서에 있다. `gi-pulse`는 두 CTA에만 허용된다.
- **실행 명령:** `rg -n "var\\(--|gi-pulse|prefers-reduced-motion" src/styles src/components`
- **예상 결과:** 코드 수정 전 리뷰 가능한 토큰·컴포넌트 계약이 생성된다.

### Step 3 — 입구와 공통 셸 위계 개선

- **Files:** `src/app/App.tsx`, `src/components/screens/EntranceScreen.tsx`, `src/components/common/ProgressHeader.tsx`, `src/styles/layout.css`, `src/styles/base.css`, `src/styles/components.css`, `src/styles/redesign.css`, `src/app/App.test.tsx`, `src/components/screens/EntranceAndContextScreens.test.tsx`, `tests/e2e/helpers/cssOwnership.ts`, `tests/e2e/style-ownership.spec.ts`
- **Interfaces:** `EntranceScreenProps`, `ProgressHeaderProps`, `UpdateHistoryDialog`, `TextScaleControls`, `LineSpacingControls`
- **TDD 순서:**
  1. 입구에서 목표·경로 제목·첫 CTA 순서와 활동 화면에서 진행 표시가 먼저 보이는 테스트를 추가한다.
  2. `npm run test:run -- src/app/App.test.tsx src/components/screens/EntranceAndContextScreens.test.tsx`로 의도한 DOM 순서 실패를 확인한다.
  3. 셸·입구 래퍼와 최소 CSS만 추가해 기존 role/name·버튼 라벨·경로 순서를 보존한다.
  4. focused 테스트와 `npx playwright test tests/e2e/responsive.spec.ts --project=chromium --workers=1`를 통과시킨다.
- **합격 조건:** 375px에서 첫 경로 CTA가 카드 상단 구조를 이해할 수 있고, 설정 라디오는 여전히 키보드로 접근된다. 진행 표시의 accessible name은 기존 `현재 낱말 x/y · 장면 x/3` 계약과 같다.

### Step 4 — 활동 카드와 피드백 상태 위계 개선

- **Files:** `src/components/screens/ContextSceneScreen.tsx`, `src/components/screens/ClueInvestigationScreen.tsx`, `src/components/screens/MeaningSignpostScreen.tsx`, `src/components/screens/ComparisonScreen.tsx`, `src/components/screens/SentenceRepairScreen.tsx`, `src/components/screens/ExplorationRecordScreen.tsx`, `src/components/screens/EntranceAndContextScreens.test.tsx`, `src/components/screens/ClueInvestigationScreen.test.tsx`, `src/components/screens/MeaningSignpostScreen.test.tsx`, `src/components/screens/ComparisonScreen.test.tsx`, `src/components/screens/SentenceRepairScreen.test.tsx`, `src/components/screens/ExplorationRecordScreen.test.tsx`, `src/styles/components.css`, `src/styles/redesign.css`
- **Interfaces:** 각 화면의 현재 Props 인터페이스, `FeedbackInput`, `RequiredActionButton`, `ExplorationRecord`
- **TDD 순서:**
  1. 각 화면 테스트에 `stage kicker → heading → primary content → primary action`의 landmark/DOM 순서와 오답 retry 가시성 테스트를 추가한다.
  2. focused Vitest를 실행해 새 순서 assertion이 기존 구조에서 실패하는 것을 확인한다.
  3. 패널·상태 클래스와 필요한 최소 wrapper를 구현하고 평가·reducer 호출은 그대로 둔다.
  4. 모든 화면 focused 테스트와 `tests/e2e/student-flow.spec.ts tests/e2e/keyboard.spec.ts`를 통과시킨다.
- **합격 조건:** 오답 후 피드백·retry가 viewport 안에서 찾을 수 있고, 복수 문장 해법·기록 요약·다음 행동이 사라지지 않는다. live region은 하나이며 시각 피드백은 중복 발표되지 않는다.

### Step 5 — 디자인 토큰·반응형·모션 적용

- **Files:** `design-system/MASTER.md`, `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/layout.css`, `src/styles/components.css`, `src/styles/redesign.css`, `src/styles/motion.css`, `src/styles/print.css`, `tests/e2e/responsive.spec.ts`, `tests/e2e/motion.spec.ts`, `tests/e2e/print.spec.ts`, `tests/e2e/helpers/cssOwnership.ts`, `tests/e2e/style-ownership.spec.ts`
- **Interfaces:** CSS custom properties, `[data-text-scale]`, `[data-line-spacing]`, `.gi-pulse`, `@media (prefers-reduced-motion: reduce)`
- **TDD 순서:**
  1. 320/375/768/1280px, 200% 글자, wide spacing, reduced-motion, 인쇄에서 필요한 시각·넘침 assertion을 먼저 추가한다.
  2. `npx playwright test tests/e2e/responsive.spec.ts tests/e2e/motion.spec.ts tests/e2e/print.spec.ts --project=chromium --workers=1`로 새 assertion의 실패를 확인한다.
  3. 토큰과 레이아웃 CSS를 최소 변경하고 inline style·외부 자산을 늘리지 않는다.
  4. 같은 명령을 다시 실행해 모든 뷰포트와 모션 계약을 통과시킨다.
- **합격 조건:** 가로 스크롤 0, clipped text 0, 필수 CTA 애니메이션 2개 이하, reduced-motion에서 애니메이션 0, 인쇄 기록 장식 숨김이 유지된다.

### Step 6 — 접근성·개인정보·학습 흐름 회귀 검증

- **Files:** `tests/e2e/keyboard.spec.ts`, `tests/e2e/screen-reader.spec.ts`, `tests/e2e/privacy.spec.ts`, `tests/e2e/student-flow.spec.ts`, `src/content/updateHistory.ts`, `src/app/App.test.tsx`
- **Interfaces:** `FocusHeading`, `LiveRegion`, `UpdateHistoryEntry`, route helpers
- **TDD 순서:**
  1. 업데이트 날짜·키보드 포커스·단일 live region·text-only no-audio·외부 요청 0을 assertion으로 고정한다.
  2. focused 명령으로 새 assertion이 기존 스타일/문서에서 실패하는지 확인한다.
  3. 실제 동작에 필요한 문구·스타일·날짜만 구현하고 VoiceOver 코드는 추가하지 않는다.
  4. keyboard, screen-reader, privacy, student-flow E2E를 통과시킨다.
- **합격 조건:** core·extension·all 기록 도달, 8개 낱말 순서 보존, 외부 요청·저장소·쿠키·`audio` 요소 0, axe serious/critical 0이다. VoiceOver는 `not run`으로 기록한다.

### Step 7 — 최종 감사·보고서·파일 크기 게이트

- **Files:** `work/education-webapp-redesign-audit.md`, `work/education-webapp-redesign-assets.md`, `work/education-webapp-redesign-report.md`
- **Interfaces:** 모든 수정된 화면·CSS·테스트와 공개 Pages preview
- **작업:** 초기 P0/P1 해결 여부를 실제 learner flow로 재검토하고, 320/375/768/1280px·200%·키보드·reduced-motion·라이트 모드·콘솔을 기록한다. 자산 문서에는 inline SVG와 favicon의 원본 경로·역할·alt/aria 결정·교체하지 않은 이유를 적는다. 실제 초등학생·교사 검증과 VoiceOver는 실행하지 않았음을 별도 상태로 적는다.
- **실행 명령:** `npm run lint && npm run test:run && npm run build`; preview를 띄운 뒤 `npx playwright test --project=chromium --workers=1`; `git diff --check`; `find src tests -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \\) -print0 | xargs -0 wc -l`
- **예상 결과:** 린트 경고 0, Vitest 149개 이상 전부 통과, Vite 빌드 성공, Chromium E2E 34개 전부 통과, diff whitespace 오류 0, 500줄 이상 구현 파일 0이다.

## Verification Matrix

| 검증 | 명령/방법 | 합격 기준 |
|---|---|---|
| 정적·타입 | `npm run lint`, `npm run build` | 경고 0, TypeScript/Vite 빌드 성공 |
| 단위·컴포넌트 | `npm run test:run` | 기존 테스트와 새 assertion을 포함한 149개 이상 전부 통과 |
| 학습자 흐름 | `npx playwright test tests/e2e/student-flow.spec.ts --project=chromium --workers=1` | core·extension·all 기록, 오답 회복, 다음 행동 표시 |
| 모바일·확대 | `npx playwright test tests/e2e/responsive.spec.ts --project=chromium --workers=1` | 320/375/768/1280px, 200%에서 overflow·겹침 0 |
| 키보드 | `npx playwright test tests/e2e/keyboard.spec.ts --project=chromium --workers=1` | 첫 행동부터 기록·모달까지 마우스 없이 완료 |
| 모션·인쇄 | `npx playwright test tests/e2e/motion.spec.ts tests/e2e/print.spec.ts --project=chromium --workers=1` | reduced-motion 정적 강조, 인쇄 기록만 출력 |
| 의미 구조 | `npx playwright test tests/e2e/screen-reader.spec.ts --project=chromium --workers=1` | axe serious/critical 0, 이름·역할·상태·알림 중복 0; VoiceOver 제외 |
| 개인정보·텍스트 전용 | `npx playwright test tests/e2e/privacy.spec.ts --project=chromium --workers=1` | 외부 요청·저장소·쿠키·이름 입력·`audio` 요소 0 |
| 파일 경계 | `git diff --check`와 500줄 명령 | whitespace 오류 0, 구현 파일 500줄 미만 |
| 자산 | `work/education-webapp-redesign-assets.md`와 번들 확인 | inline SVG·favicon 경로·역할·검토 상태가 실제 코드와 일치 |
| 사람 검토 | 별도 세션에서 수행해야 함 | 실제 초등학생/교사 검증과 VoiceOver는 이번 실행에서 하지 않음 |

## Rollback Plan

리디자인 전 기준점은 현재 `main`의 `b9f0c0d`이다. 구현 중 문제가 생기면 먼저 `git diff --name-only`와 `git diff --check`로 범위를 확인하고, 사용자 변경이 섞이지 않은 파일만 기준점과 비교한다. 사용자가 되돌리기를 승인한 경우에만 수정 파일 목록을 명시한 `git restore --source=b9f0c0d -- <approved paths>`를 실행한다. 새 문서와 디자인 시스템은 별도 파일이므로 코드 롤백과 독립적으로 보존하거나 삭제 여부를 확인한다. `git reset --hard`, 강제 push, worktree 삭제는 사용자의 별도 지시 없이는 실행하지 않는다.

## Future Commands and Expected Results

```bash
npm run lint
# ESLint 경고 0, exit 0

npm run test:run
# 모든 Vitest 파일과 새 리디자인 assertion 통과, exit 0

npm run build
# TypeScript와 Vite production build 성공, dist/ 생성

npm run preview -- --host 127.0.0.1 --port 4173
# 별도 터미널에서 production preview 제공

npx playwright test --project=chromium --workers=1
# 실제 learner flow·모바일·키보드·모션·인쇄·개인정보 E2E 전체 통과

git diff --check
# whitespace 오류 없음

find src tests -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 | xargs -0 wc -l
# 500줄 이상 구현 파일 없음
```

## Release Boundary

이번 요청은 안전한 리디자인과 로컬 검증까지로 제한한다. 커밋·푸시·GitHub Pages 배포·HVC 관리자 등록·정적 갤러리 동기화는 실행하지 않는다. 실제 초등학생·교사 사용성 검증은 별도 사람 세션의 결과로만 기록하며 자동 검증 결과로 대체하지 않는다.

## Plan Review Checklist

- [x] 기존 설계 문서·구현 계획·학습자 개선 계획을 먼저 확인했다.
- [x] 초기 조사에서 루트 `AGENTS.md`, `EDUCATION_DESIGN.md` 부재를 확인했고 `design-system/MASTER.md`는 Step 2에서 생성했다.
- [x] 학습 목표·흐름·판정·개인정보·텍스트 전용·VoiceOver 제외 경계를 보존한다.
- [x] 변경 후보마다 정확한 파일 경로와 인터페이스를 적었다.
- [x] 실패 테스트 → 최소 구현 → 통과 테스트 순서를 각 동작 작업에 적었다.
- [x] 320/375/768/1280px, 200% 글자, 키보드, reduced-motion, 인쇄, axe를 별도 검증한다.
- [x] 이미지 자산을 자동 생성·교체하지 않는 이유와 기록 경로를 정했다.
- [x] 계획 문서에는 미정·자리표시자나 모호한 작업 지시를 사용하지 않았다.
- [x] 리디자인 전용 `src/styles/redesign.css`와 스타일 소유권 회귀 경로를 계획·구현 파일 목록에 반영했다.
- [x] 375×812 첫 경로 CTA, 200% 확대, reduced-motion, 전체 34개 Chromium 회귀 결과를 최종 보고서에서 구분해 기록한다.
