import { ROUTES } from '../content/routes'
import { WORD_PACKS } from '../content/wordPacks'
import { evaluateClueDecision, evaluateCueNecessity, evaluateMeaningDecision, evaluateRepairSelection } from './evaluation'
import type { ContextScene, WordPack } from './contentTypes'
import type {
  SceneAttempt,
  SessionAction,
  SessionState,
  FeedbackInput,
  WordAttempt,
} from './sessionTypes'

const emptyDraft = {
  draftPrediction: '',
  draftClueDecision: undefined,
  draftClueEvaluation: undefined,
  draftMeaningEvaluation: undefined,
} as const

export function createInitialSessionState(): SessionState {
  return {
    phase: 'entrance',
    routeWordIds: [],
    currentWordIndex: 0,
    currentSceneIndex: 0,
    ...emptyDraft,
    attempts: [],
    feedback: null,
    feedbackSequence: 0,
  }
}

function withFeedback(state: SessionState, input: FeedbackInput): SessionState {
  const sequence = state.feedbackSequence + 1
  return { ...state, feedbackSequence: sequence, feedback: { ...input, sequence } }
}

function routeFor(routeId: SessionState['routeId']) {
  return routeId ? ROUTES.find((route) => route.id === routeId) : undefined
}

function currentPack(state: SessionState): WordPack | null {
  const wordId = state.routeWordIds[state.currentWordIndex]
  return wordId ? WORD_PACKS.find((pack) => pack.id === wordId) ?? null : null
}

function currentScene(state: SessionState): ContextScene | null {
  return currentPack(state)?.scenes[state.currentSceneIndex] ?? null
}

function createRouteState(routeId: NonNullable<SessionState['routeId']>): SessionState {
  const route = routeFor(routeId)
  if (!route) return createInitialSessionState()
  return {
    phase: 'prediction',
    routeId,
    routeWordIds: [...route.wordIds],
    currentWordIndex: 0,
    currentSceneIndex: 0,
    ...emptyDraft,
    attempts: [],
    feedback: null,
    feedbackSequence: 0,
  }
}

function upsertWordAttempt(attempts: readonly WordAttempt[], next: WordAttempt): readonly WordAttempt[] {
  const index = attempts.findIndex((attempt) => attempt.wordId === next.wordId)
  if (index < 0) return [...attempts, next]
  return attempts.map((attempt, attemptIndex) => (attemptIndex === index ? next : attempt))
}

function upsertSceneAttempt(state: SessionState, sceneAttempt: SceneAttempt): SessionState {
  const pack = currentPack(state)
  if (!pack) return state
  const previous = state.attempts.find((attempt) => attempt.wordId === pack.id)
  const scenes = previous?.scenes.filter((attempt) => attempt.sceneId !== sceneAttempt.sceneId) ?? []
  const wordAttempt: WordAttempt = {
    wordId: pack.id,
    ...(previous ?? {}),
    scenes: [...scenes, sceneAttempt].sort((left, right) => {
      const leftOrder = pack.scenes.find((scene) => scene.id === left.sceneId)?.order ?? 0
      const rightOrder = pack.scenes.find((scene) => scene.id === right.sceneId)?.order ?? 0
      return leftOrder - rightOrder
    }),
  }
  return { ...state, attempts: upsertWordAttempt(state.attempts, wordAttempt) }
}

function currentWordAttempt(state: SessionState): WordAttempt | undefined {
  const pack = currentPack(state)
  return pack ? state.attempts.find((attempt) => attempt.wordId === pack.id) : undefined
}

function updateCurrentWordAttempt(state: SessionState, update: Partial<WordAttempt>): SessionState {
  const pack = currentPack(state)
  if (!pack) return state
  const previous = currentWordAttempt(state)
  const next: WordAttempt = { wordId: pack.id, scenes: [], ...(previous ?? {}), ...update }
  return { ...state, attempts: upsertWordAttempt(state.attempts, next) }
}

function clearDrafts(state: SessionState): SessionState {
  return { ...state, ...emptyDraft }
}

