export interface UpdateHistoryEntry {
  readonly date: string
  readonly category: string
  readonly detail: string
}

export const UPDATE_HISTORY = [
  {
    date: '2026-08-29',
    category: '리디자인',
    detail: '학습 목표와 다음 행동을 더 빨리 찾도록 입구·활동 카드·기록 화면의 읽기 순서와 모바일 여백을 다듬음',
  },
  {
    date: '2026-08-28',
    category: '범위',
    detail: '음성 기능을 제외하고 모든 학습 정보를 화면 텍스트로 제공하는 텍스트 전용 MVP로 범위를 정리',
  },
  {
    date: '2026-08-28',
    category: '개선',
    detail: '모바일 겹침을 없애고 보이는 피드백·장면 진행·학습 기록과 학생용 문장을 정리',
  },
  {
    date: '2026-08-27',
    category: '개선',
    detail: '375px 모바일 화면과 200% 글자 크기에서도 내용을 읽고 조작할 수 있도록 개선',
  },
  {
    date: '2026-08-27',
    category: '개선',
    detail: '키보드만으로 학습 흐름을 이어가고 단계 제목으로 초점을 안내하도록 개선',
  },
  {
    date: '2026-08-27',
    category: '개선',
    detail: '스크린 리더 의미 구조와 단일 판정 알림을 자동 검증하고 접근성 범위에서 VoiceOver는 제외하고 키보드·접근성 트리 검증을 유지',
  },
  {
    date: '2026-08-27',
    category: '개선',
    detail: '뜻을 고르기 전 화면의 내부 식별자를 의미 중립적인 순서값으로 바꾸어 뜻이 미리 드러나지 않게 개선',
  },
  {
    date: '2026-08-26',
    category: '설계',
    detail: '최초 설계 문서 작성',
  },
] as const satisfies readonly UpdateHistoryEntry[]
