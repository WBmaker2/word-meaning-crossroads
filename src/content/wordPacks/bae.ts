import type { WordPack } from '../../domain/contentTypes'

export const bae = {
  id: 'bae', lemma: '배',
  meanings: [
    { id: 'bae:boat', childFriendlyLabel: '물 위의 배', childFriendlyDescription: '사람이나 물건을 싣고 물 위로 다니는 탈것', contrastExample: '배를 타고 강을 건넙니다.' },
    { id: 'bae:belly', childFriendlyLabel: '몸의 배', childFriendlyDescription: '몸에서 가슴과 엉덩이 사이의 앞쪽 부분', contrastExample: '많이 먹어서 배가 부릅니다.' },
    { id: 'bae:pear', childFriendlyLabel: '먹는 배', childFriendlyDescription: '둥글고 아삭하며 단맛이 나는 과일', contrastExample: '과일 배를 깎아 먹습니다.' },
  ],
  scenes: [
    {
      id: 'bae-boat-01', wordId: 'bae', order: 1,
      sentences: [{ id: 'bae-boat-01:s1', plainText: '우리는 배를 타고 강 건너 마을로 갔습니다.', tokens: [
        { id: 'bae-boat-01:t1', text: '우리는', role: 'neutral' },
        { id: 'bae-boat-01:t2', text: '배를', role: 'target', targetSurface: '배' },
        { id: 'bae-boat-01:t3', text: '타고', role: 'decisive' },
        { id: 'bae-boat-01:t4', text: '강', role: 'supportive' },
        { id: 'bae-boat-01:t5', text: '건너', role: 'supportive' },
        { id: 'bae-boat-01:t6', text: '마을로', role: 'neutral' },
        { id: 'bae-boat-01:t7', text: '갔습니다.', role: 'neutral' },
      ] }],
      candidateMeaningIds: ['bae:boat', 'bae:belly'], expectedDecision: 'bae:boat',
      decisiveCueTokenIds: ['bae-boat-01:t3'], supportiveCueTokenIds: ['bae-boat-01:t4', 'bae-boat-01:t5'],
      wrongChoiceFeedback: {
        'bae:boat': '‘타고’와 ‘강 건너’라는 단서가 물 위의 배를 가리켜요.',
        'bae:belly': '배가 부르거나 먹은 장면이 아니라 ‘타고 강을 건너’는 행동인지 비교해 보아요.',
        'insufficient-context': '‘타고’와 ‘강 건너’가 남아 있어 물 위의 배인지 살펴볼 수 있어요.',
      },
      illustrationId: 'crossroads-bae',
    },
    {
      id: 'bae-belly-02', wordId: 'bae', order: 2,
      sentences: [{ id: 'bae-belly-02:s1', plainText: '점심을 너무 많이 먹어 배가 불렀습니다.', tokens: [
        { id: 'bae-belly-02:t1', text: '점심을', role: 'supportive' },
        { id: 'bae-belly-02:t2', text: '너무', role: 'neutral' }, { id: 'bae-belly-02:t3', text: '많이', role: 'neutral' },
        { id: 'bae-belly-02:t4', text: '먹어', role: 'supportive' }, { id: 'bae-belly-02:t5', text: '배가', role: 'target', targetSurface: '배' },
        { id: 'bae-belly-02:t6', text: '불렀습니다.', role: 'decisive' },
      ] }], candidateMeaningIds: ['bae:belly', 'bae:pear'], expectedDecision: 'bae:belly', decisiveCueTokenIds: ['bae-belly-02:t6'], supportiveCueTokenIds: ['bae-belly-02:t1', 'bae-belly-02:t4'],
      wrongChoiceFeedback: {
        'bae:belly': '‘불렀습니다’와 ‘점심을 먹어’라는 단서가 몸의 배를 가리켜요.',
        'bae:pear': '아삭한 과일을 먹은 장면이 아니라 ‘배가 불렀습니다’라는 몸의 상태인지 비교해 보아요.',
        'insufficient-context': '‘불렀습니다’와 ‘점심을 먹어’가 남아 있어 몸의 배인지 살펴볼 수 있어요.',
      }, illustrationId: 'crossroads-bae',
    },
    {
      id: 'bae-pear-03', wordId: 'bae', order: 3,
      sentences: [{ id: 'bae-pear-03:s1', plainText: '간식으로 아삭하고 달콤한 배를 한 조각 먹었습니다.', tokens: [
        { id: 'bae-pear-03:t1', text: '간식으로', role: 'neutral' }, { id: 'bae-pear-03:t2', text: '아삭하고', role: 'supportive' },
        { id: 'bae-pear-03:t3', text: '달콤한', role: 'supportive' }, { id: 'bae-pear-03:t4', text: '배를', role: 'target', targetSurface: '배' },
        { id: 'bae-pear-03:t5', text: '한', role: 'supportive' }, { id: 'bae-pear-03:t6', text: '조각', role: 'supportive' },
        { id: 'bae-pear-03:t7', text: '먹었습니다.', role: 'decisive' },
      ] }], candidateMeaningIds: ['bae:pear', 'bae:boat'], expectedDecision: 'bae:pear', decisiveCueTokenIds: ['bae-pear-03:t7'], supportiveCueTokenIds: ['bae-pear-03:t2', 'bae-pear-03:t3', 'bae-pear-03:t5', 'bae-pear-03:t6'],
      wrongChoiceFeedback: {
        'bae:pear': '‘먹었습니다’와 ‘아삭하고 달콤한’이라는 단서가 먹는 배를 가리켜요.',
        'bae:boat': '강을 건너는 탈것 장면이 아니라 ‘한 조각 먹었습니다’라는 행동인지 비교해 보아요.',
        'insufficient-context': '‘먹었습니다’와 ‘아삭하고 달콤한’이 남아 있어 과일 배인지 살펴볼 수 있어요.',
      }, illustrationId: 'crossroads-bae',
    },
  ],
  necessityChallenge: { id: 'necessity-bae', wordId: 'bae', originalSentence: '우리는 배를 타고 갔습니다.', hiddenTokenText: '타고', sentenceAfterHide: '우리는 배를 ______ 갔습니다.', expectedClarity: 'now-unclear', explanation: '‘타고’가 없으면 배를 먹고 갔는지 배를 타고 갔는지 정하기 어려워요.' },
  repair: { id: 'repair-bae', wordId: 'bae', ambiguousSentence: '민수가 배를 골랐다.', solutions: [
    { id: 'bae-pear', meaningId: 'bae:pear', blockLabel: '과일 단서', completedSentence: '민수가 과일 바구니에서 먹을 배를 골랐다.', reviewNote: '과일과 먹는 상황을 덧붙였어요.' },
    { id: 'bae-boat', meaningId: 'bae:boat', blockLabel: '탈것 단서', completedSentence: '민수가 강가에서 탈 배를 골랐다.', reviewNote: '강가와 탈것 단서를 덧붙였어요.' },
  ] },
} as const satisfies WordPack
