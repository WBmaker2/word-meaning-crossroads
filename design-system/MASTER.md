# Word Meaning Crossroads Design System

작성일: 2026-08-29
상태: 교육용 리디자인 기준

이 문서는 초등 3~4학년 국어 학습자가 문맥 단서를 읽고 뜻을 선택하는 흐름을 빠르게 이해하도록 기존 CSS 토큰과 컴포넌트 규칙을 정리한다. 상태 로직·콘텐츠·개인정보 정책은 이 문서의 대상이 아니다.

## Design Principles

1. 한 화면에는 한 가지 판단과 한 가지 주요 다음 행동을 둔다.
2. 문장과 선택 근거를 장식보다 먼저 보여 준다.
3. 색·아이콘·문자 라벨·밑줄을 함께 사용해 색만으로 상태를 전달하지 않는다.
4. 라이트 모드와 44px 이상 조작면을 유지한다.
5. 필수 행동만 강조하고, 모션 감소 환경에서는 고정 외곽선으로 대체한다.

## Tokens

기존 `src/styles/tokens.css`의 이름을 유지하며 값은 최소 변경한다.

| 토큰 | 역할 | 사용처 |
|---|---|---|
| `--color-canvas` | 따뜻한 종이색 배경 | `body`, 앱 셸 |
| `--color-ink` | 본문·제목 | 텍스트, 버튼 |
| `--color-primary` | 학습 행동·단계 표지 | 주요 CTA, kicker, 왼쪽 선 |
| `--color-accent` | 학습 목표·선택 보조 강조 | badge, mark, 보조 패널 |
| `--color-success` | 올바른 선택·완료 | 상태 문자·테두리 |
| `--color-warning` | 개인정보·주의 안내 | privacy notice |
| `--focus-ring` | 키보드 포커스 | `:focus-visible` |
| `--line`, `--card` | 경계·표면 | 카드·fieldset |
| `--soft-primary`, `--soft-accent`, `--soft-success`, `--soft-warning` | 저채도 상태 표면 | 문장·피드백·안내 패널 |

## Typography

- 전역 글꼴은 현재 `Nunito`, Apple SD Gothic Neo, Malgun Gothic 순서를 유지한다.
- 기본 본문은 `1.125rem`, line-height `1.65`; 앱 상태에 따라 text scale과 line spacing을 곱한다.
- `h1`은 서비스명, `h2`는 현재 단계, `h3`는 패널, `h4/h5`는 기록 상세 순서를 유지한다.
- 학생용 문구는 한 문장 또는 짧은 두 문장으로 쓰고, 언어학 전문 용어를 화면에 새로 추가하지 않는다.

## Layout

- 셸과 본문 최대 폭은 `60rem`, 모바일 좌우 여백은 `12px`를 유지한다.
- 상단 순서는 서비스명·업데이트 → 읽기 설정 → 활동 진행 → learner card다.
- 입구는 목표 요약 → 개인정보 안내 → 경로 카드 순서이며, 경로 카드는 768px 이상에서 2열, 이하에서 1열로 쌓는다.
- 활동 카드는 `stage-header → prompt → evidence/choice → primary action` 순서다.
- 문맥 SVG는 의미 중립 장식이며 문장·입력보다 낮은 위계와 제한된 높이를 사용한다.
- 결과 화면은 학습목표 → 배운 것 → 해낸 것 → 다음 행동 → 조작 → 상세 응답 순서다.

## Components

### Primary action

`RequiredActionButton`은 `단서 찾기`, `뜻 확인`에만 사용한다. `.gi-pulse`, `data-emphasis="gi-pulse"`, `필수` 배지를 보존한다. 다른 버튼에는 같은 애니메이션을 붙이지 않는다.

### Choice surfaces

뜻·정비 라디오 카드는 44px 라디오, 선택 테두리, 체크 문자, accessible label을 함께 사용한다. 단서 어절 버튼은 `aria-pressed`, 선택됨 문자를 유지한다.

### Feedback

전역 `LiveRegion`은 하나만 둔다. 시각 피드백은 안내·선택 미리보기·오류 회복을 서로 다른 테두리와 heading/문자 라벨로 구분하고 live region 내용을 반복하지 않는다.

### Progress

`ProgressHeader`의 accessible name `현재 낱말 x/y · 장면 x/3`을 유지한다. 시각적으로는 작은 단계 pill과 보조 progress rail을 사용할 수 있지만 숫자와 읽기 순서는 바꾸지 않는다.

### Update history

`UpdateHistoryDialog`는 헤더의 작은 버튼으로 유지한다. 새 변경은 실제 날짜의 `UpdateHistoryEntry`를 배열 앞에 추가하고, 모달 포커스 격리·Escape·닫기 후 원래 버튼 복귀를 보존한다.

## Responsive and Motion

| 조건 | 규칙 |
|---|---|
| 320px | 모든 카드·버튼·라디오가 세로로 쌓이고 수평 overflow 0 |
| 375×812px | 첫 CTA와 현재 단계의 primary action이 짧은 스크롤 안에 표시 |
| 768px | 입구·비교 카드가 읽기 순서를 유지하며 1~2열 |
| 1280px | 60rem 읽기 폭과 충분한 좌우 여백 |
| 200% 글자 | clipped text·겹침·정보 손실 0 |
| `prefers-reduced-motion: reduce` | `.gi-pulse` animation 제거, 3px 고정 외곽선·`필수` 배지 유지 |

## Accessibility and Safety

- `:focus-visible` 3px 고대비 외곽선, 논리적인 DOM 순서, landmark·heading·legend를 유지한다.
- 스크린 리더 자동 DOM/axe 검증은 유지하지만 VoiceOver 실제 검증은 실행하지 않는다.
- 음성 녹음·재생·TTS·교사용 읽어주기·외부 미디어를 추가하지 않는다.
- 학생 입력은 React 메모리에만 두며 저장소·쿠키·외부 네트워크·원격 폰트·분석을 추가하지 않는다.

## CSS Ownership

- `tokens.css`: 값과 의미 이름
- `base.css`: 전역 reset·타이포그래피·포커스·공통 텍스트
- `layout.css`: 셸 폭·그리드·반응형 배치
- `components.css`: 카드·버튼·패널·기록 컴포넌트
- `redesign.css`: 리디자인 전용 진행 rail·입구/문맥/기록 간격과 반응형 압축
- `motion.css`: 필수 CTA 애니메이션과 reduced-motion 대체
- `print.css`: 기록 인쇄 전용 표시

`src/main.tsx`는 위 순서로 스타일을 import한다. 새 규칙은 책임 파일에만 추가하고, 한 소스·테스트·스타일 파일을 500줄 미만으로 유지한다.
