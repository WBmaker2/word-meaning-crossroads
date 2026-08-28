import type { WordPack } from '../../domain/contentTypes'

export const nun = {
  id: 'nun',
  lemma: '눈',
  meanings: [
    { id: 'nun:snow', childFriendlyLabel: '내리는 눈', childFriendlyDescription: '하늘에서 내려오는 하얀 얼음 알갱이', contrastExample: '눈이 내려 길이 하얗습니다.' },
    { id: 'nun:eye', childFriendlyLabel: '보는 눈', childFriendlyDescription: '사람이나 동물이 보는 데 쓰는 몸의 부분', contrastExample: '눈으로 책의 글자를 읽습니다.' },
  ],
  scenes: [
    {
      id: 'nun-snow-01', wordId: 'nun', order: 1,
      sentences: [{ id: 'nun-snow-01:s1', plainText: '아침부터 흰 눈이 내려 운동장이 하얗게 변했습니다.', tokens: [
        { id: 'nun-snow-01:t1', text: '아침부터', role: 'neutral' }, { id: 'nun-snow-01:t2', text: '흰', role: 'supportive' }, { id: 'nun-snow-01:t3', text: '눈이', role: 'target', targetSurface: '눈' }, { id: 'nun-snow-01:t4', text: '내려', role: 'decisive' }, { id: 'nun-snow-01:t5', text: '운동장이', role: 'neutral' }, { id: 'nun-snow-01:t6', text: '하얗게', role: 'supportive' }, { id: 'nun-snow-01:t7', text: '변했습니다.', role: 'neutral' },
      ] }],
      candidateMeaningIds: ['nun:snow', 'nun:eye'], expectedDecision: 'nun:snow', decisiveCueTokenIds: ['nun-snow-01:t4'], supportiveCueTokenIds: ['nun-snow-01:t2', 'nun-snow-01:t6'],
      wrongChoiceFeedback: { 'nun:snow': '‘내려’와 ‘하얗게’라는 단서가 하늘에서 내리는 눈을 가리켜요.', 'nun:eye': '이 문장에서는 눈이 내려 운동장을 하얗게 만들었어요. ‘보는 눈’이 아니라 ‘내리는 눈’이에요. 주변 단서를 비교해 보세요.', 'insufficient-context': '‘내려’와 ‘하얗게’가 남아 있어 내리는 눈인지 살펴볼 수 있어요.' },
      illustrationId: 'crossroads-nun',
    },
    {
      id: 'nun-eye-02', wordId: 'nun', order: 2,
      sentences: [{ id: 'nun-eye-02:s1', plainText: '민서는 눈으로 칠판의 작은 글씨를 보았습니다.', tokens: [
        { id: 'nun-eye-02:t1', text: '민서는', role: 'neutral' }, { id: 'nun-eye-02:t2', text: '눈으로', role: 'target', targetSurface: '눈' }, { id: 'nun-eye-02:t3', text: '칠판의', role: 'supportive' }, { id: 'nun-eye-02:t4', text: '작은', role: 'neutral' }, { id: 'nun-eye-02:t5', text: '글씨를', role: 'supportive' }, { id: 'nun-eye-02:t6', text: '보았습니다.', role: 'decisive' },
      ] }],
      candidateMeaningIds: ['nun:eye', 'nun:snow'], expectedDecision: 'nun:eye', decisiveCueTokenIds: ['nun-eye-02:t6'], supportiveCueTokenIds: ['nun-eye-02:t3', 'nun-eye-02:t5'],
      wrongChoiceFeedback: { 'nun:eye': '‘보았습니다’와 ‘칠판의 글씨를’이라는 단서가 보는 눈을 가리켜요.', 'nun:snow': '눈이 내리거나 길이 하얘진 장면이 아니라 ‘보았습니다’라는 행동인지 비교해 보아요.', 'insufficient-context': '‘보았습니다’와 ‘칠판의 글씨를’이라는 말이 남아 있어 보는 눈인지 살펴볼 수 있어요.' },
      illustrationId: 'crossroads-nun',
    },
    {
      id: 'nun-uncertain-03', wordId: 'nun', order: 3,
      sentences: [{ id: 'nun-uncertain-03:s1', plainText: '나는 한참 동안 눈을 보았습니다.', tokens: [
        { id: 'nun-uncertain-03:t1', text: '나는', role: 'neutral' }, { id: 'nun-uncertain-03:t2', text: '한참', role: 'supportive' }, { id: 'nun-uncertain-03:t3', text: '동안', role: 'neutral' }, { id: 'nun-uncertain-03:t4', text: '눈을', role: 'target', targetSurface: '눈' }, { id: 'nun-uncertain-03:t5', text: '보았습니다.', role: 'supportive' },
      ] }],
      candidateMeaningIds: ['nun:snow', 'nun:eye'], expectedDecision: 'insufficient-context', decisiveCueTokenIds: [], supportiveCueTokenIds: ['nun-uncertain-03:t2', 'nun-uncertain-03:t5'],
      wrongChoiceFeedback: { 'nun:snow': '‘보았습니다’만으로는 내리는 장면인지 보는 몸의 부분인지 결정되지 않아요.', 'nun:eye': '‘한참 동안’과 ‘보았습니다’만으로는 칠판 같은 대상이 없어 보는 눈이라고 정할 수 없어요.', 'insufficient-context': '내리는 장면이나 보는 대상이 없어서 ‘눈’의 뜻을 하나로 정하기 어려워요.' },
      illustrationId: 'crossroads-nun',
    },
  ],
  necessityChallenge: { id: 'necessity-nun', wordId: 'nun', originalSentence: '민서는 눈으로 칠판 글씨를 보았습니다.', hiddenTokenText: '보았습니다', sentenceAfterHide: '민서는 눈으로 칠판 글씨를 ______.', expectedClarity: 'still-clear', explanation: '‘눈으로’와 ‘칠판 글씨를’이라는 말이 남아 보는 눈이라는 뜻을 알 수 있어요.' },
  repair: { id: 'repair-nun', wordId: 'nun', ambiguousSentence: '나는 눈을 보았다.', solutions: [
    { id: 'nun-snow', meaningId: 'nun:snow', blockLabel: '내리는 눈 단서', completedSentence: '나는 창밖에 내리는 눈을 보았다.', reviewNote: '내리는 장소와 모습을 덧붙였어요.' },
    { id: 'nun-eye', meaningId: 'nun:eye', blockLabel: '보는 눈 단서', completedSentence: '나는 거울 속 내 눈을 보았다.', reviewNote: '거울 속 대상을 덧붙였어요.' },
  ] },
} as const satisfies WordPack
