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
] as const satisfies readonly UpdateHistoryEntry[]
