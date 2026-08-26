import type { WordPack } from '../../domain/contentTypes'

export const gamda = {
  id: 'gamda', lemma: '감다',
  meanings: [
    { id: 'gamda:close', childFriendlyLabel: '눈을 감기', childFriendlyDescription: '눈꺼풀을 내려 눈을 덮는 행동', contrastExample: '잠들기 전에 눈을 감습니다.' },
    { id: 'gamda:wind', childFriendlyLabel: '둘러 감기', childFriendlyDescription: '끈이나 천을 물체 둘레에 돌려 두르는 행동', contrastExample: '상자에 리본을 감습니다.' },
    { id: 'gamda:wash', childFriendlyLabel: '머리를 감기', childFriendlyDescription: '물로 머리카락과 두피를 씻는 행동', contrastExample: '따뜻한 물로 머리를 감습니다.' },
  ],
  scenes: [
    {
      id: 'gamda-close-01', wordId: 'gamda', order: 1,
      sentences: [{ id: 'gamda-close-01:s1', plainText: '잠들기 전에 두 눈을 천천히 감았습니다.', tokens: [
        { id: 'gamda-close-01:t1', text: '잠들기', role: 'supportive' }, { id: 'gamda-close-01:t2', text: '전에', role: 'supportive' }, { id: 'gamda-close-01:t3', text: '두', role: 'neutral' }, { id: 'gamda-close-01:t4', text: '눈을', role: 'decisive' }, { id: 'gamda-close-01:t5', text: '천천히', role: 'supportive' }, { id: 'gamda-close-01:t6', text: '감았습니다.', role: 'target', targetSurface: '감았습니다' },
      ] }], candidateMeaningIds: ['gamda:close', 'gamda:wind'], expectedDecision: 'gamda:close', decisiveCueTokenIds: ['gamda-close-01:t4'], supportiveCueTokenIds: ['gamda-close-01:t1', 'gamda-close-01:t2', 'gamda-close-01:t5'],
      wrongChoiceFeedback: { 'gamda:close': '‘눈을’과 ‘잠들기 전에’라는 단서가 눈을 감는 행동을 가리켜요.', 'gamda:wind': '상자 둘레에 끈을 두른 장면이 아니라 ‘잠들기 전에 눈을’ 닫은 행동인지 비교해 보아요.', 'insufficient-context': '‘눈을’과 ‘잠들기 전에’가 남아 있어 눈을 감기인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/gamda-close-01.mp3', illustrationId: 'crossroads-gamda',
    },
    {
      id: 'gamda-wind-02', wordId: 'gamda', order: 2,
      sentences: [{ id: 'gamda-wind-02:s1', plainText: '선물 상자에 리본을 여러 번 감았습니다.', tokens: [
        { id: 'gamda-wind-02:t1', text: '선물', role: 'supportive' }, { id: 'gamda-wind-02:t2', text: '상자에', role: 'supportive' }, { id: 'gamda-wind-02:t3', text: '리본을', role: 'decisive' }, { id: 'gamda-wind-02:t4', text: '여러', role: 'supportive' }, { id: 'gamda-wind-02:t5', text: '번', role: 'supportive' }, { id: 'gamda-wind-02:t6', text: '감았습니다.', role: 'target', targetSurface: '감았습니다' },
      ] }], candidateMeaningIds: ['gamda:wind', 'gamda:wash'], expectedDecision: 'gamda:wind', decisiveCueTokenIds: ['gamda-wind-02:t3'], supportiveCueTokenIds: ['gamda-wind-02:t1', 'gamda-wind-02:t2', 'gamda-wind-02:t4', 'gamda-wind-02:t5'],
      wrongChoiceFeedback: { 'gamda:wind': '‘리본을’과 ‘선물 상자에’라는 단서가 둘러 감는 행동을 가리켜요.', 'gamda:wash': '물로 머리를 씻은 장면이 아니라 ‘상자에 리본을 여러 번’ 두른 행동인지 비교해 보아요.', 'insufficient-context': '‘리본을’과 ‘선물 상자에’가 남아 있어 둘러 감기인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/gamda-wind-02.mp3', illustrationId: 'crossroads-gamda',
    },
    {
      id: 'gamda-wash-03', wordId: 'gamda', order: 3,
      sentences: [{ id: 'gamda-wash-03:s1', plainText: '샤워하면서 따뜻한 물로 머리를 감았습니다.', tokens: [
        { id: 'gamda-wash-03:t1', text: '샤워하면서', role: 'supportive' }, { id: 'gamda-wash-03:t2', text: '따뜻한', role: 'neutral' }, { id: 'gamda-wash-03:t3', text: '물로', role: 'supportive' }, { id: 'gamda-wash-03:t4', text: '머리를', role: 'decisive' }, { id: 'gamda-wash-03:t5', text: '감았습니다.', role: 'target', targetSurface: '감았습니다' },
      ] }], candidateMeaningIds: ['gamda:wash', 'gamda:close'], expectedDecision: 'gamda:wash', decisiveCueTokenIds: ['gamda-wash-03:t4'], supportiveCueTokenIds: ['gamda-wash-03:t1', 'gamda-wash-03:t3'],
      wrongChoiceFeedback: { 'gamda:wash': '‘머리를’과 ‘물로’라는 단서가 머리를 씻는 행동을 가리켜요.', 'gamda:close': '눈꺼풀을 내린 장면이 아니라 ‘물로 머리를’ 씻은 행동인지 비교해 보아요.', 'insufficient-context': '‘머리를’과 ‘물로’가 남아 있어 머리를 감기인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/gamda-wash-03.mp3', illustrationId: 'crossroads-gamda',
    },
  ],
  necessityChallenge: { id: 'necessity-gamda', wordId: 'gamda', originalSentence: '선물 상자에 리본을 감았습니다.', hiddenTokenText: '리본을', sentenceAfterHide: '선물 상자에 ______ 감았습니다.', expectedClarity: 'still-clear', explanation: '`선물 상자에`가 남아 무엇인가를 둘러싼 뜻임을 알 수 있어요.' },
  repair: { id: 'repair-gamda', wordId: 'gamda', ambiguousSentence: '하늘이가 감았다.', solutions: [
    { id: 'gamda-close', meaningId: 'gamda:close', blockLabel: '눈을 감기', completedSentence: '하늘이가 잠들기 전에 두 눈을 감았다.', reviewNote: '잠들기 전 눈의 행동을 덧붙였어요.' },
    { id: 'gamda-wind', meaningId: 'gamda:wind', blockLabel: '리본을 감기', completedSentence: '하늘이가 상자에 리본을 여러 번 감았다.', reviewNote: '상자와 리본을 덧붙였어요.' },
    { id: 'gamda-wash', meaningId: 'gamda:wash', blockLabel: '머리를 감기', completedSentence: '하늘이가 따뜻한 물로 머리를 감았다.', reviewNote: '물과 머리를 씻는 행동을 덧붙였어요.' },
  ] },
} as const satisfies WordPack
