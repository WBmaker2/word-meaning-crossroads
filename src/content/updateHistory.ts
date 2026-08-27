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
] as const satisfies readonly UpdateHistoryEntry[]
