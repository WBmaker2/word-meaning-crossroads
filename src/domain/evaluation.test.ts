import { describe, expect, it } from 'vitest'
import { WORD_PACKS } from '../content/wordPacks'
import type {
  ContextScene,
  CueNecessityChallenge,
  CueNecessityDecision,
  RepairChallenge,
} from './contentTypes'
import type { ClueDecision } from './sessionTypes'
import {
  evaluateClueDecision,
  evaluateCueNecessity,
  evaluateMeaningDecision,
  evaluateRepairSelection,
} from './evaluation'

const scene = (id: ContextScene['id']): ContextScene => {
  const result = WORD_PACKS.flatMap((pack) => pack.scenes).find((item) => item.id === id)
  if (!result) throw new Error(`Missing scene fixture: ${id}`)
  return result
}

const challenge = (id: RepairChallenge['id']): RepairChallenge => {
  const result = WORD_PACKS.find((pack) => pack.repair.id === id)?.repair
  if (!result) throw new Error(`Missing repair fixture: ${id}`)
  return result
}

const necessity = (id: CueNecessityChallenge['id']): CueNecessityChallenge => {
  const result = WORD_PACKS.find((pack) => pack.necessityChallenge.id === id)?.necessityChallenge
  if (!result) throw new Error(`Missing necessity fixture: ${id}`)
  return result
}

describe('evaluateClueDecision', () => {
  it('accepts one decisive token and a decisive-plus-supportive pair', () => {
    const target = scene('nun-snow-01')
    const decisive = target.decisiveCueTokenIds[0]
    const supportive = target.supportiveCueTokenIds[0]

    expect(evaluateClueDecision(target, { kind: 'tokens', tokenIds: [decisive] })).toEqual({
      isCorrect: true,
      evidenceKind: 'decisive',
      message: '뜻을 결정하는 단서를 찾았어요.',
      canContinue: true,
    })
    expect(evaluateClueDecision(target, { kind: 'tokens', tokenIds: [decisive, supportive] })).toEqual({
      isCorrect: true,
      evidenceKind: 'decisive',
      message: '뜻을 결정하는 단서를 찾았어요.',
      canContinue: true,
    })
  })

  it('rejects supportive-only and malformed three-token runtime decisions', () => {
    const target = scene('nun-snow-01')
    const [first, second] = target.supportiveCueTokenIds
    const decisive = target.decisiveCueTokenIds[0]

    const supportiveOnly = evaluateClueDecision(target, { kind: 'tokens', tokenIds: [first] })
    expect(supportiveOnly).toEqual({
      isCorrect: false,
      evidenceKind: 'supportive-only',
      message: '도움이 되는 단서예요. 결정 단서가 되는 말을 하나 더 찾아 보세요.',
      canContinue: false,
    })

    const malformed = evaluateClueDecision(target, {
      kind: 'tokens',
      tokenIds: [decisive, first, second] as unknown as Extract<ClueDecision, { kind: 'tokens' }>['tokenIds'],
    })
    expect(malformed).toEqual({
      isCorrect: false,
      evidenceKind: 'too-many',
      message: '현재 문장에서 서로 다른 단어를 1~2개 골라요. 단서는 두 개까지예요.',
      canContinue: false,
    })
  })

  it('requires insufficient for unclear scenes and rejects token selections', () => {
    const target = scene('bam-uncertain-03')
    const token = target.supportiveCueTokenIds[0]

    expect(evaluateClueDecision(target, { kind: 'insufficient' })).toEqual({
      isCorrect: true,
      evidenceKind: 'insufficient-correct',
      message: '결정 단서가 없다는 점을 잘 살폈어요.',
      canContinue: true,
    })
    const selected = evaluateClueDecision(target, { kind: 'tokens', tokenIds: [token] })
    expect(selected).toEqual({
      isCorrect: false,
      evidenceKind: 'insufficient-wrong',
      message: '이 문장만으로는 결정 단서가 없어 한 뜻으로 좁히기 어려워요. 결정하기 어려워요를 골라 보세요.',
      canContinue: false,
    })
  })

  it('rejects insufficient on a clear scene and names an available decision clue', () => {
    const target = scene('nun-snow-01')
    const result = evaluateClueDecision(target, { kind: 'insufficient' })

    expect(result).toEqual({
      isCorrect: false,
      evidenceKind: 'insufficient-wrong',
      message: '이 문장에는 뜻을 정할 수 있는 결정 단서가 있어요.',
      canContinue: false,
    })
  })

  it('rejects malformed token arrays instead of accepting foreign or duplicate evidence', () => {
    const target = scene('nun-snow-01')
    const decisive = target.decisiveCueTokenIds[0]
    const supportive = target.supportiveCueTokenIds[0]
    const malformedDecisions = [
      { kind: 'tokens', tokenIds: [] },
      { kind: 'tokens', tokenIds: [decisive, decisive] },
      { kind: 'tokens', tokenIds: ['unknown-scene:t99'] },
      { kind: 'tokens', tokenIds: [decisive, 'unknown-scene:t99'] },
    ] as unknown as ClueDecision[]

    for (const decision of malformedDecisions) {
      expect(evaluateClueDecision(target, decision)).toEqual({
        isCorrect: false,
        evidenceKind: 'too-many',
        message: '현재 문장에서 서로 다른 단어를 1~2개 골라요. 단서는 두 개까지예요.',
        canContinue: false,
      })
    }
    expect(evaluateClueDecision(target, { kind: 'tokens', tokenIds: [decisive, supportive] })).toEqual({
      isCorrect: true,
      evidenceKind: 'decisive',
      message: '뜻을 결정하는 단서를 찾았어요.',
      canContinue: true,
    })
  })
})