function reduceLearningAction(state: SessionState, action: Exclude<SessionAction, { type: 'START_ROUTE' | 'ANNOUNCE_FEEDBACK' | 'CLEAR_FEEDBACK' | 'RESTART_ROUTE' | 'RETURN_TO_ENTRANCE' }>): SessionState {
  const scene = currentScene(state)
  const pack = currentPack(state)
  if (!scene || !pack) return state

  switch (action.type) {
    case 'SAVE_PREDICTION': {
      if (state.phase !== 'prediction') return state
      const prediction = action.prediction.trim()
      if (prediction.length < 1 || prediction.length > 60) {
        return withFeedback(state, { tone: 'error', message: '이 문장에서 가리키는 뜻을 1~60자로 적어 주세요.' })
      }
      return withFeedback({ ...state, draftPrediction: prediction, phase: 'clue-investigation' }, {
        tone: 'status', message: '이제 문장에서 뜻을 알려 주는 단서를 찾아 보세요.',
      })
    }
    case 'SAVE_CLUE_DECISION': {
      if (state.phase !== 'clue-investigation') return state
      const evaluation = evaluateClueDecision(scene, action.decision)
      const next = { ...state, draftClueDecision: action.decision, draftClueEvaluation: evaluation }
      if (!evaluation.canContinue) return withFeedback(next, { tone: 'error', message: evaluation.message })
      return withFeedback({ ...next, phase: 'meaning-signpost' }, { tone: 'status', message: evaluation.message })
    }
    case 'CONFIRM_MEANING': {
      if (state.phase !== 'meaning-signpost' || !state.draftClueDecision || !state.draftClueEvaluation?.canContinue) return state
      const evaluation = evaluateMeaningDecision(scene, action.decision)
      const sceneAttempt: SceneAttempt = {
        sceneId: scene.id,
        initialPrediction: state.draftPrediction,
        clueDecision: state.draftClueDecision,
        clueEvaluation: state.draftClueEvaluation,
        meaningDecision: action.decision,
        meaningEvaluation: evaluation,
      }
      const recorded = upsertSceneAttempt(state, sceneAttempt)
      if (!evaluation.canContinue) return withFeedback({ ...recorded, draftMeaningEvaluation: evaluation }, { tone: 'error', message: evaluation.message })
      const progressed = scene.order === 1
        ? clearDrafts({ ...recorded, phase: 'prediction', currentSceneIndex: 1 })
        : scene.order === 2
          ? clearDrafts({ ...recorded, phase: 'comparison' })
          : clearDrafts({ ...recorded, phase: 'sentence-repair' })
      return withFeedback(progressed, { tone: 'status', message: evaluation.message })
    }
    case 'CONFIRM_CUE_NECESSITY': {
      if (state.phase !== 'comparison') return state
      const evaluation = evaluateCueNecessity(pack.necessityChallenge, action.decision)
      const recorded = updateCurrentWordAttempt(state, { cueNecessityDecision: action.decision, cueNecessityEvaluation: evaluation })
      if (!evaluation.canContinue) return withFeedback(recorded, { tone: 'error', message: evaluation.message })
      return withFeedback(clearDrafts({ ...recorded, phase: 'prediction', currentSceneIndex: 2 }), { tone: 'status', message: evaluation.message })
    }
    case 'CONFIRM_REPAIR': {
      if (state.phase !== 'sentence-repair') return state
      const evaluation = evaluateRepairSelection(pack.repair, action.solutionId)
      if (!evaluation.isCorrect || !evaluation.completedSentence) {
        return withFeedback(state, { tone: 'error', message: evaluation.message })
      }
      const recorded = updateCurrentWordAttempt(state, { repairSelection: action.solutionId })
      const isLastWord = state.currentWordIndex === state.routeWordIds.length - 1
      const progressed = isLastWord
        ? clearDrafts({ ...recorded, phase: 'record' })
        : clearDrafts({ ...recorded, phase: 'prediction', currentWordIndex: state.currentWordIndex + 1, currentSceneIndex: 0 })
      return withFeedback(progressed, { tone: 'status', message: evaluation.message })
    }
    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_ROUTE':
      return state.phase === 'entrance' ? createRouteState(action.routeId) : state
    case 'ANNOUNCE_FEEDBACK':
      return withFeedback(state, action.feedback)
    case 'CLEAR_FEEDBACK':
      return { ...state, feedback: null }
    case 'RESTART_ROUTE':
      return state.routeId ? createRouteState(state.routeId) : state
    case 'RETURN_TO_ENTRANCE':
      return createInitialSessionState()
    default:
      return reduceLearningAction(state, action)
  }
}
