import type { WordPack } from '../../domain/contentTypes'

export const bam = {
  id: 'bam', lemma: '밤',
  meanings: [
    { id: 'bam:night', childFriendlyLabel: '어두운 시간', childFriendlyDescription: '해가 진 뒤부터 다시 해가 뜨기 전까지의 시간', contrastExample: '밤이 되어 별이 보입니다.' },
    { id: 'bam:chestnut', childFriendlyLabel: '먹는 열매', childFriendlyDescription: '밤나무에서 열리고 단단한 껍질 안에 든 열매', contrastExample: '밤을 삶아 간식으로 먹습니다.' },
  ],
  scenes: [
    {
      id: 'bam-night-01', wordId: 'bam', order: 1,
      sentences: [{ id: 'bam-night-01:s1', plainText: '해가 지고 어두운 밤이 되자 가로등이 켜졌습니다.', tokens: [
        { id: 'bam-night-01:t1', text: '해가', role: 'supportive' }, { id: 'bam-night-01:t2', text: '지고', role: 'supportive' },
        { id: 'bam-night-01:t3', text: '어두운', role: 'decisive' }, { id: 'bam-night-01:t4', text: '밤이', role: 'target', targetSurface: '밤' },
        { id: 'bam-night-01:t5', text: '되자', role: 'neutral' }, { id: 'bam-night-01:t6', text: '가로등이', role: 'supportive' },
        { id: 'bam-night-01:t7', text: '켜졌습니다.', role: 'neutral' },
      ] }], candidateMeaningIds: ['bam:night', 'bam:chestnut'], expectedDecision: 'bam:night', decisiveCueTokenIds: ['bam-night-01:t3'], supportiveCueTokenIds: ['bam-night-01:t1', 'bam-night-01:t2', 'bam-night-01:t6'],
      wrongChoiceFeedback: {
        'bam:night': '‘어두운’과 ‘해가 지고’라는 단서가 어두운 시간을 가리켜요.',
        'bam:chestnut': '껍질을 벗겨 먹는 열매 장면이 아니라 ‘어두운 밤’과 가로등 장면인지 비교해 보아요.',
        'insufficient-context': '‘어두운’과 ‘가로등’이 남아 있어 어두운 시간인지 살펴볼 수 있어요.',
      }, audioSrc: '/audio/scenes/bam-night-01.mp3', illustrationId: 'crossroads-bam',
    },
    {
      id: 'bam-chestnut-02', wordId: 'bam', order: 2,
      sentences: [{ id: 'bam-chestnut-02:s1', plainText: '할머니는 껍질을 벗긴 밤을 솥에 쪘습니다.', tokens: [
        { id: 'bam-chestnut-02:t1', text: '할머니는', role: 'neutral' }, { id: 'bam-chestnut-02:t2', text: '껍질을', role: 'supportive' },
        { id: 'bam-chestnut-02:t3', text: '벗긴', role: 'neutral' }, { id: 'bam-chestnut-02:t4', text: '밤을', role: 'target', targetSurface: '밤' },
        { id: 'bam-chestnut-02:t5', text: '솥에', role: 'supportive' }, { id: 'bam-chestnut-02:t6', text: '쪘습니다.', role: 'decisive' },
      ] }], candidateMeaningIds: ['bam:chestnut', 'bam:night'], expectedDecision: 'bam:chestnut', decisiveCueTokenIds: ['bam-chestnut-02:t6'], supportiveCueTokenIds: ['bam-chestnut-02:t2', 'bam-chestnut-02:t5'],
      wrongChoiceFeedback: {
        'bam:chestnut': '‘쪘습니다’와 ‘껍질을 벗긴’이라는 단서가 먹는 열매를 가리켜요.',
        'bam:night': '가로등이 켜진 시간 장면이 아니라 ‘솥에 쪘습니다’라는 요리 행동인지 비교해 보아요.',
        'insufficient-context': '‘쪘습니다’와 ‘솥에’가 남아 있어 먹는 열매인지 살펴볼 수 있어요.',
      }, audioSrc: '/audio/scenes/bam-chestnut-02.mp3', illustrationId: 'crossroads-bam',
    },
    {
      id: 'bam-uncertain-03', wordId: 'bam', order: 3,
      sentences: [{ id: 'bam-uncertain-03:s1', plainText: '형은 밤을 좋아합니다.', tokens: [
        { id: 'bam-uncertain-03:t1', text: '형은', role: 'neutral' },
        { id: 'bam-uncertain-03:t2', text: '밤을', role: 'target', targetSurface: '밤' },
        { id: 'bam-uncertain-03:t3', text: '좋아합니다.', role: 'supportive' },
      ] }], candidateMeaningIds: ['bam:night', 'bam:chestnut'], expectedDecision: 'insufficient-context', decisiveCueTokenIds: [], supportiveCueTokenIds: ['bam-uncertain-03:t3'],
      wrongChoiceFeedback: {
        'bam:night': '‘좋아합니다’만으로는 어두운 시간인지 먹는 열매인지 결정되지 않아요.',
        'bam:chestnut': '먹는 행동이나 껍질 같은 단서가 없어 열매라고 정할 수 없어요.',
        'insufficient-context': '시간인지 열매인지 알려 주는 단서가 없어서 ‘밤’의 뜻을 정하기 어려워요.',
      }, audioSrc: '/audio/scenes/bam-uncertain-03.mp3', illustrationId: 'crossroads-bam',
    },
  ],
  necessityChallenge: { id: 'necessity-bam', wordId: 'bam', originalSentence: '할머니는 밤을 쪘습니다.', hiddenTokenText: '쪘습니다', sentenceAfterHide: '할머니는 밤을 ______.', expectedClarity: 'now-unclear', explanation: '`쪘습니다`가 없으면 어두운 시간을 말하는지 열매를 말하는지 정하기 어려워요.' },
  repair: { id: 'repair-bam', wordId: 'bam', ambiguousSentence: '나는 밤을 좋아한다.', solutions: [
    { id: 'bam-night', meaningId: 'bam:night', blockLabel: '시간 단서', completedSentence: '나는 별이 뜨는 밤을 좋아한다.', reviewNote: '별이 뜨는 시간임을 덧붙였어요.' },
    { id: 'bam-chestnut', meaningId: 'bam:chestnut', blockLabel: '열매 단서', completedSentence: '나는 삶아서 먹는 밤을 좋아한다.', reviewNote: '삶아 먹는 열매임을 덧붙였어요.' },
  ] },
} as const satisfies WordPack