describe('evaluateMeaningDecision', () => {
  it('accepts a clear meaning, rejects a wrong meaning, and accepts uncertainty only when expected', () => {
    const clear = scene('nun-snow-01')
    expect(evaluateMeaningDecision(clear, 'nun:snow')).toEqual({
      isCorrect: true,
      decisionKind: 'specific-meaning',
      message: '주변 단서를 근거로 뜻을 잘 골랐어요.',
      canContinue: true,
    })
    const wrong = evaluateMeaningDecision(clear, 'nun:eye')
    expect(wrong).toEqual({
      isCorrect: false,
      decisionKind: 'specific-meaning',
      message: clear.wrongChoiceFeedback['nun:eye'],
      canContinue: false,
    })

    const unclear = scene('bam-uncertain-03')
    expect(evaluateMeaningDecision(unclear, 'insufficient-context')).toEqual({
      isCorrect: true,
      decisionKind: 'insufficient-context',
      message: '단서가 부족하다는 판단도 근거 있는 선택이에요.',
      canContinue: true,
    })
    const forced = evaluateMeaningDecision(unclear, 'bam:night')
    expect(forced).toEqual({
      isCorrect: false,
      decisionKind: 'specific-meaning',
      message: '‘좋아합니다’만으로는 어두운 시간인지 먹는 열매인지 결정되지 않아요. 주변 단서를 비교해 보세요. 판단하기 어려움도 하나의 답이 될 수 있어요.',
      canContinue: false,
    })
  })

  it('uses concrete scene feedback for every wrong decision without score fields', () => {
    const target = scene('nun-snow-01')
    const result = evaluateMeaningDecision(target, 'nun:eye')
    expect(result).toEqual({
      isCorrect: false,
      decisionKind: 'specific-meaning',
      message: target.wrongChoiceFeedback['nun:eye'],
      canContinue: false,
    })
    expect(result).not.toHaveProperty('score')
    expect(result).not.toHaveProperty('rank')
  })
})

