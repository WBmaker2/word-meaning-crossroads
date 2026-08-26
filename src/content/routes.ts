import type { RouteDefinition } from '../domain/contentTypes'

export const ROUTES: readonly RouteDefinition[] = [
  {
    id: 'core',
    label: '기본 길 4개',
    wordIds: ['nun', 'bae', 'bam', 'mal'],
    recommendedMinutes: '20~30분',
  },
  {
    id: 'extension',
    label: '확장 길 4개',
    wordIds: ['chada', 'dari', 'sseuda', 'gamda'],
    recommendedMinutes: '20~30분',
  },
  {
    id: 'all',
    label: '전체 길 8개',
    wordIds: ['nun', 'bae', 'bam', 'mal', 'chada', 'dari', 'sseuda', 'gamda'],
    recommendedMinutes: '차시를 나누어 진행',
  },
]
