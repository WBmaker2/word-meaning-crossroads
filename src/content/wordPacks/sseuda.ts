import type { WordPack } from '../../domain/contentTypes'

export const sseuda = {
  id: 'sseuda', lemma: '쓰다',
  meanings: [
    { id: 'sseuda:write', childFriendlyLabel: '글을 쓰기', childFriendlyDescription: '글자나 글을 종이나 화면에 적는 행동', contrastExample: '공책에 연필로 글을 씁니다.' },
    { id: 'sseuda:wear', childFriendlyLabel: '모자를 쓰기', childFriendlyDescription: '모자 같은 것을 머리에 얹거나 덮는 행동', contrastExample: '햇빛을 가리려고 모자를 씁니다.' },
    { id: 'sseuda:bitter', childFriendlyLabel: '맛이 쓰기', childFriendlyDescription: '약처럼 달지 않고 쓴맛이 나는 상태', contrastExample: '약의 맛이 씁니다.' },
  ],
  scenes: [
    {
      id: 'sseuda-write-01', wordId: 'sseuda', order: 1,
      sentences: [{ id: 'sseuda-write-01:s1', plainText: '나는 연필로 일기에 오늘 일을 썼습니다.', tokens: [
        { id: 'sseuda-write-01:t1', text: '나는', role: 'neutral' }, { id: 'sseuda-write-01:t2', text: '연필로', role: 'supportive' }, { id: 'sseuda-write-01:t3', text: '일기에', role: 'decisive' }, { id: 'sseuda-write-01:t4', text: '오늘', role: 'supportive' }, { id: 'sseuda-write-01:t5', text: '일을', role: 'supportive' }, { id: 'sseuda-write-01:t6', text: '썼습니다.', role: 'target', targetSurface: '썼습니다' },
      ] }], candidateMeaningIds: ['sseuda:write', 'sseuda:wear'], expectedDecision: 'sseuda:write', decisiveCueTokenIds: ['sseuda-write-01:t3'], supportiveCueTokenIds: ['sseuda-write-01:t2', 'sseuda-write-01:t4', 'sseuda-write-01:t5'],
      wrongChoiceFeedback: { 'sseuda:write': '‘일기에’와 ‘연필로 오늘 일을’이라는 단서가 글을 쓰는 행동을 가리켜요.', 'sseuda:wear': '머리에 모자를 덮은 장면이 아니라 ‘일기에 연필로’ 적은 행동인지 비교해 보아요.', 'insufficient-context': '‘일기에’와 ‘연필로’가 남아 있어 글을 쓰기인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/sseuda-write-01.mp3', illustrationId: 'crossroads-sseuda',
    },
    {
      id: 'sseuda-wear-02', wordId: 'sseuda', order: 2,
      sentences: [{ id: 'sseuda-wear-02:s1', plainText: '햇빛이 강해서 머리에 모자를 썼습니다.', tokens: [
        { id: 'sseuda-wear-02:t1', text: '햇빛이', role: 'supportive' }, { id: 'sseuda-wear-02:t2', text: '강해서', role: 'neutral' }, { id: 'sseuda-wear-02:t3', text: '머리에', role: 'supportive' }, { id: 'sseuda-wear-02:t4', text: '모자를', role: 'decisive' }, { id: 'sseuda-wear-02:t5', text: '썼습니다.', role: 'target', targetSurface: '썼습니다' },
      ] }], candidateMeaningIds: ['sseuda:wear', 'sseuda:bitter'], expectedDecision: 'sseuda:wear', decisiveCueTokenIds: ['sseuda-wear-02:t4'], supportiveCueTokenIds: ['sseuda-wear-02:t1', 'sseuda-wear-02:t3'],
      wrongChoiceFeedback: { 'sseuda:wear': '‘모자를’과 ‘머리에’라는 단서가 모자를 쓰는 행동을 가리켜요.', 'sseuda:bitter': '약을 먹은 맛이 아니라 ‘햇빛을 가리려고 머리에 모자를’ 쓴 장면인지 비교해 보아요.', 'insufficient-context': '‘모자를’과 ‘머리에’가 남아 있어 모자를 쓰기인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/sseuda-wear-02.mp3', illustrationId: 'crossroads-sseuda',
    },
    {
      id: 'sseuda-bitter-03', wordId: 'sseuda', order: 3,
      sentences: [{ id: 'sseuda-bitter-03:s1', plainText: '약을 먹어 보니 맛이 매우 썼습니다.', tokens: [
        { id: 'sseuda-bitter-03:t1', text: '약을', role: 'supportive' }, { id: 'sseuda-bitter-03:t2', text: '먹어', role: 'supportive' }, { id: 'sseuda-bitter-03:t3', text: '보니', role: 'supportive' }, { id: 'sseuda-bitter-03:t4', text: '맛이', role: 'decisive' }, { id: 'sseuda-bitter-03:t5', text: '매우', role: 'neutral' }, { id: 'sseuda-bitter-03:t6', text: '썼습니다.', role: 'target', targetSurface: '썼습니다' },
      ] }], candidateMeaningIds: ['sseuda:bitter', 'sseuda:write'], expectedDecision: 'sseuda:bitter', decisiveCueTokenIds: ['sseuda-bitter-03:t4'], supportiveCueTokenIds: ['sseuda-bitter-03:t1', 'sseuda-bitter-03:t2', 'sseuda-bitter-03:t3'],
      wrongChoiceFeedback: { 'sseuda:bitter': '‘맛이’와 ‘약을 먹어 보니’라는 단서가 쓴맛을 가리켜요.', 'sseuda:write': '글자를 적은 장면이 아니라 ‘약을 먹어 보니 맛이’ 쓴 상태인지 비교해 보아요.', 'insufficient-context': '‘맛이’와 ‘약을 먹어 보니’가 남아 있어 맛이 쓰기인지 살펴볼 수 있어요.' }, audioSrc: '/audio/scenes/sseuda-bitter-03.mp3', illustrationId: 'crossroads-sseuda',
    },
  ],
  necessityChallenge: { id: 'necessity-sseuda', wordId: 'sseuda', originalSentence: '나는 연필로 일기를 썼습니다.', hiddenTokenText: '연필로', sentenceAfterHide: '나는 ______ 일기를 썼습니다.', expectedClarity: 'still-clear', explanation: '‘일기를’이 남아 글을 적은 뜻임을 알 수 있어요.' },
  repair: { id: 'repair-sseuda', wordId: 'sseuda', ambiguousSentence: '민서는 썼다.', solutions: [
    { id: 'sseuda-write', meaningId: 'sseuda:write', blockLabel: '글쓰기 단서', completedSentence: '민서는 공책에 연필로 글을 썼다.', reviewNote: '공책과 연필을 덧붙였어요.' },
    { id: 'sseuda-wear', meaningId: 'sseuda:wear', blockLabel: '모자 단서', completedSentence: '민서는 햇빛을 가리려고 모자를 썼다.', reviewNote: '햇빛과 모자를 덧붙였어요.' },
  ] },
} as const satisfies WordPack