describe('evaluateCueNecessity', () => {
  const expectedClarityById: Record<CueNecessityChallenge['id'], CueNecessityDecision> = {
    'necessity-nun': 'still-clear',
    'necessity-bae': 'now-unclear',
    'necessity-bam': 'now-unclear',
    'necessity-mal': 'now-unclear',
    'necessity-chada': 'still-clear',
    'necessity-dari': 'still-clear',
    'necessity-sseuda': 'still-clear',
    'necessity-gamda': 'still-clear',
  }
  const neutralWrongMessage = '가린 뒤 남은 말만으로 뜻을 정할 수 있는지 다시 비교해 보세요.'

  it('accepts only now-unclear for necessity-bae and explains removed 타고', () => {
    const target = necessity('necessity-bae')
    const correct = evaluateCueNecessity(target, 'now-unclear')
    expect(correct).toEqual({ isCorrect: true, message: target.explanation, canContinue: true })
    expect(evaluateCueNecessity(target, 'still-clear')).toEqual({
      isCorrect: false,
      message: neutralWrongMessage,
      canContinue: false,
    })
  })

  it('accepts only still-clear for necessity-dari and explains remaining 건넜습니다', () => {
    const target = necessity('necessity-dari')
    const correct = evaluateCueNecessity(target, 'still-clear')
    expect(correct).toEqual({ isCorrect: true, message: target.explanation, canContinue: true })
    expect(evaluateCueNecessity(target, 'now-unclear')).toEqual({
      isCorrect: false,
      message: neutralWrongMessage,
      canContinue: false,
    })
  })

  it.each(Object.entries(expectedClarityById))('uses the reviewed expected clarity for %s and never leaks it on wrong choice', (challengeId, expected) => {
    const target = necessity(challengeId as CueNecessityChallenge['id'])
    expect(target.expectedClarity).toBe(expected)
    expect(evaluateCueNecessity(target, expected)).toEqual({ isCorrect: true, message: target.explanation, canContinue: true })
    const wrong: CueNecessityDecision = expected === 'still-clear' ? 'now-unclear' : 'still-clear'
    expect(evaluateCueNecessity(target, wrong)).toEqual({ isCorrect: false, message: neutralWrongMessage, canContinue: false })
    expect(neutralWrongMessage).not.toContain(target.explanation)
    expect(neutralWrongMessage).not.toContain(expected === 'still-clear' ? '분명' : '어려워')
  })
})

describe('evaluateRepairSelection', () => {
  it('accepts at least two current solutions and returns useful alternatives', () => {
    const target = challenge('repair-nun')
    const first = evaluateRepairSelection(target, 'nun-snow')
    const second = evaluateRepairSelection(target, 'nun-eye')

    expect(first).toEqual({
      isCorrect: true,
      message: '내리는 장소와 모습을 덧붙였어요. 이제 한 가지 뜻으로 읽을 수 있어요.',
      completedSentence: '나는 창밖에 내리는 눈을 보았다.',
      alternativeSolutionIds: ['nun-eye'],
    })
    expect(second).toEqual({
      isCorrect: true,
      message: '거울 속 대상을 덧붙였어요. 이제 한 가지 뜻으로 읽을 수 있어요.',
      completedSentence: '나는 거울 속 내 눈을 보았다.',
      alternativeSolutionIds: ['nun-snow'],
    })
  })

  it('rejects a solution from another challenge and does not expose its sentence', () => {
    const target = challenge('repair-nun')
    const result = evaluateRepairSelection(target, 'bae-boat')

    expect(result).toEqual({
      isCorrect: false,
      message: '이 문장에 맞는 정비 블록을 골라 보세요.',
      alternativeSolutionIds: ['nun-snow', 'nun-eye'],
    })
  })
})

describe('evaluation purity', () => {
  it('does not mutate deeply frozen inputs across all four evaluators', () => {
    const deepFreeze = <T>(value: T): T => {
      if (value !== null && typeof value === 'object') {
        for (const child of Object.values(value)) deepFreeze(child)
        Object.freeze(value)
      }
      return value
    }
    const frozenScene = deepFreeze(structuredClone(scene('nun-snow-01')))
    const frozenUnclearScene = deepFreeze(structuredClone(scene('bam-uncertain-03')))
    const frozenNecessity = deepFreeze(structuredClone(necessity('necessity-bae')))
    const frozenChallenge = deepFreeze(structuredClone(challenge('repair-nun')))
    const clueDecision: ClueDecision = deepFreeze({
      kind: 'tokens',
      tokenIds: [frozenScene.decisiveCueTokenIds[0]],
    })
    const before = [
      JSON.stringify(frozenScene),
      JSON.stringify(frozenUnclearScene),
      JSON.stringify(frozenNecessity),
      JSON.stringify(frozenChallenge),
      JSON.stringify(clueDecision),
    ]

    expect(evaluateClueDecision(frozenScene, clueDecision).isCorrect).toBe(true)
    expect(evaluateMeaningDecision(frozenUnclearScene, 'insufficient-context').isCorrect).toBe(true)
    expect(evaluateCueNecessity(frozenNecessity, 'now-unclear').isCorrect).toBe(true)
    expect(evaluateRepairSelection(frozenChallenge, 'nun-snow').isCorrect).toBe(true)

    expect([
      JSON.stringify(frozenScene),
      JSON.stringify(frozenUnclearScene),
      JSON.stringify(frozenNecessity),
      JSON.stringify(frozenChallenge),
      JSON.stringify(clueDecision),
    ]).toEqual(before)
  })
})
