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
    expect(feedback).toBe('이 문장에서는 눈이 내려 운동장을 하얗게 만들었어요. ‘보는 눈’이 아니라 ‘내리는 눈’이에요. 주변 단서를 비교해 보세요.')
    expect(feedback).toMatch(/눈이 내려 운동장을 하얗게 만들었어요\./)
  })

  it('uses precise child-facing contrasts and natural quoted conjunctions', () => {
    const strings = WORD_PACKS.flatMap(studentFacingStrings)
    expect(strings.some((value) => value.includes('몸인지 다리인지'))).toBe(false)
    expect(strings.some((value) => value.includes('‘머리를’과'))).toBe(false)
    expect(strings.some((value) => value.includes('‘모자를’과'))).toBe(false)
    expect(strings.some((value) => value.includes('몸인지 시설인지'))).toBe(false)

    const dari = WORD_PACKS.find((pack) => pack.id === 'dari')
    expect(dari?.scenes[2]?.wrongChoiceFeedback['dari:leg']).toContain('몸의 부분인지 건너는 다리인지')
    expect(dari?.scenes[2]?.wrongChoiceFeedback['insufficient-context']).toContain('몸의 부분인지')
  })

  it('uses natural quoted particles in insufficient-context feedback and explanations', () => {
    const chada = WORD_PACKS.find((pack) => pack.id === 'chada')
    const nun = WORD_PACKS.find((pack) => pack.id === 'nun')
    const sseuda = WORD_PACKS.find((pack) => pack.id === 'sseuda')

    expect(chada?.scenes[1]?.wrongChoiceFeedback['insufficient-context'])
      .toBe('‘손목에’와 ‘시계를’이라는 말이 남아 있어 몸에 차기인지 살펴볼 수 있어요.')
    expect(nun?.scenes[1]?.wrongChoiceFeedback['insufficient-context'])
      .toBe('‘보았습니다’와 ‘칠판의 글씨를’이라는 말이 남아 있어 보는 눈인지 살펴볼 수 있어요.')
    expect(nun?.necessityChallenge.explanation)
      .toBe('‘눈으로’와 ‘칠판 글씨를’이라는 말이 남아 보는 눈이라는 뜻을 알 수 있어요.')
    expect(sseuda?.necessityChallenge.explanation)
      .toBe('‘일기를’이라는 말이 남아 글을 적은 뜻임을 알 수 있어요.')
  })

  it('keeps repair review notes in one polite ending style', () => {
    const notes = WORD_PACKS.flatMap((pack) => pack.repair.solutions.map((solution) => solution.reviewNote))
    expect(notes.every((note) => note.endsWith('어요.'))).toBe(true)
  })
})
