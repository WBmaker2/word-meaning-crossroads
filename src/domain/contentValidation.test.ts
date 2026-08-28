import { describe, expect, it } from 'vitest'
import { ROUTES } from '../content/routes'
import { WORD_PACKS } from '../content/wordPacks'
import { validateWordPacks } from './contentValidation'

const scenes = WORD_PACKS.flatMap((pack) => pack.scenes)

describe('reviewed word content contract', () => {
  it('has eight packs in order and 24 unique scenes', () => {
    expect(WORD_PACKS).toHaveLength(8)
    expect(WORD_PACKS.map((pack) => pack.id)).toEqual(['nun', 'bae', 'bam', 'mal', 'chada', 'dari', 'sseuda', 'gamda'])
    expect(new Set(scenes.map((scene) => scene.id)).size).toBe(24)
    expect(scenes).toHaveLength(24)
  })

  it('has three one-sentence scenes with shared illustration paths and no audio metadata', () => {
    WORD_PACKS.forEach((pack) => pack.scenes.forEach((scene) => {
      expect(scene.sentences).toHaveLength(1)
      expect('audioSrc' in scene).toBe(false)
      expect(scene.illustrationId).toBe(`crossroads-${pack.id}`)
      expect(scene.candidateMeaningIds).toHaveLength(2)
      expect(scene.candidateMeaningIds[0]).not.toBe(scene.candidateMeaningIds[1])
    }))
  })

  it('validates the aggregate content', () => {
    expect(() => validateWordPacks(WORD_PACKS, ROUTES)).not.toThrow()
  })

  it('keeps token ids global, plain text exact, and cue references typed', () => {
    const ids = scenes.flatMap((scene) => scene.sentences.flatMap((sentence) => sentence.tokens.map((token) => token.id)))
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^.+-\d\d:t[1-9]\d*$/))
    scenes.forEach((scene) => {
      const sentence = scene.sentences[0]
      expect(sentence.plainText).toBe(sentence.tokens.map((token) => token.text).join(' '))
      const targets = sentence.tokens.filter((token) => token.role === 'target')
      expect(targets).toHaveLength(1)
      expect(targets[0].targetSurface).toBeTruthy()
      expect(sentence.tokens.filter((token) => token.targetSurface && token.role !== 'target')).toHaveLength(0)
      const cues = [...scene.decisiveCueTokenIds, ...scene.supportiveCueTokenIds]
      cues.forEach((id) => expect(sentence.tokens.some((token) => token.id === id)).toBe(true))
      expect(new Set(cues).size).toBe(cues.length)
    })
  })

  it('has complete scene decisions and feedback', () => {
    scenes.forEach((scene) => {
      expect([...scene.candidateMeaningIds, 'insufficient-context']).toEqual(expect.arrayContaining(Object.keys(scene.wrongChoiceFeedback)))
      expect(Object.keys(scene.wrongChoiceFeedback)).toHaveLength(3)
      if (scene.expectedDecision === 'insufficient-context') expect(scene.decisiveCueTokenIds).toHaveLength(0)
      else expect(scene.decisiveCueTokenIds.length).toBeGreaterThan(0)
    })
  })

  it('has eight necessity challenges with both clarity outcomes', () => {
    expect(new Set(WORD_PACKS.map((pack) => pack.necessityChallenge.id)).size).toBe(8)
    expect(new Set(WORD_PACKS.map((pack) => pack.necessityChallenge.expectedClarity)).size).toBe(2)
    WORD_PACKS.forEach(({ necessityChallenge: challenge }) => {
      expect(challenge.sentenceAfterHide.split('______')).toHaveLength(2)
      expect(challenge.originalSentence).toContain(challenge.hiddenTokenText)
      expect(challenge.sentenceAfterHide).toContain('______')
    })
  })

  it('has unique repairs with multiple meanings and preserved subjects', () => {
    const challenges = WORD_PACKS.map((pack) => pack.repair)
    const solutionIds = challenges.flatMap((challenge) => challenge.solutions.map((solution) => solution.id))
    expect(new Set(solutionIds).size).toBe(solutionIds.length)
    challenges.forEach((challenge) => {
      expect(challenge.solutions.length).toBeGreaterThanOrEqual(2)
      expect(new Set(challenge.solutions.map((solution) => solution.meaningId)).size).toBeGreaterThanOrEqual(2)
      challenge.solutions.forEach((solution) => {
        expect(solution.completedSentence).toBeTruthy()
        expect(solution.blockLabel).toBeTruthy()
        expect(solution.reviewNote).toBeTruthy()
        expect(solution.completedSentence.split(' ')[0]).toBe(challenge.ambiguousSentence.split(' ')[0])
      })
    })
  })

  it('defines routes as core 4, extension 4, all 8 without duplication', () => {
    expect(ROUTES.map((route) => route.id)).toEqual(['core', 'extension', 'all'])
    expect(ROUTES[0].wordIds).toEqual(['nun', 'bae', 'bam', 'mal'])
    expect(ROUTES[1].wordIds).toEqual(['chada', 'dari', 'sseuda', 'gamda'])
    expect(ROUTES[2].wordIds).toEqual([...ROUTES[0].wordIds, ...ROUTES[1].wordIds])
    ROUTES.forEach((route) => expect(new Set(route.wordIds).size).toBe(route.wordIds.length))
  })

  it('requires approved phrase cues and scene-specific feedback', () => {
    const phraseExpectations: Record<string, string[]> = {
      'bam-night-01': ['해가 지고', '가로등이'],
      'mal-horse-01': ['목장의', '네 다리로'],
      'sseuda-write-01': ['연필로', '오늘 일을'],
      'sseuda-bitter-03': ['약을', '먹어 보니'],
      'gamda-close-01': ['잠들기 전에', '천천히'],
      'gamda-wind-02': ['선물 상자에', '여러 번'],
    }
    scenes.forEach((scene) => {
      const sentence = scene.sentences[0]
      const feedback = Object.values(scene.wrongChoiceFeedback).join(' ')
      expect(new Set(Object.values(scene.wrongChoiceFeedback)).size).toBeGreaterThan(1)
      expect(sentence.tokens.some((token) => token.role === 'decisive' || token.role === 'supportive' ? feedback.includes(token.text.replace(/[.,!?]$/u, '')) : false)).toBe(true)
      for (const phrase of phraseExpectations[scene.id] ?? []) {
        for (const word of phrase.split(' ')) {
          const token = sentence.tokens.find((candidate) => candidate.text.replace(/[.,!?]$/u, '') === word)
          expect(token?.role, `${scene.id} phrase ${phrase} word ${word}`).toBe('supportive')
          expect(scene.supportiveCueTokenIds).toContain(token?.id)
        }
      }
    })
  })

  it('rejects each malformed content branch with its exact invariant', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutate = (change: (copy: any[]) => void, pattern: RegExp) => {
      // Mutations intentionally model malformed untyped data at the validator boundary.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const copy = structuredClone(WORD_PACKS) as any[]
      change(copy)
      expect(() => validateWordPacks(copy, ROUTES)).toThrow(pattern)
    }
    mutate((copy) => { copy[0].scenes[0].illustrationId = 'crossroads-bae' }, /nun-snow-01.*illustration path/)
    mutate((copy) => { copy[0].scenes[0].sentences[0].tokens[0].id = 'foreign:t1' }, /nun-snow-01.*exact TokenId/)
    mutate((copy) => { copy[0].scenes[0].wrongChoiceFeedback.extra = 'extra' }, /nun-snow-01.*exact feedback keys/)
    mutate((copy) => { copy[0].repair.solutions[0].meaningId = 'bae:boat' }, /nun-snow.*repair meaning belongs to pack/)
    mutate((copy) => { copy[0].repair.solutions[0].completedSentence = '다른 아이는 눈을 보았다.' }, /nun-snow.*repair subject/)
    mutate((copy) => { copy[0].scenes[0].candidateMeaningIds.push('nun:snow') }, /nun-snow-01.*exactly two candidates/)
    mutate((copy) => { copy[0].scenes[0].candidateMeaningIds[1] = copy[0].scenes[0].candidateMeaningIds[0] }, /nun-snow-01.*duplicate candidates/)
    mutate((copy) => { copy[0].necessityChallenge.sentenceAfterHide = '전혀 다른 문장 ______.' }, /necessity-nun.*necessity reconstruction/)
    mutate((copy) => { copy[0].repair.solutions[0].completedSentence = '나는 창밖에 내리는 배를 보았다.' }, /nun-snow.*repair target surface/)
  })

  it('enforces exact sentence and cue references, clarity values, repair meanings, and routes', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutate = (change: (copy: any[], routes: any[]) => void, pattern: RegExp) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const copy = structuredClone(WORD_PACKS) as any[]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const routes = structuredClone(ROUTES) as any[]
      change(copy, routes)
      expect(() => validateWordPacks(copy, routes)).toThrow(pattern)
    }
    mutate((copy) => { copy[0].scenes[0].sentences[0].id = 'nun-snow-01:s2' }, /nun-snow-01.*sentence id/)
    mutate((copy) => { copy[0].scenes[0].decisiveCueTokenIds = ['nun-snow-01:t999'] }, /nun-snow-01.*cue reference .*not a sentence token/)
    mutate((copy) => { copy[0].scenes[0].decisiveCueTokenIds = ['nun-snow-01:t1'] }, /nun-snow-01.*cue reference must have decisive/)
    mutate((copy) => { copy[0].necessityChallenge.expectedClarity = 'maybe' }, /necessity-nun.*clarity/)
    mutate((copy) => { copy[0].repair.solutions[1].meaningId = copy[0].repair.solutions[0].meaningId }, /repair-nun.*distinct/)
    mutate((copy) => { copy[0].repair.solutions[0].completedSentence = '나는X 창밖에 내리는 눈을 보았다.' }, /nun-snow.*repair subject/)
    mutate((copy, routes) => { routes[0].wordIds = ['bae', 'nun', 'bam', 'mal'] }, /core.*route order/)
  })
})
