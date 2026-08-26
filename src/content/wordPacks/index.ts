import type { WordPack } from '../../domain/contentTypes'
import { validateWordPacks } from '../../domain/contentValidation'
import { ROUTES } from '../routes'
import { bae } from './bae'
import { bam } from './bam'
import { chada } from './chada'
import { dari } from './dari'
import { gamda } from './gamda'
import { mal } from './mal'
import { nun } from './nun'
import { sseuda } from './sseuda'

export { ROUTES }
export const WORD_PACKS: readonly WordPack[] = [
  nun,
  bae,
  bam,
  mal,
  chada,
  dari,
  sseuda,
  gamda,
]

if (import.meta.env.MODE !== 'production') {
  validateWordPacks(WORD_PACKS, ROUTES)
}
