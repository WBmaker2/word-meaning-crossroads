export interface UpdateHistoryEntry {
  readonly date: string
  readonly category: string
  readonly detail: string
}

export const UPDATE_HISTORY = [
  {
    date: '2026-08-26',
    category: '설계',
    detail: '최초 설계 문서 작성',
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
    detail: '스크린 리더 의미 구조와 단일 판정 알림을 자동 검증하고 실제 VoiceOver 검수는 별도로 남김',
  },
  {
    date: '2026-08-27',
    category: '개선',
    detail: '뜻을 고르기 전 화면의 내부 식별자를 의미 중립적인 순서값으로 바꾸어 뜻이 미리 드러나지 않게 개선',
  },
] as const satisfies readonly UpdateHistoryEntry[]
