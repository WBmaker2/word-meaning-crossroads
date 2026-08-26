import type {
  CueNecessityDecision,
  MeaningDecisionId,
  RepairSolutionId,
  RouteId,
  SceneId,
  TokenId,
  WordId,
} from './contentTypes'

export type SessionPhase =
  | 'entrance'
  | 'prediction'
  | 'clue-investigation'
  | 'meaning-signpost'
  | 'comparison'
  | 'sentence-repair'
  | 'record'

export type ClueDecision =
  | { readonly kind: 'tokens'; readonly tokenIds: readonly [TokenId] | readonly [TokenId, TokenId] }
  | { readonly kind: 'insufficient' }

export interface ClueEvaluation {
  readonly isCorrect: boolean
  readonly evidenceKind:
    | 'decisive'
    | 'supportive-only'
    | 'insufficient-correct'
    | 'insufficient-wrong'
    | 'too-many'
  readonly message: string
  readonly canContinue: boolean
}

export interface MeaningEvaluation {
  readonly isCorrect: boolean
  readonly decisionKind: 'specific-meaning' | 'insufficient-context'
  readonly message: string
  readonly canContinue: boolean
}

export interface RepairEvaluation {
  readonly isCorrect: boolean
  readonly message: string
  readonly completedSentence?: string
  readonly alternativeSolutionIds: readonly RepairSolutionId[]
}

export interface CueNecessityEvaluation {
  readonly isCorrect: boolean
  readonly message: string
  readonly canContinue: boolean
}

export interface SceneAttempt {
  readonly sceneId: SceneId
  readonly initialPrediction: string
  readonly clueDecision: ClueDecision
  readonly clueEvaluation: ClueEvaluation
  readonly meaningDecision: MeaningDecisionId
  readonly meaningEvaluation: MeaningEvaluation
}

export interface WordAttempt {
  readonly wordId: WordId
  readonly scenes: readonly SceneAttempt[]
  readonly cueNecessityDecision?: CueNecessityDecision
  readonly cueNecessityEvaluation?: CueNecessityEvaluation
  readonly repairSelection?: RepairSolutionId
}

export type FeedbackTone = 'status' | 'error'

export interface FeedbackInput {
  readonly tone: FeedbackTone
  readonly message: string
}

export interface SessionFeedback extends FeedbackInput {
  readonly sequence: number
}

export interface SessionState {
  readonly phase: SessionPhase
  readonly routeId?: RouteId
  readonly routeWordIds: readonly WordId[]
  readonly currentWordIndex: number
  readonly currentSceneIndex: 0 | 1 | 2
  readonly draftPrediction: string
  readonly draftClueDecision?: ClueDecision
  readonly draftClueEvaluation?: ClueEvaluation
  readonly draftMeaningEvaluation?: MeaningEvaluation
  readonly attempts: readonly WordAttempt[]
  readonly feedback: SessionFeedback | null
  readonly feedbackSequence: number
}

export type SessionAction =
  | { readonly type: 'START_ROUTE'; readonly routeId: RouteId }
  | { readonly type: 'SAVE_PREDICTION'; readonly prediction: string }
  | { readonly type: 'SAVE_CLUE_DECISION'; readonly decision: ClueDecision }
  | { readonly type: 'CONFIRM_MEANING'; readonly decision: MeaningDecisionId }
  | { readonly type: 'CONFIRM_CUE_NECESSITY'; readonly decision: CueNecessityDecision }
  | { readonly type: 'CONFIRM_REPAIR'; readonly solutionId: RepairSolutionId }
  | { readonly type: 'ANNOUNCE_FEEDBACK'; readonly feedback: FeedbackInput }
  | { readonly type: 'CLEAR_FEEDBACK' }
  | { readonly type: 'RESTART_ROUTE' }
  | { readonly type: 'RETURN_TO_ENTRANCE' }

export interface CompletedEvidence {
  readonly meaning: boolean
  readonly evidence: boolean
  readonly uncertainty: boolean
  readonly clarity: boolean
}

export type ExplorationClueRecord =
  | { readonly kind: 'tokens'; readonly labels: readonly string[] }
  | { readonly kind: 'insufficient'; readonly label: '결정 단서가 없어요' }

export interface SceneExplorationRecord {
  readonly sceneId: SceneId
  readonly initialPrediction: string
  readonly clue: ExplorationClueRecord
  readonly meaningDecision: MeaningDecisionId
  readonly meaningLabel: string
}

export interface WordExplorationRecord {
  readonly wordId: WordId
  readonly lemma: string
  readonly scenes: readonly SceneExplorationRecord[]
  readonly cueNecessity: {
    readonly decision: CueNecessityDecision
    readonly explanation: string
  }
  readonly repair: {
    readonly solutionId: RepairSolutionId
    readonly completedSentence: string
  }
}

export interface ExplorationRecord {
  readonly routeId: RouteId
  readonly routeLabel: '기본 길 4개' | '확장 길 4개' | '전체 길 8개'
  readonly words: readonly WordExplorationRecord[]
  readonly evidence: CompletedEvidence
}
