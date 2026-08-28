import { describe, expect, it } from 'vitest'
import { WORD_PACKS } from './wordPacks'

const studentFacingStrings = (pack: (typeof WORD_PACKS)[number]): string[] => [
  ...pack.meanings.flatMap((meaning) => [meaning.childFriendlyLabel, meaning.childFriendlyDescription, meaning.contrastExample]),
  ...pack.scenes.flatMap((scene) => [
    ...scene.sentences.flatMap((sentence) => [sentence.plainText, ...sentence.tokens.map((token) => token.text)]),
    ...Object.values(scene.wrongChoiceFeedback),
  ]),
  pack.necessityChallenge.originalSentence,
  pack.necessityChallenge.sentenceAfterHide,
  pack.necessityChallenge.explanation,
  pack.repair.ambiguousSentence,
  ...pack.repair.solutions.flatMap((solution) => [solution.blockLabel, solution.completedSentence, solution.reviewNote]),
]

describe('learner-facing content copy', () => {
  it('keeps all eight word packs free of developer notation and malformed phrases', () => {
    const strings = WORD_PACKS.flatMap(studentFacingStrings)
    expect(WORD_PACKS).toHaveLength(8)
    expect(strings.some((value) => value.includes('`'))).toBe(false)
    expect(strings.some((value) => value.includes('두피'))).toBe(false)
    expect(strings.some((value) => value.includes('시계를’과'))).toBe(false)
    expect(strings.some((value) => value.includes('달리다 아픈'))).toBe(false)
  })

  it('uses complete child-facing feedback for the nun snow choice', () => {
    const nun = WORD_PACKS.find((pack) => pack.id === 'nun')
    const feedback = nun?.scenes[0]?.wrongChoiceFeedback['nun:eye']
    expect(feedback).toBe('이 문장에서는 눈이 내려 운동장을 하얗게 만들었어요. ‘보는 눈’이 아니라 ‘내리는 눈’이에요.')
    expect(feedback).toMatch(/눈이 내려 운동장을 하얗게 만들었어요\./)
  })

  it('keeps repair review notes in one polite ending style', () => {
    const notes = WORD_PACKS.flatMap((pack) => pack.repair.solutions.map((solution) => solution.reviewNote))
    expect(notes.every((note) => note.endsWith('어요.'))).toBe(true)
  })
})
