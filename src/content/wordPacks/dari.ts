import type { WordPack } from '../../domain/contentTypes'

export const dari = {
  id: 'dari', lemma: '다리',
  meanings: [
    { id: 'dari:leg', childFriendlyLabel: '몸의 다리', childFriendlyDescription: '사람이나 동물이 서고 걷는 데 쓰는 몸의 부분', contrastExample: '오래 걸어서 다리가 아픕니다.' },
    { id: 'dari:bridge', childFriendlyLabel: '건너는 다리', childFriendlyDescription: '강이나 길 위를 건너도록 이어 놓은 길', contrastExample: '강 위의 다리를 건넙니다.' },
  ],
  scenes: [
    {
      id: 'dari-leg-01', wordId: 'dari', order: 1,
      sentences: [{ id: 'dari-leg-01:s1', plainText: '오래 달렸더니 두 다리가 아팠습니다.', tokens: [
        { id: 'dari-leg-01:t1', text: '오래', role: 'neutral' }, { id: 'dari-leg-01:t2', text: '달렸더니', role: 'supportive' }, { id: 'dari-leg-01:t3', text: '두', role: 'supportive' }, { id: 'dari-leg-01:t4', text: '다리가', role: 'target', targetSurface: '다리' }, { id: 'dari-leg-01:t5', text: '아팠습니다.', role: 'decisive' },
      ] }], candidateMeaningIds: ['dari:leg', 'dari:bridge'], expectedDecision: 'dari:leg', decisiveCueTokenIds: ['dari-leg-01:t5'], supportiveCueTokenIds: ['dari-leg-01:t2', 'dari-leg-01:t3'],
      wrongChoiceFeedback: { 'dari:leg': '‘아팠습니다’와 ‘두’라는 단서가 몸의 다리를 가리켜요.', 'dari:bridge': '강을 건너는 다리가 아니라 ‘달렸더니 두 다리가 아픈’ 몸의 상태인지 비교해 보아요.', 'insufficient-context': '‘달렸더니’와 ‘아팠습니다’가 남아 있어 몸의 다리인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/dari-leg-01.mp3', illustrationId: 'crossroads-dari',
    },
    {
      id: 'dari-bridge-02', wordId: 'dari', order: 2,
      sentences: [{ id: 'dari-bridge-02:s1', plainText: '우리는 강 위의 다리를 건너 학교로 갔습니다.', tokens: [
        { id: 'dari-bridge-02:t1', text: '우리는', role: 'neutral' }, { id: 'dari-bridge-02:t2', text: '강', role: 'supportive' }, { id: 'dari-bridge-02:t3', text: '위의', role: 'supportive' }, { id: 'dari-bridge-02:t4', text: '다리를', role: 'target', targetSurface: '다리' }, { id: 'dari-bridge-02:t5', text: '건너', role: 'decisive' }, { id: 'dari-bridge-02:t6', text: '학교로', role: 'neutral' }, { id: 'dari-bridge-02:t7', text: '갔습니다.', role: 'neutral' },
      ] }], candidateMeaningIds: ['dari:bridge', 'dari:leg'], expectedDecision: 'dari:bridge', decisiveCueTokenIds: ['dari-bridge-02:t5'], supportiveCueTokenIds: ['dari-bridge-02:t2', 'dari-bridge-02:t3'],
      wrongChoiceFeedback: { 'dari:bridge': '‘건너’와 ‘강 위의’라는 단서가 건너는 다리를 가리켜요.', 'dari:leg': '걷다가 아픈 몸의 부분이 아니라 ‘강 위의 다리를 건너’는 장면인지 비교해 보아요.', 'insufficient-context': '‘건너’와 ‘강 위의’가 남아 있어 건너는 다리인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/dari-bridge-02.mp3', illustrationId: 'crossroads-dari',
    },
    {
      id: 'dari-uncertain-03', wordId: 'dari', order: 3,
      sentences: [{ id: 'dari-uncertain-03:s1', plainText: '우리는 다리를 자세히 살펴보았습니다.', tokens: [
        { id: 'dari-uncertain-03:t1', text: '우리는', role: 'neutral' }, { id: 'dari-uncertain-03:t2', text: '다리를', role: 'target', targetSurface: '다리' }, { id: 'dari-uncertain-03:t3', text: '자세히', role: 'neutral' }, { id: 'dari-uncertain-03:t4', text: '살펴보았습니다.', role: 'supportive' },
      ] }], candidateMeaningIds: ['dari:leg', 'dari:bridge'], expectedDecision: 'insufficient-context', decisiveCueTokenIds: [], supportiveCueTokenIds: ['dari-uncertain-03:t4'],
      wrongChoiceFeedback: { 'dari:leg': '‘살펴보았습니다’만으로는 몸의 부분인지 건너는 다리인지 결정되지 않아요.', 'dari:bridge': '강이나 걷는 행동 같은 단서가 없어 건너는 다리라고 정할 수 없어요.', 'insufficient-context': '몸의 부분인지 건너는 다리인지 알려 주는 단서가 없어서 ‘다리’의 뜻을 정하기 어려워요.' }, audioSrc: '/audio/scenes/dari-uncertain-03.mp3', illustrationId: 'crossroads-dari',
    },
  ],
  necessityChallenge: { id: 'necessity-dari', wordId: 'dari', originalSentence: '강 위의 다리를 건넜습니다.', hiddenTokenText: '강 위의', sentenceAfterHide: '______ 다리를 건넜습니다.', expectedClarity: 'still-clear', explanation: '‘건넜습니다’가 남아 건너는 다리라는 뜻을 알 수 있어요.' },
  repair: { id: 'repair-dari', wordId: 'dari', ambiguousSentence: '우리는 다리를 살펴보았다.', solutions: [
    { id: 'dari-bridge', meaningId: 'dari:bridge', blockLabel: '건너는 다리', completedSentence: '우리는 강 위에 놓인 다리를 살펴보았다.', reviewNote: '강 위에 놓인 다리임을 덧붙였어요.' },
    { id: 'dari-leg', meaningId: 'dari:leg', blockLabel: '몸의 부분', completedSentence: '우리는 달리고 나서 아픈 다리를 살펴보았다.', reviewNote: '달리고 나서 아픈 몸의 부분임을 덧붙였어요.' },
  ] },
} as const satisfies WordPack
