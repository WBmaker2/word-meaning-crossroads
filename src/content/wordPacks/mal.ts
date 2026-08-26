import type { WordPack } from '../../domain/contentTypes'

export const mal = {
  id: 'mal', lemma: '말',
  meanings: [
    { id: 'mal:horse', childFriendlyLabel: '달리는 동물', childFriendlyDescription: '사람을 태우거나 짐을 나르며 네 다리로 달리는 동물', contrastExample: '말이 들판을 달립니다.' },
    { id: 'mal:speech', childFriendlyLabel: '주고받는 말', childFriendlyDescription: '사람이 생각이나 느낌을 소리나 글로 나타낸 것', contrastExample: '친구의 말을 귀 기울여 듣습니다.' },
  ],
  scenes: [
    {
      id: 'mal-horse-01', wordId: 'mal', order: 1,
      sentences: [{ id: 'mal-horse-01:s1', plainText: '목장의 말이 네 다리로 들판을 달렸습니다.', tokens: [
        { id: 'mal-horse-01:t1', text: '목장의', role: 'supportive' }, { id: 'mal-horse-01:t2', text: '말이', role: 'target', targetSurface: '말' }, { id: 'mal-horse-01:t3', text: '네', role: 'supportive' }, { id: 'mal-horse-01:t4', text: '다리로', role: 'supportive' }, { id: 'mal-horse-01:t5', text: '들판을', role: 'neutral' }, { id: 'mal-horse-01:t6', text: '달렸습니다.', role: 'decisive' },
      ] }], candidateMeaningIds: ['mal:horse', 'mal:speech'], expectedDecision: 'mal:horse', decisiveCueTokenIds: ['mal-horse-01:t6'], supportiveCueTokenIds: ['mal-horse-01:t1', 'mal-horse-01:t3', 'mal-horse-01:t4'],
      wrongChoiceFeedback: { 'mal:horse': '‘달렸습니다’와 ‘네 다리로’라는 단서가 달리는 동물인 말을 가리켜요.', 'mal:speech': '듣거나 건넨 말이 아니라 ‘목장’에서 네 다리로 달린 장면인지 비교해 보아요.', 'insufficient-context': '‘달렸습니다’와 ‘목장의’가 남아 있어 달리는 동물인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/mal-horse-01.mp3', illustrationId: 'crossroads-mal',
    },
    {
      id: 'mal-speech-02', wordId: 'mal', order: 2,
      sentences: [{ id: 'mal-speech-02:s1', plainText: '친구의 따뜻한 말을 듣고 기분이 좋아졌습니다.', tokens: [
        { id: 'mal-speech-02:t1', text: '친구의', role: 'supportive' }, { id: 'mal-speech-02:t2', text: '따뜻한', role: 'supportive' }, { id: 'mal-speech-02:t3', text: '말을', role: 'target', targetSurface: '말' }, { id: 'mal-speech-02:t4', text: '듣고', role: 'decisive' }, { id: 'mal-speech-02:t5', text: '기분이', role: 'neutral' }, { id: 'mal-speech-02:t6', text: '좋아졌습니다.', role: 'neutral' },
      ] }], candidateMeaningIds: ['mal:speech', 'mal:horse'], expectedDecision: 'mal:speech', decisiveCueTokenIds: ['mal-speech-02:t4'], supportiveCueTokenIds: ['mal-speech-02:t1', 'mal-speech-02:t2'],
      wrongChoiceFeedback: { 'mal:speech': '‘듣고’와 ‘친구의 따뜻한’이라는 단서가 주고받는 말을 가리켜요.', 'mal:horse': '달리는 동물의 움직임이 아니라 ‘친구의 말을 듣고’ 기분이 좋아진 장면인지 비교해 보아요.', 'insufficient-context': '‘친구의 말을 듣고’가 남아 있어 주고받는 말인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/mal-speech-02.mp3', illustrationId: 'crossroads-mal',
    },
    {
      id: 'mal-uncertain-03', wordId: 'mal', order: 3,
      sentences: [{ id: 'mal-uncertain-03:s1', plainText: '지우는 그 말을 좋아합니다.', tokens: [
        { id: 'mal-uncertain-03:t1', text: '지우는', role: 'neutral' }, { id: 'mal-uncertain-03:t2', text: '그', role: 'neutral' }, { id: 'mal-uncertain-03:t3', text: '말을', role: 'target', targetSurface: '말' }, { id: 'mal-uncertain-03:t4', text: '좋아합니다.', role: 'supportive' },
      ] }], candidateMeaningIds: ['mal:horse', 'mal:speech'], expectedDecision: 'insufficient-context', decisiveCueTokenIds: [], supportiveCueTokenIds: ['mal-uncertain-03:t4'],
      wrongChoiceFeedback: { 'mal:horse': '‘좋아합니다’만으로는 달리는 동물인지 주고받는 말인지 결정되지 않아요.', 'mal:speech': '듣거나 말한 상황이 없어 주고받는 말이라고 정할 수 없어요.', 'insufficient-context': '동물의 움직임이나 대화 단서가 없어서 ‘말’의 뜻을 정하기 어려워요.' }, audioSrc: '/audio/scenes/mal-uncertain-03.mp3', illustrationId: 'crossroads-mal',
    },
  ],
  necessityChallenge: { id: 'necessity-mal', wordId: 'mal', originalSentence: '친구의 말을 듣고 웃었습니다.', hiddenTokenText: '듣고', sentenceAfterHide: '친구의 말을 ______ 웃었습니다.', expectedClarity: 'now-unclear', explanation: '`듣고`가 없으면 주고받은 말을 가리키는지 친구의 동물을 가리키는지 확실하지 않아요.' },
  repair: { id: 'repair-mal', wordId: 'mal', ambiguousSentence: '지우는 말을 좋아한다.', solutions: [
    { id: 'mal-horse', meaningId: 'mal:horse', blockLabel: '동물 단서', completedSentence: '지우는 목장에서 달리는 말을 좋아한다.', reviewNote: '목장과 달리는 모습을 덧붙였어요.' },
    { id: 'mal-speech', meaningId: 'mal:speech', blockLabel: '대화 단서', completedSentence: '지우는 친구가 다정하게 건넨 말을 좋아한다.', reviewNote: '친구의 말과 느낌을 덧붙였어요.' },
  ] },
} as const satisfies WordPack
