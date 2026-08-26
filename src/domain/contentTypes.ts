export type WordId =
  | 'nun'
  | 'bae'
  | 'bam'
  | 'mal'
  | 'chada'
  | 'dari'
  | 'sseuda'
  | 'gamda'

export type RouteId = 'core' | 'extension' | 'all'

export type MeaningId =
  | 'nun:snow'
  | 'nun:eye'
  | 'bae:boat'
  | 'bae:belly'
  | 'bae:pear'
  | 'bam:night'
  | 'bam:chestnut'
  | 'mal:horse'
  | 'mal:speech'
  | 'chada:kick'
  | 'chada:wear'
  | 'chada:fill'
  | 'dari:leg'
  | 'dari:bridge'
  | 'sseuda:write'
  | 'sseuda:wear'
  | 'sseuda:bitter'
  | 'gamda:close'
  | 'gamda:wind'
  | 'gamda:wash'

export type SceneId =
  | 'nun-snow-01'
  | 'nun-eye-02'
  | 'nun-uncertain-03'
  | 'bae-boat-01'
  | 'bae-belly-02'
  | 'bae-pear-03'
  | 'bam-night-01'
  | 'bam-chestnut-02'
  | 'bam-uncertain-03'
  | 'mal-horse-01'
  | 'mal-speech-02'
  | 'mal-uncertain-03'
  | 'chada-kick-01'
  | 'chada-wear-02'
  | 'chada-fill-03'
  | 'dari-leg-01'
  | 'dari-bridge-02'
  | 'dari-uncertain-03'
  | 'sseuda-write-01'
  | 'sseuda-wear-02'
  | 'sseuda-bitter-03'
  | 'gamda-close-01'
  | 'gamda-wind-02'
  | 'gamda-wash-03'

export type RepairChallengeId =
  | 'repair-nun'
  | 'repair-bae'
  | 'repair-bam'
  | 'repair-mal'
  | 'repair-chada'
  | 'repair-dari'
  | 'repair-sseuda'
  | 'repair-gamda'

export type CueNecessityChallengeId =
  | 'necessity-nun'
  | 'necessity-bae'
  | 'necessity-bam'
  | 'necessity-mal'
  | 'necessity-chada'
  | 'necessity-dari'
  | 'necessity-sseuda'
  | 'necessity-gamda'

export type RepairSolutionId =
  | 'nun-snow'
  | 'nun-eye'
  | 'bae-pear'
  | 'bae-boat'
  | 'bam-night'
  | 'bam-chestnut'
  | 'mal-horse'
  | 'mal-speech'
  | 'chada-kick'
  | 'chada-wear'
  | 'dari-bridge'
  | 'dari-leg'
  | 'sseuda-write'
  | 'sseuda-wear'
  | 'sseuda-bitter'
  | 'gamda-close'
  | 'gamda-wind'
  | 'gamda-wash'

export type MeaningDecisionId = MeaningId | 'insufficient-context'
export type CueRole = 'target' | 'decisive' | 'supportive' | 'neutral'
export type OneToThree<T> = readonly [T] | readonly [T, T] | readonly [T, T, T]
export type TokenId = `${SceneId}:t${number}`
export type SentenceId = `${SceneId}:s${1 | 2 | 3}`

export interface SentenceToken {
  readonly id: TokenId
  readonly text: string
  readonly role: CueRole
  readonly targetSurface?: string
}

export interface SceneSentence {
  readonly id: SentenceId
  readonly tokens: readonly SentenceToken[]
  readonly plainText: string
}

export interface MeaningDefinition {
  readonly id: MeaningId
  readonly childFriendlyLabel: string
  readonly childFriendlyDescription: string
  readonly contrastExample: string
}

export interface ContextScene {
  readonly id: SceneId
  readonly wordId: WordId
  readonly order: 1 | 2 | 3
  readonly sentences: OneToThree<SceneSentence>
  readonly candidateMeaningIds: readonly [MeaningId, MeaningId]
  readonly expectedDecision: MeaningDecisionId
  readonly decisiveCueTokenIds: readonly TokenId[]
  readonly supportiveCueTokenIds: readonly TokenId[]
  readonly wrongChoiceFeedback: Readonly<Partial<Record<MeaningDecisionId, string>>>
  readonly audioSrc: `/audio/scenes/${SceneId}.mp3`
  readonly illustrationId: `crossroads-${WordId}`
}

export interface RepairSolution {
  readonly id: RepairSolutionId
  readonly meaningId: MeaningId
  readonly blockLabel: string
  readonly completedSentence: string
  readonly reviewNote: string
}

export interface RepairChallenge {
  readonly id: RepairChallengeId
  readonly wordId: WordId
  readonly ambiguousSentence: string
  readonly solutions: readonly [RepairSolution, RepairSolution, ...RepairSolution[]]
}

export type CueNecessityDecision = 'still-clear' | 'now-unclear'

export interface CueNecessityChallenge {
  readonly id: CueNecessityChallengeId
  readonly wordId: WordId
  readonly originalSentence: string
  readonly hiddenTokenText: string
  readonly sentenceAfterHide: string
  readonly expectedClarity: CueNecessityDecision
  readonly explanation: string
}

export interface WordPack {
  readonly id: WordId
  readonly lemma: string
  readonly meanings: readonly [MeaningDefinition, MeaningDefinition, ...MeaningDefinition[]]
  readonly scenes: readonly [ContextScene, ContextScene, ContextScene]
  readonly necessityChallenge: CueNecessityChallenge
  readonly repair: RepairChallenge
}

export interface RouteDefinition {
  readonly id: RouteId
  readonly label: '기본 길 4개' | '확장 길 4개' | '전체 길 8개'
  readonly wordIds: readonly WordId[]
  readonly recommendedMinutes: '20~30분' | '차시를 나누어 진행'
}
