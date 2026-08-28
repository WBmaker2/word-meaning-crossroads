import type { WordPack } from '../../domain/contentTypes'

export const chada = {
  id: 'chada', lemma: '차다',
  meanings: [
    { id: 'chada:kick', childFriendlyLabel: '발로 차기', childFriendlyDescription: '발을 움직여 공 같은 것을 세게 건드리는 행동', contrastExample: '운동장에서 공을 찹니다.' },
    { id: 'chada:wear', childFriendlyLabel: '몸에 차기', childFriendlyDescription: '시계나 팔찌 같은 것을 몸에 둘러 매는 행동', contrastExample: '손목에 시계를 찹니다.' },
    { id: 'chada:fill', childFriendlyLabel: '물이 차오르기', childFriendlyDescription: '물 같은 것이 안에 늘어나 가득해지는 상태', contrastExample: '웅덩이에 물이 찹니다.' },
  ],
  scenes: [
    {
      id: 'chada-kick-01', wordId: 'chada', order: 1,
      sentences: [{ id: 'chada-kick-01:s1', plainText: '준호가 발로 공을 힘껏 찼습니다.', tokens: [
        { id: 'chada-kick-01:t1', text: '준호가', role: 'neutral' }, { id: 'chada-kick-01:t2', text: '발로', role: 'supportive' }, { id: 'chada-kick-01:t3', text: '공을', role: 'decisive' }, { id: 'chada-kick-01:t4', text: '힘껏', role: 'supportive' }, { id: 'chada-kick-01:t5', text: '찼습니다.', role: 'target', targetSurface: '찼습니다' },
      ] }], candidateMeaningIds: ['chada:kick', 'chada:wear'], expectedDecision: 'chada:kick', decisiveCueTokenIds: ['chada-kick-01:t3'], supportiveCueTokenIds: ['chada-kick-01:t2', 'chada-kick-01:t4'],
      wrongChoiceFeedback: { 'chada:kick': '‘공을’과 ‘발로’라는 단서가 발로 차는 행동을 가리켜요.', 'chada:wear': '손목에 두르는 물건이 아니라 ‘발로 공을’ 힘껏 건드린 장면인지 비교해 보아요.', 'insufficient-context': '‘공을’과 ‘발로’가 남아 있어 발로 차기인지 살펴볼 수 있어요.' }, illustrationId: 'crossroads-chada',
    },
    {
      id: 'chada-wear-02', wordId: 'chada', order: 2,
      sentences: [{ id: 'chada-wear-02:s1', plainText: '나는 손목에 시계를 찼습니다.', tokens: [
        { id: 'chada-wear-02:t1', text: '나는', role: 'neutral' }, { id: 'chada-wear-02:t2', text: '손목에', role: 'supportive' }, { id: 'chada-wear-02:t3', text: '시계를', role: 'decisive' }, { id: 'chada-wear-02:t4', text: '찼습니다.', role: 'target', targetSurface: '찼습니다' },
      ] }], candidateMeaningIds: ['chada:wear', 'chada:fill'], expectedDecision: 'chada:wear', decisiveCueTokenIds: ['chada-wear-02:t3'], supportiveCueTokenIds: ['chada-wear-02:t2'],
      wrongChoiceFeedback: { 'chada:wear': '‘시계를’와 ‘손목에’라는 단서가 몸에 차는 행동을 가리켜요.', 'chada:fill': '물이 가득해진 웅덩이가 아니라 ‘손목에 시계를’ 두른 장면인지 비교해 보아요.', 'insufficient-context': '‘손목에’와 ‘시계를’이라는 말이 남아 있어 몸에 차기인지 살펴볼 수 있어요.' }, illustrationId: 'crossroads-chada',
    },
    {
      id: 'chada-fill-03', wordId: 'chada', order: 3,
      sentences: [{ id: 'chada-fill-03:s1', plainText: '비가 와서 웅덩이에 물이 가득 찼습니다.', tokens: [
        { id: 'chada-fill-03:t1', text: '비가', role: 'supportive' }, { id: 'chada-fill-03:t2', text: '와서', role: 'supportive' }, { id: 'chada-fill-03:t3', text: '웅덩이에', role: 'neutral' }, { id: 'chada-fill-03:t4', text: '물이', role: 'decisive' }, { id: 'chada-fill-03:t5', text: '가득', role: 'supportive' }, { id: 'chada-fill-03:t6', text: '찼습니다.', role: 'target', targetSurface: '찼습니다' },
      ] }], candidateMeaningIds: ['chada:fill', 'chada:kick'], expectedDecision: 'chada:fill', decisiveCueTokenIds: ['chada-fill-03:t4'], supportiveCueTokenIds: ['chada-fill-03:t1', 'chada-fill-03:t2', 'chada-fill-03:t5'],
      wrongChoiceFeedback: { 'chada:fill': '‘물이’와 ‘가득’이라는 단서가 물이 차오른 상태를 가리켜요.', 'chada:kick': '공을 발로 찬 행동이 아니라 ‘웅덩이에 물이 가득’ 찬 장면인지 비교해 보아요.', 'insufficient-context': '‘물이’와 ‘가득’이 남아 있어 물이 차오르기인지 살펴볼 수 있어요.' }, illustrationId: 'crossroads-chada',
    },
  ],
  necessityChallenge: { id: 'necessity-chada', wordId: 'chada', originalSentence: '나는 손목에 시계를 찼습니다.', hiddenTokenText: '시계를', sentenceAfterHide: '나는 손목에 ______ 찼습니다.', expectedClarity: 'still-clear', explanation: '‘손목에’가 남아 몸에 무엇인가를 둘러 찬 뜻임을 알 수 있어요.' },
  repair: { id: 'repair-chada', wordId: 'chada', ambiguousSentence: '준호가 찼다.', solutions: [
    { id: 'chada-kick', meaningId: 'chada:kick', blockLabel: '공을 차기', completedSentence: '준호가 운동장에서 공을 발로 찼다.', reviewNote: '공과 발을 덧붙였어요.' },
    { id: 'chada-wear', meaningId: 'chada:wear', blockLabel: '시계를 차기', completedSentence: '준호가 외출 전에 손목에 시계를 찼다.', reviewNote: '손목과 시계를 덧붙였어요.' },
  ] },
} as const satisfies WordPack
