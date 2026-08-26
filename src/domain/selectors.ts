import type { ContextScene, WordPack } from './contentTypes'
import type {
  CompletedEvidence,
  ExplorationClueRecord,
  ExplorationRecord,
  SceneExplorationRecord,
  SessionState,
  WordExplorationRecord,
} from './sessionTypes'

export function getCurrentWordPack(state: SessionState, wordPacks: readonly WordPack[]): WordPack | null {
  const wordId = state.routeWordIds[state.currentWordIndex]
  return wordId ? wordPacks.find((pack) => pack.id === wordId) ?? null : null
}

export function getCurrentScene(state: SessionState, wordPacks: readonly WordPack[]): ContextScene | null {
  return getCurrentWordPack(state, wordPacks)?.scenes[state.currentSceneIndex] ?? null
}

export function getCompletedEvidence(state: SessionState): CompletedEvidence {
  const sceneAttempts = state.attempts.flatMap((attempt) => attempt.scenes)
  return {
    meaning: sceneAttempts.some((attempt) => attempt.meaningEvaluation.isCorrect && attempt.meaningDecision !== 'insufficient-context'),
    evidence: sceneAttempts.some((attempt) => attempt.clueEvaluation.evidenceKind === 'decisive') &&
      state.attempts.some((attempt) => attempt.cueNecessityEvaluation?.isCorrect === true),
    uncertainty: sceneAttempts.some((attempt) => attempt.clueEvaluation.evidenceKind === 'insufficient-correct' && attempt.meaningEvaluation.isCorrect),
    clarity: state.attempts.some((attempt) => attempt.repairSelection !== undefined),
  }
}

function sceneRecord(state: SessionState, pack: WordPack, sceneIndex: 0 | 1 | 2): SceneExplorationRecord | null {
  const scene = pack.scenes[sceneIndex]
  const attempt = state.attempts.find((item) => item.wordId === pack.id)?.scenes.find((item) => item.sceneId === scene.id)
  if (!attempt) return null
  const tokens = scene.sentences.flatMap((sentence) => sentence.tokens)
  let clue: ExplorationClueRecord
  if (attempt.clueDecision.kind === 'insufficient') {
    clue = { kind: 'insufficient', label: '결정 단서가 없어요' }
  } else {
    clue = {
      kind: 'tokens',
      labels: attempt.clueDecision.tokenIds.map((tokenId) => tokens.find((token) => token.id === tokenId)?.text ?? tokenId),
    }
  }
  const meaningLabel = attempt.meaningDecision === 'insufficient-context'
    ? '판단하기 어려움'
    : pack.meanings.find((meaning) => meaning.id === attempt.meaningDecision)?.childFriendlyLabel ?? attempt.meaningDecision
  return {
    sceneId: scene.id,
    initialPrediction: attempt.initialPrediction,
    clue,
    meaningDecision: attempt.meaningDecision,
    meaningLabel,
  }
}

function wordRecord(state: SessionState, pack: WordPack): WordExplorationRecord | null {
  const attempt = state.attempts.find((item) => item.wordId === pack.id)
  const scenes = [0, 1, 2].map((index) => sceneRecord(state, pack, index as 0 | 1 | 2))
  const repairSolution = attempt?.repairSelection ? pack.repair.solutions.find((solution) => solution.id === attempt.repairSelection) : undefined
  if (!attempt || scenes.some((scene) => scene === null) || !attempt.cueNecessityDecision || !attempt.cueNecessityEvaluation?.isCorrect || !repairSolution) return null
  return {
    wordId: pack.id,
    lemma: pack.lemma,
    scenes: scenes as SceneExplorationRecord[],
    cueNecessity: { decision: attempt.cueNecessityDecision, explanation: pack.necessityChallenge.explanation },
    repair: { solutionId: repairSolution.id, completedSentence: repairSolution.completedSentence },
  }
}

export function getExplorationRecord(state: SessionState, wordPacks: readonly WordPack[]): ExplorationRecord | null {
  if (!state.routeId || state.phase !== 'record') return null
  const words = state.routeWordIds.map((wordId) => {
    const pack = wordPacks.find((item) => item.id === wordId)
    return pack ? wordRecord(state, pack) : null
  })
  if (words.some((word) => word === null)) return null
  const route = state.routeId === 'core'
    ? '기본 길 4개'
    : state.routeId === 'extension'
      ? '확장 길 4개'
      : '전체 길 8개'
  return {
    routeId: state.routeId,
    routeLabel: route,
    words: words as WordExplorationRecord[],
    evidence: getCompletedEvidence(state),
  }
}
