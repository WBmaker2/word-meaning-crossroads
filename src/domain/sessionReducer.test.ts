import { describe, expect, it } from 'vitest'
import { WORD_PACKS } from '../content/wordPacks'
import { useMissionSession } from '../hooks/useMissionSession'
import { getCurrentScene, getCurrentWordPack, getExplorationRecord } from './selectors'
import {
  evaluateClueDecision,
  evaluateCueNecessity,
  evaluateMeaningDecision,
  evaluateRepairSelection,
} from './evaluation'
import {
  createInitialSessionState,
  sessionReducer,
} from './sessionReducer'
import type { ClueDecision, SessionState } from './sessionTypes'

const currentPack = (state: SessionState) =>
  WORD_PACKS.find((pack) => pack.id === state.routeWordIds[state.currentWordIndex])!

const currentScene = (state: SessionState) => currentPack(state).scenes[state.currentSceneIndex]

const reachMeaning = (): SessionState => {
  let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
  state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })
  const scene = currentScene(state)
  return sessionReducer(state, {
    type: 'SAVE_CLUE_DECISION',
    decision: { kind: 'tokens', tokenIds: [scene.decisiveCueTokenIds[0]] },
  })
}

const reachComparison = (): SessionState => {
  let state = reachMeaning()
  state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: currentScene(state).expectedDecision })
  state = submitCurrentScene(state)
  return state
}

const reachRepair = (): SessionState => {
  let state = reachComparison()
  state = sessionReducer(state, {
    type: 'CONFIRM_CUE_NECESSITY',
    decision: currentPack(state).necessityChallenge.expectedClarity,
  })
  return submitCurrentScene(state)
}

const submitCurrentScene = (state: SessionState): SessionState => {
  const scene = currentScene(state)
  const clueDecision: ClueDecision = scene.expectedDecision === 'insufficient-context'
    ? { kind: 'insufficient' }
    : { kind: 'tokens', tokenIds: [scene.decisiveCueTokenIds[0]] }
  let next = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '문맥을 살펴볼래요' })
  next = sessionReducer(next, { type: 'SAVE_CLUE_DECISION', decision: clueDecision })
  return sessionReducer(next, { type: 'CONFIRM_MEANING', decision: scene.expectedDecision })
}

const completeRoute = (routeId: 'core' | 'extension' | 'all'): SessionState => {
  let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId })
  for (let wordIndex = 0; wordIndex < state.routeWordIds.length; wordIndex += 1) {
    state = submitCurrentScene(state)
    state = submitCurrentScene(state)
    state = sessionReducer(state, {
      type: 'CONFIRM_CUE_NECESSITY',
      decision: currentPack(state).necessityChallenge.expectedClarity,
    })
    state = submitCurrentScene(state)
    state = sessionReducer(state, {
      type: 'CONFIRM_REPAIR',
      solutionId: currentPack(state).repair.solutions[0].id,
    })
  }
  return state
}

