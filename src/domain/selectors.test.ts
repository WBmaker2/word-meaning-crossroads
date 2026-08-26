import { describe, expect, it } from 'vitest'
import { WORD_PACKS } from '../content/wordPacks'
import { getCompletedEvidence, getCurrentScene, getCurrentWordPack, getExplorationRecord } from './selectors'
import { createInitialSessionState, sessionReducer } from './sessionReducer'
import type { SessionState } from './sessionTypes'

const completeRoute = (): SessionState => {
  let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
  for (let word = 0; word < 4; word += 1) {
    for (let scene = 0; scene < 2; scene += 1) {
      const pack = WORD_PACKS.find((item) => item.id === state.routeWordIds[state.currentWordIndex])!
      const current = pack.scenes[state.currentSceneIndex]
      state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: `예상 ${word}-${scene}` })
      state = sessionReducer(state, {
        type: 'SAVE_CLUE_DECISION',
        decision: current.expectedDecision === 'insufficient-context'
          ? { kind: 'insufficient' }
          : { kind: 'tokens', tokenIds: [current.decisiveCueTokenIds[0]] },
      })
      state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: current.expectedDecision })
    }
    const pack = WORD_PACKS.find((item) => item.id === state.routeWordIds[state.currentWordIndex])!
    state = sessionReducer(state, { type: 'CONFIRM_CUE_NECESSITY', decision: pack.necessityChallenge.expectedClarity })
    const current = pack.scenes[state.currentSceneIndex]
    state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: `예상 ${word}-2` })
    state = sessionReducer(state, {
      type: 'SAVE_CLUE_DECISION',
      decision: current.expectedDecision === 'insufficient-context'
        ? { kind: 'insufficient' }
        : { kind: 'tokens', tokenIds: [current.decisiveCueTokenIds[0]] },
    })
    state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: current.expectedDecision })
    state = sessionReducer(state, { type: 'CONFIRM_REPAIR', solutionId: pack.repair.solutions[0].id })
  }
  return state
}

describe('session selectors', () => {
  it('selects the current word and scene from route indexes', () => {
    const entrance = createInitialSessionState()
    expect(getCurrentWordPack(entrance, WORD_PACKS)).toBeNull()
    expect(getCurrentScene(entrance, WORD_PACKS)).toBeNull()
    const started = sessionReducer(entrance, { type: 'START_ROUTE', routeId: 'core' })
    expect(getCurrentWordPack(started, WORD_PACKS)?.id).toBe('nun')
    expect(getCurrentScene(started, WORD_PACKS)?.id).toBe('nun-snow-01')
    const nextWord = sessionReducer(
      sessionReducer(
        sessionReducer(started, { type: 'SAVE_PREDICTION', prediction: '예상' }),
        { type: 'SAVE_CLUE_DECISION', decision: { kind: 'tokens', tokenIds: ['nun-snow-01:t4'] } },
      ),
      { type: 'CONFIRM_MEANING', decision: 'nun:snow' },
    )
    expect(getCurrentScene(nextWord, WORD_PACKS)?.id).toBe('nun-eye-02')
  })

  it('calculates the four evidence flags incrementally from real progression', () => {
    let state = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    expect(getCompletedEvidence(state)).toEqual({ meaning: false, evidence: false, uncertainty: false, clarity: false })
    state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })
    state = sessionReducer(state, { type: 'SAVE_CLUE_DECISION', decision: { kind: 'tokens', tokenIds: ['nun-snow-01:t4'] } })
    state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: 'nun:snow' })
    expect(getCompletedEvidence(state)).toEqual({ meaning: true, evidence: false, uncertainty: false, clarity: false })
    state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })
    state = sessionReducer(state, { type: 'SAVE_CLUE_DECISION', decision: { kind: 'tokens', tokenIds: ['nun-eye-02:t6'] } })
    state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: 'nun:eye' })
    state = sessionReducer(state, { type: 'CONFIRM_CUE_NECESSITY', decision: 'still-clear' })
    expect(getCompletedEvidence(state)).toEqual({ meaning: true, evidence: true, uncertainty: false, clarity: false })
    state = sessionReducer(state, { type: 'SAVE_PREDICTION', prediction: '예상' })
    state = sessionReducer(state, { type: 'SAVE_CLUE_DECISION', decision: { kind: 'insufficient' } })
    state = sessionReducer(state, { type: 'CONFIRM_MEANING', decision: 'insufficient-context' })
    expect(getCompletedEvidence(state)).toEqual({ meaning: true, evidence: true, uncertainty: true, clarity: false })
    state = sessionReducer(state, { type: 'CONFIRM_REPAIR', solutionId: 'nun-snow' })
    expect(getCompletedEvidence(state)).toEqual({ meaning: true, evidence: true, uncertainty: true, clarity: true })
  })

  it('returns null until every word has all recordable evidence', () => {
    const started = sessionReducer(createInitialSessionState(), { type: 'START_ROUTE', routeId: 'core' })
    expect(getExplorationRecord(started, WORD_PACKS)).toBeNull()
    expect(getExplorationRecord(completeRoute(), WORD_PACKS)).not.toBeNull()
  })

  it('creates original scene-order records with labels and necessity explanation', () => {
    const record = getExplorationRecord(completeRoute(), WORD_PACKS)
    expect(record?.routeId).toBe('core')
    expect(record?.routeLabel).toBe('기본 길 4개')
    expect(record?.words[0].scenes.map((scene) => scene.sceneId)).toEqual(['nun-snow-01', 'nun-eye-02', 'nun-uncertain-03'])
    expect(record?.words[0].scenes[0].initialPrediction).toBe('예상 0-0')
    expect(record?.words[0].scenes[0].clue).toEqual({ kind: 'tokens', labels: ['내려'] })
    expect(record?.words[0].scenes[0].meaningDecision).toBe('nun:snow')
    expect(record?.words[0].scenes[0].meaningLabel).toBe('내리는 눈')
    expect(record?.words[0].scenes[2].clue).toEqual({ kind: 'insufficient', label: '결정 단서가 없어요' })
    expect(record?.words[0].cueNecessity).toEqual({
      decision: 'still-clear',
      explanation: WORD_PACKS[0].necessityChallenge.explanation,
    })
    expect(record?.words[0].repair).toEqual({
      solutionId: 'nun-snow',
      completedSentence: WORD_PACKS[0].repair.solutions[0].completedSentence,
    })
  })

  it('does not expose score, grade, time, or rank fields', () => {
    const record = getExplorationRecord(completeRoute(), WORD_PACKS) as unknown as Record<string, unknown>
    const forbidden = new Set(['score', 'grade', 'time', 'rank', 'timer'])
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) return value.forEach(visit)
      if (!value || typeof value !== 'object') return
      Object.entries(value).forEach(([key, child]) => {
        expect(forbidden.has(key.toLowerCase())).toBe(false)
        visit(child)
      })
    }
    visit(record)
  })
})
