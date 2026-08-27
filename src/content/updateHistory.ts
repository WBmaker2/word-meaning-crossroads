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
] as const satisfies readonly UpdateHistoryEntry[]