describe('sessionReducer', () => {
  it('starts with an empty entrance session', () => {
    expect(createInitialSessionState()).toMatchObject({
      phase: 'entrance',
      routeWordIds: [],
      currentWordIndex: 0,
      currentSceneIndex: 0,
      draftPrediction: '',
      attempts: [],
      feedback: null,
      feedbackSequence: 0,
    })
  })

  it('starts core at nun scene zero and saves a trimmed prediction', () => {
    const started = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    expect(started).toMatchObject({ phase: 'prediction', routeId: 'core', routeWordIds: ['nun', 'bae', 'bam', 'mal'] })
    const saved = sessionReducer(started, { type: 'SAVE_PREDICTION', prediction: '  내리는 뜻 같아요  ' })
    expect(saved.phase).toBe('clue-investigation')
    expect(saved.draftPrediction).toBe('내리는 뜻 같아요')
  })

  it('rejects empty and overlong predictions without leaving prediction', () => {
    const started = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    const empty = sessionReducer(started, { type: 'SAVE_PREDICTION', prediction: '   ' })
    expect(empty.phase).toBe('prediction')
    expect(empty.feedback?.tone).toBe('error')
    const long = sessionReducer(started, { type: 'SAVE_PREDICTION', prediction: 'a'.repeat(61) })
    expect(long.phase).toBe('prediction')
    expect(long.feedback?.tone).toBe('error')
  })

  it('requires decisive clue evidence before showing the meaning signpost', () => {
    let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })
    const scene = currentScene(state)
    const wrong = sessionReducer(state, {
      type: 'SAVE_CLUE_DECISION',
      decision: { kind: 'tokens', tokenIds: [scene.supportiveCueTokenIds[0]] },
    })
    expect(wrong.phase).toBe('clue-investigation')
    expect(wrong.feedback?.tone).toBe('error')
    const right = sessionReducer(wrong, {
      type: 'SAVE_CLUE_DECISION',
      decision: { kind: 'tokens', tokenIds: [scene.decisiveCueTokenIds[0]] },
    })
    expect(right.phase).toBe('meaning-signpost')
    expect(right.draftClueEvaluation?.isCorrect).toBe(true)
  })

  it('advances through three scenes, comparison, and repair', () => {
    let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    state = submitCurrentScene(state)
    expect(state.phase).toBe('prediction')
    expect(state.currentSceneIndex).toBe(1)
    state = submitCurrentScene(state)
    expect(state.phase).toBe('comparison')
    state = sessionReducer(state, { type: 'CONFIRM_CUE_NECESSITY', decision: 'now-unclear' })
    expect(state.phase).toBe('comparison')
    expect(state.feedback?.tone).toBe('error')
    state = sessionReducer(state, {
      type: 'CONFIRM_CUE_NECESSITY',
      decision: currentPack(state).necessityChallenge.expectedClarity,
    })
    expect(state.phase).toBe('prediction')
    state = submitCurrentScene(state)
    expect(state.phase).toBe('sentence-repair')
    const repairId = currentPack(state).repair.solutions[0].id
    state = sessionReducer(state, { type: 'CONFIRM_REPAIR', solutionId: repairId })
    expect(state.phase).toBe('prediction')
    expect(state.currentWordIndex).toBe(1)
  })

  it('keeps incorrect meaning and repair choices in their phases', () => {
    let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })
    const scene = currentScene(state)
    state = sessionReducer(state, {
      type: 'SAVE_CLUE_DECISION',
      decision: { kind: 'tokens', tokenIds: [scene.decisiveCueTokenIds[0]] },
    })
    const incorrectMeaning = scene.candidateMeaningIds.find((id) => id !== scene.expectedDecision)!
    state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: incorrectMeaning })
    expect(state.phase).toBe('meaning-signpost')
    expect(state.feedback?.tone).toBe('error')
    state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: scene.expectedDecision })
    state = submitCurrentScene(state)
    state = sessionReducer(state, { type: 'CONFIRM_CUE_NECESSITY', decision: currentPack(state).necessityChallenge.expectedClarity })
    state = submitCurrentScene(state)
    state = sessionReducer(state, { type: 'CONFIRM_REPAIR', solutionId: 'bae-boat' })
    expect(state.phase).toBe('sentence-repair')
    expect(state.feedback?.tone).toBe('error')
  })

  it('increments one feedback sequence per new feedback and clears only the channel', () => {
    const initial = createInitialSessionState()
    const announced = sessionReducer(initial, {
      type: 'ANNOUNCE_FEEDBACK',
      feedback: { tone: 'error', message: '단서는 두 개까지 고를 수 있어요' },
    })
    expect(announced.feedback).toMatchObject({ tone: 'error', message: '단서는 두 개까지 고를 수 있어요', sequence: 1 })
    expect(announced.feedbackSequence).toBe(1)
    const cleared = sessionReducer(announced, { type: 'CLEAR_FEEDBACK' })
    expect(cleared.feedback).toBeNull()
    expect(cleared.feedbackSequence).toBe(1)
    expect(cleared.phase).toBe(initial.phase)
  })

  it('restarts a route in memory and returns to an empty entrance without storage APIs', () => {
    let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })
    const restarted = sessionReducer(state, { type: 'RESTART_ROUTE' })
    expect(restarted).toMatchObject({ phase: 'prediction', routeId: 'core', currentWordIndex: 0, currentSceneIndex: 0, draftPrediction: '', attempts: [] })
    expect(sessionReducer(restarted, { type: 'RETURN_TO_ENTRANCE' })).toMatchObject({ phase: 'entrance', routeWordIds: [], attempts: [] })
  })

  it('completes core, extension, and all in exact route order', () => {
    expect(completeRoute('core')).toMatchObject({ phase: 'record', routeWordIds: ['nun', 'bae', 'bam', 'mal'], currentWordIndex: 3 })
    expect(completeRoute('extension')).toMatchObject({ phase: 'record', routeWordIds: ['chada', 'dari', 'sseuda', 'gamda'], currentWordIndex: 3 })
    expect(completeRoute('all')).toMatchObject({ phase: 'record', routeWordIds: ['nun', 'bae', 'bam', 'mal', 'chada', 'dari', 'sseuda', 'gamda'], currentWordIndex: 7 })
  })

  it('ignores learning actions outside their phase', () => {
    const state = createInitialSessionState()
    expect(sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })).toBe(state)
    expect(sessionReducer(state, { type: 'CONFIRM_MEANING', decision: 'nun:snow' })).toBe(state)
    const started = sessionReducer(state, { type: 'START_ROUTE', routeId: 'core' })
    expect(sessionReducer(started, { type: 'CONFIRM_REPAIR', solutionId: 'nun-snow' })).toBe(started)
  })

  it('keeps successful meaning feedback as status', () => {
    let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    state = submitCurrentScene(state)
    expect(state.feedback?.tone).toBe('status')
    expect(evaluateMeaningDecision(WORD_PACKS[0].scenes[0], 'nun:snow').isCorrect).toBe(true)
  })

  it('uses the evaluator message, phase, tone, and one sequence increment for each invalid and valid submission', () => {
    const clueState = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    const predicted = sessionReducer(clueState, { type: 'SAVE_PREDICTION', prediction: '예상' })
    const clueScene = currentScene(predicted)
    const badClue: ClueDecision = { kind: 'tokens', tokenIds: [clueScene.supportiveCueTokenIds[0]] }
    const badClueEvaluation = evaluateClueDecision(clueScene, badClue)
    const rejectedClue = sessionReducer(predicted, { type: 'SAVE_CLUE_DECISION', decision: badClue })
    expect(rejectedClue.phase).toBe('clue-investigation')
    expect(rejectedClue.feedback).toMatchObject({ tone: 'error', message: badClueEvaluation.message })
    expect(rejectedClue.feedbackSequence).toBe(predicted.feedbackSequence + 1)
    const goodClue: ClueDecision = { kind: 'tokens', tokenIds: [clueScene.decisiveCueTokenIds[0]] }
    const goodClueEvaluation = evaluateClueDecision(clueScene, goodClue)
    const acceptedClue = sessionReducer(rejectedClue, { type: 'SAVE_CLUE_DECISION', decision: goodClue })
    expect(acceptedClue.phase).toBe('meaning-signpost')
    expect(acceptedClue.feedback).toMatchObject({ tone: 'status', message: goodClueEvaluation.message })
    expect(acceptedClue.feedbackSequence).toBe(rejectedClue.feedbackSequence + 1)

    const wrongMeaning = clueScene.candidateMeaningIds.find((id) => id !== clueScene.expectedDecision)!
    const badMeaningEvaluation = evaluateMeaningDecision(clueScene, wrongMeaning)
    const rejectedMeaning = sessionReducer(acceptedClue, { type: 'CONFIRM_MEANING', decision: wrongMeaning })
    expect(rejectedMeaning.phase).toBe('meaning-signpost')
    expect(rejectedMeaning.feedback).toMatchObject({ tone: 'error', message: badMeaningEvaluation.message })
    expect(rejectedMeaning.feedbackSequence).toBe(acceptedClue.feedbackSequence + 1)
    const goodMeaningEvaluation = evaluateMeaningDecision(clueScene, clueScene.expectedDecision)
    const acceptedMeaning = sessionReducer(rejectedMeaning, { type: 'CONFIRM_MEANING', decision: clueScene.expectedDecision })
    expect(acceptedMeaning.phase).toBe('prediction')
    expect(acceptedMeaning.feedback).toMatchObject({ tone: 'status', message: goodMeaningEvaluation.message })
    expect(acceptedMeaning.feedbackSequence).toBe(rejectedMeaning.feedbackSequence + 1)

    const comparison = reachComparison()
    const challenge = currentPack(comparison).necessityChallenge
    const wrongNecessity = challenge.expectedClarity === 'still-clear' ? 'now-unclear' : 'still-clear'
    const badNecessityEvaluation = evaluateCueNecessity(challenge, wrongNecessity)
    const rejectedNecessity = sessionReducer(comparison, { type: 'CONFIRM_CUE_NECESSITY', decision: wrongNecessity })
    expect(rejectedNecessity.phase).toBe('comparison')
    expect(rejectedNecessity.feedback).toMatchObject({ tone: 'error', message: badNecessityEvaluation.message })
    expect(rejectedNecessity.feedbackSequence).toBe(comparison.feedbackSequence + 1)
    const goodNecessityEvaluation = evaluateCueNecessity(challenge, challenge.expectedClarity)
    const acceptedNecessity = sessionReducer(rejectedNecessity, { type: 'CONFIRM_CUE_NECESSITY', decision: challenge.expectedClarity })
    expect(acceptedNecessity.phase).toBe('prediction')
    expect(acceptedNecessity.feedback).toMatchObject({ tone: 'status', message: goodNecessityEvaluation.message })
    expect(acceptedNecessity.feedbackSequence).toBe(rejectedNecessity.feedbackSequence + 1)

    const repair = reachRepair()
    const repairChallenge = currentPack(repair).repair
    const badRepairEvaluation = evaluateRepairSelection(repairChallenge, 'bae-boat')
    const rejectedRepair = sessionReducer(repair, { type: 'CONFIRM_REPAIR', solutionId: 'bae-boat' })
    expect(rejectedRepair.phase).toBe('sentence-repair')
    expect(rejectedRepair.feedback).toMatchObject({ tone: 'error', message: badRepairEvaluation.message })
    expect(rejectedRepair.feedbackSequence).toBe(repair.feedbackSequence + 1)
    const goodRepair = repairChallenge.solutions[0]
    const goodRepairEvaluation = evaluateRepairSelection(repairChallenge, goodRepair.id)
    const acceptedRepair = sessionReducer(rejectedRepair, { type: 'CONFIRM_REPAIR', solutionId: goodRepair.id })
    expect(acceptedRepair.feedback).toMatchObject({ tone: 'status', message: goodRepairEvaluation.message })
    expect(acceptedRepair.feedbackSequence).toBe(rejectedRepair.feedbackSequence + 1)
  })

  it('clears every draft and attempt field on restart after a populated repair state', () => {
    const reachedRepair = reachRepair()
    const dirty: SessionState = {
      ...reachedRepair,
      draftPrediction: '남겨 둔 예상',
      draftClueDecision: reachedRepair.attempts[0].scenes[0].clueDecision,
      draftClueEvaluation: reachedRepair.attempts[0].scenes[0].clueEvaluation,
      draftMeaningEvaluation: reachedRepair.attempts[0].scenes[0].meaningEvaluation,
    }
    const restarted = sessionReducer(dirty, { type: 'RESTART_ROUTE' })
    expect(restarted).toMatchObject({ phase: 'prediction', routeId: 'core', routeWordIds: ['nun', 'bae', 'bam', 'mal'], currentWordIndex: 0, currentSceneIndex: 0, draftPrediction: '', attempts: [], feedback: null })
    expect(restarted.draftClueDecision).toBeUndefined()
    expect(restarted.draftClueEvaluation).toBeUndefined()
    expect(restarted.draftMeaningEvaluation).toBeUndefined()
    expect(restarted.feedbackSequence).toBe(0)
    expect(sessionReducer(dirty, { type: 'RETURN_TO_ENTRANCE' })).toEqual(createInitialSessionState())
    const moduleSources = [
      sessionReducer.toString(),
      getCurrentScene.toString(),
      getCurrentWordPack.toString(),
      getExplorationRecord.toString(),
      useMissionSession.toString(),
    ].join('\n')
    expect(moduleSources).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|fetch\s*\(/i)
  })

  it('returns new state without mutating prior state or attempt arrays', () => {
    const started = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    const predicted = sessionReducer(started, { type: 'SAVE_PREDICTION', prediction: '예상' })
    expect(started.draftPrediction).toBe('')
    expect(started.attempts).toEqual([])
    const scene = currentScene(predicted)
    const meaning = sessionReducer(
      sessionReducer(predicted, { type: 'SAVE_CLUE_DECISION', decision: { kind: 'tokens', tokenIds: [scene.decisiveCueTokenIds[0]] } }),
      { type: 'CONFIRM_MEANING', decision: scene.expectedDecision },
    )
    expect(predicted.attempts).toEqual([])
    const comparison = submitCurrentScene(meaning)
    const attemptsBeforeNecessity = comparison.attempts
    const afterNecessity = sessionReducer(comparison, {
      type: 'CONFIRM_CUE_NECESSITY',
      decision: currentPack(comparison).necessityChallenge.expectedClarity,
    })
    expect(comparison.attempts).toBe(attemptsBeforeNecessity)
    expect(afterNecessity.attempts).not.toBe(comparison.attempts)
    expect(comparison.phase).toBe('comparison')
  })

  it('keeps every learning action as an exact no-op when its phase does not accept it', () => {
    const actions = [
      { type: 'SAVE_PREDICTION', prediction: '예상' },
      { type: 'SAVE_CLUE_DECISION', decision: { kind: 'insufficient' } },
      { type: 'CONFIRM_MEANING', decision: 'nun:snow' },
      { type: 'CONFIRM_CUE_NECESSITY', decision: 'still-clear' },
      { type: 'CONFIRM_REPAIR', solutionId: 'nun-snow' },
    ] as const
    const entrance = createInitialSessionState()
    for (const action of actions) {
      expect(sessionReducer(entrance, action)).toBe(entrance)
    }
    const started = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    for (const action of actions.slice(1)) expect(sessionReducer(started, action)).toBe(started)
    const clue = sessionReducer(started, { type: 'SAVE_PREDICTION', prediction: '예상' })
    expect(sessionReducer(clue, actions[0])).toBe(clue)
    expect(sessionReducer(clue, actions[2])).toBe(clue)
    const signpost = sessionReducer(clue, { type: 'SAVE_CLUE_DECISION', decision: { kind: 'tokens', tokenIds: [currentScene(clue).decisiveCueTokenIds[0]] } })
    expect(sessionReducer(signpost, actions[0])).toBe(signpost)
    expect(sessionReducer(signpost, actions[1])).toBe(signpost)
    const firstSceneDone = sessionReducer(signpost, { type: 'CONFIRM_MEANING', decision: currentScene(signpost).expectedDecision })
    const comparison = submitCurrentScene(firstSceneDone)
    expect(sessionReducer(comparison, actions[0])).toBe(comparison)
    expect(sessionReducer(comparison, actions[2])).toBe(comparison)
    const sentenceRepair = sessionReducer(comparison, { type: 'CONFIRM_CUE_NECESSITY', decision: currentPack(comparison).necessityChallenge.expectedClarity })
    const repair = submitCurrentScene(sentenceRepair)
    expect(sessionReducer(repair, actions[0])).toBe(repair)
    expect(sessionReducer(repair, actions[1])).toBe(repair)
    expect(sessionReducer(repair, actions[2])).toBe(repair)
    expect(sessionReducer(repair, actions[3])).toBe(repair)
  })
})
