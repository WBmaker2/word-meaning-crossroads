# Elementary Learner UX/UI Audit

감사일: 2026-08-31
대상: 로컬 production preview `http://127.0.0.1:4173/`와 공개 release 구조
사용자 모델: 초등학교 3~4학년 준호(주 사용자), 실제 아동 대면 세션 아님

## 기준과 실행 경계

- 기존 `work/education-webapp-redesign-audit.md`와 `work/education-webapp-redesign-report.md`의 출시 리디자인 결과를 기준 baseline으로 재사용했다.
- Stage 0 preflight는 `ready`였고, text-only·privacy·reducer/evaluator·VoiceOver 제외 계약을 고정했다.
- 로컬 preview에서 `student-flow`, `responsive`, `keyboard` 13/13을 외부 Chromium 실행 경로로 통과했다. 샌드박스 Chromium의 첫 실행은 `MachPortRendezvous` 권한 오류로 중단되어 환경 실패로 분리했다.
- 관찰 캡처는 `/private/tmp/wmc-ux-baseline-entrance-mobile.png`, `/private/tmp/wmc-ux-mobile-context.png`, `/private/tmp/wmc-ux-mobile-clue.png`, `/private/tmp/wmc-ux-mobile-meaning.png`, `/private/tmp/wmc-ux-mobile-wrong-meaning.png`, `/private/tmp/wmc-ux-mobile-comparison.png`, `/private/tmp/wmc-ux-mobile-hidden-cue.png`에 임시 보관했다.

## 관찰 요약

| 영역 | 현재 상태 | 영향도 | 이번 조치 |
|---|---|---|---|
| 입구 | 첫 경로가 추천 배지·버튼으로 구분되고 모바일에서도 가로 넘침 없음 | 통과 | 기존 리디자인·responsive 계약 유지 |
| 문맥 | 문장·텍스트 전용 안내·예상 입력·단서 찾기 순서가 보임 | 통과 | 제목 단어 단위 줄바꿈만 보강 |
| 단서 | 선택 말이 일반 본문과 비슷해 첫 선택 대상을 찾는 시간이 늘 수 있음 | P2 | available token 점선 밑줄과 component/E2E assertion 추가 |
| 뜻 | 라디오 카드·오답 피드백·다시 고르기 버튼이 보임 | 통과 | 카드 줄바꿈만 보강 |
| 비교 | 두 문장 비교와 단서 가리기 조작이 보이나 목적 설명이 조작 뒤에 드러남 | P2 | 숨기기 전 도움말을 추가하고 description 연결 |
| 문장 정비·기록 | 복수 해법, 요약, 다음 행동, 다시 하기 조작이 보임 | 통과 | 기존 구조·문구 유지 |
| 개인정보·텍스트 전용 | 이름 금지·메모리 전용·외부 전송 없음, audio 없음 | 통과 | 변경하지 않음 |

## 심각도 결론

- P0: 0 — 안전·개인정보·학습 흐름 차단 없음.
- P1: 0 — 출시 리디자인에서 첫 CTA·진행·오답 회복·반응형을 이미 보강함.
- P2: 2 — 단서 선택 affordance, 단서 가리기 목적 문구.
- P3: 1 — 375px에서 한글 제목·설명 일부가 음절 중간에서 줄바꿈되는 시각 품질 이슈.

## 구현 후 재검수 기준

1. 모바일과 데스크톱에서 제목이 단어 단위로 보이고 문장 토큰이 가로로 넘치지 않는다.
2. 단서 화면에서 미선택 말은 점선, 선택 말은 체크·실선으로 구분된다.
3. 단서 가리기 전 `단서 하나를 가리고도 뜻이 보이는지 살펴봐요.`가 보이고 accessible description으로 연결된다.
4. core·extension·all 학습 흐름, 기록, 오답 회복, 키보드·axe·개인정보·reduced-motion 기존 게이트가 유지된다.
5. 실제 초등학생·교사 승인과 VoiceOver는 실행하지 않았다고 보고서에 명시한다.

## 구현 후 재검수 결과

| 기준 | 결과 | 증거 |
|---|---|---|
| 제목 단위 줄바꿈 | 통과 — 375px 화면에서 `보아요`, 선택 카드 설명이 음절 중간에서 잘리지 않음 | `/private/tmp/wmc-ux-final-mobile-context.png`, `/private/tmp/wmc-ux-final-mobile-meaning.png`, responsive E2E |
| 단서 발견성 | 통과 — 미선택 말은 점선, 선택 말은 체크·실선 | `/private/tmp/wmc-ux-final-mobile-clue.png`, Clue component test |
| 단서 가리기 목적 | 통과 — 숨기기 전 문장과 accessible description이 함께 제공됨 | Comparison component test, screen-reader E2E |
| 확대·반응형 | 통과 — 375px, 200% 글자·넓은 줄 간격에서 overflow 0 | responsive E2E 2/2 |
| 학습 흐름·판정 | 통과 — core·extension·all, 오답 회복, 기록 순서 유지 | student-flow E2E |
| 안전·텍스트 전용 | 통과 — 기존 저장소·쿠키·외부 요청·audio 부재 유지 | privacy E2E |

전체 Chromium 34/34, Vitest 149/149, lint, build, diff check가 통과했다. 첫 샌드박스 Chromium 실행과 Playwright wrapper의 npm cache EPERM은 환경 제한으로 기록하고 프로젝트 로컬 runner를 사용했다. 실제 초등학생·교사 승인과 VoiceOver는 남은 human gate이며, 공개 배포 후 확인은 Pages workflow `33348994248`과 공개 브라우저 점검으로 완료했다.
