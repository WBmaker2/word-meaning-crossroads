# Word Meaning Crossroads Redesign Asset Audit

감사일: 2026-08-29

## 자산 목록

| 원본 경로 | 화면·역할 | 분류 | 조치 | alt/aria 결정 | 검토 상태 |
|---|---|---|---|---|---|
| `src/components/common/NeutralCrossroadsIllustration.tsx` | 문맥 장면의 의미 중립 장식 갈림길 | 일반 개념 일러스트 | 교체하지 않음; 원본 유지 | `aria-hidden="true"`, `focusable="false"`, 텍스트·title 없음 | 자동 DOM·그림 숨김 흐름 통과; 사람 시각 검수 pending |
| `public/favicon.svg` | 브라우저 탭 식별 아이콘 | 브랜드/식별 자산 | 교체하지 않음 | 문서 head에서 장식 아이콘으로 사용 | HTTP 로드 확인; 사람 브랜드 검수 pending |

## 판정 근거

- `public`, `src/assets`, CSS `url()`, JSX `<img>`, `srcset`, preload를 검색했으며 추가 raster 이미지와 원격 자산은 발견하지 못했다.
- inline SVG는 정답·낱말 의미·숫자·사실을 전달하지 않고 모든 낱말에서 동일한 기하를 사용한다.
- 사실·정체성·증거를 전달하는 이미지가 아니므로 imagegen을 실행하지 않았다.
- 새 이미지, 새 import, 새 alt 문구, 저작권 출처를 만들지 않는다. `work/education-webapp-redesign-report.md`에서 imagegen을 `not run`으로 보고한다.

## 안전 경계

원본을 덮어쓰지 않았고, 외부 이미지 CDN·원격 폰트·스크린샷 자산을 추가하지 않는다. 화면 텍스트와 SVG의 의미 중립성을 유지한다.
