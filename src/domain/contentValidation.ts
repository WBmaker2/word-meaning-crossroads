import type {
  ContextScene,
  CueNecessityChallenge,
  RepairChallengeId,
  RouteDefinition,
  WordId,
  WordPack,
} from './contentTypes'

const WORD_ORDER: readonly WordId[] = [
  'nun', 'bae', 'bam', 'mal', 'chada', 'dari', 'sseuda', 'gamda',
]

const EXPECTED_SCENE_IDS: Record<WordId, readonly string[]> = {
  nun: ['nun-snow-01', 'nun-eye-02', 'nun-uncertain-03'],
  bae: ['bae-boat-01', 'bae-belly-02', 'bae-pear-03'],
  bam: ['bam-night-01', 'bam-chestnut-02', 'bam-uncertain-03'],
  mal: ['mal-horse-01', 'mal-speech-02', 'mal-uncertain-03'],
  chada: ['chada-kick-01', 'chada-wear-02', 'chada-fill-03'],
  dari: ['dari-leg-01', 'dari-bridge-02', 'dari-uncertain-03'],
  sseuda: ['sseuda-write-01', 'sseuda-wear-02', 'sseuda-bitter-03'],
  gamda: ['gamda-close-01', 'gamda-wind-02', 'gamda-wash-03'],
}

const EXPECTED_REPAIR_TARGET_SURFACE: Record<RepairChallengeId, string> = {
  'repair-nun': '눈을',
  'repair-bae': '배를',
  'repair-bam': '밤을',
  'repair-mal': '말을',
  'repair-chada': '찼다',
  'repair-dari': '다리를',
  'repair-sseuda': '썼다',
  'repair-gamda': '감았다',
}

const EXPECTED_REPAIR_FINAL_WORD: Record<RepairChallengeId, string> = {
  'repair-nun': '보았다',
  'repair-bae': '골랐다',
  'repair-bam': '좋아한다',
  'repair-mal': '좋아한다',
  'repair-chada': '찼다',
  'repair-dari': '살펴보았다',
  'repair-sseuda': '썼다',
  'repair-gamda': '감았다',
}

const fail = (id: string, invariant: string): never => {
  throw new Error(`${id}: ${invariant}`)
}

function validateScene(
  pack: WordPack,
  scene: ContextScene,
  sceneIds: Set<string>,
  tokenIds: Set<string>,
): void {
  if (scene.wordId !== pack.id) fail(scene.id, 'word id')
  if (scene.order !== pack.scenes.indexOf(scene) + 1) fail(scene.id, 'scene order')
  if (sceneIds.has(scene.id)) fail(scene.id, 'globally unique scene id')
  sceneIds.add(scene.id)
  if (scene.sentences.length !== 1) fail(scene.id, 'one sentence')
  const sentence = scene.sentences[0]
  if (sentence.id !== `${scene.id}:s1`) fail(scene.id, 'sentence id')
  if (sentence.plainText !== sentence.tokens.map((token) => token.text).join(' ')) {
    fail(scene.id, 'plainText equals tokens')
  }
  if (scene.audioSrc !== `/audio/scenes/${scene.id}.mp3`) fail(scene.id, 'audio path')
  if (scene.illustrationId !== `crossroads-${pack.id}`) fail(scene.id, 'illustration path')

  const candidateSet = new Set(scene.candidateMeaningIds)
  if (scene.candidateMeaningIds.length !== 2) fail(scene.id, 'exactly two candidates')
  if (candidateSet.size !== scene.candidateMeaningIds.length) fail(scene.id, 'duplicate candidates')
  if (scene.candidateMeaningIds.some((id) => !pack.meanings.some((meaning) => meaning.id === id))) {
    fail(scene.id, 'candidate in pack')
  }
  if (scene.expectedDecision !== 'insufficient-context' && !candidateSet.has(scene.expectedDecision)) {
    fail(scene.id, 'valid expected decision')
  }
  const feedbackKeys = Object.keys(scene.wrongChoiceFeedback)
  const expectedFeedbackKeys = [...scene.candidateMeaningIds, 'insufficient-context']
  if (
    feedbackKeys.length !== 3
    || new Set(feedbackKeys).size !== 3
    || feedbackKeys.some((key) => !expectedFeedbackKeys.includes(key))
    || expectedFeedbackKeys.some((key) => !scene.wrongChoiceFeedback[key as keyof typeof scene.wrongChoiceFeedback]?.trim())
  ) {
    fail(scene.id, 'exact feedback keys and non-empty messages')
  }

  const targets = sentence.tokens.filter((token) => token.role === 'target')
  if (targets.length !== 1 || !targets[0].targetSurface || !targets[0].text.includes(targets[0].targetSurface)) {
    fail(scene.id, 'exactly one target with contained targetSurface')
  }
  for (const [index, token] of sentence.tokens.entries()) {
    const expectedTokenId = `${scene.id}:t${index + 1}`
    if (token.id !== expectedTokenId || tokenIds.has(token.id)) fail(scene.id, `exact TokenId (${token.id})`)
    tokenIds.add(token.id)
    if (token.role !== 'target' && token.targetSurface) fail(token.id, 'no other targetSurface')
  }

  const decisiveIds = new Set(scene.decisiveCueTokenIds)
  const supportiveIds = new Set(scene.supportiveCueTokenIds)
  if (decisiveIds.size !== scene.decisiveCueTokenIds.length || supportiveIds.size !== scene.supportiveCueTokenIds.length) {
    fail(scene.id, 'unique cue references')
  }
  if ([...decisiveIds].some((id) => supportiveIds.has(id))) fail(scene.id, 'decisive/supportive disjoint')
  for (const [ids, role] of [[scene.decisiveCueTokenIds, 'decisive'], [scene.supportiveCueTokenIds, 'supportive']] as const) {
    for (const id of ids) {
      const token = sentence.tokens.find((candidate) => candidate.id === id)
      if (!token) {
        fail(scene.id, `cue reference ${id} is not a sentence token`)
      } else if (token.role !== role) {
        fail(id, `cue reference must have ${role} role`)
      }
    }
  }
  if (decisiveIds.has(targets[0].id) || supportiveIds.has(targets[0].id)) fail(scene.id, 'target cannot be a cue')
  if (scene.expectedDecision === 'insufficient-context' && decisiveIds.size !== 0) fail(scene.id, 'insufficient has zero decisive cues')
  if (scene.expectedDecision !== 'insufficient-context' && decisiveIds.size === 0) fail(scene.id, 'clear scene has decisive cue')
}

function validateNecessityChallenge(challenge: CueNecessityChallenge, necessityIds: Set<string>): void {
  if (necessityIds.has(challenge.id)) fail(challenge.id, 'unique necessity id')
  necessityIds.add(challenge.id)
  const occurrences = challenge.originalSentence.split(challenge.hiddenTokenText).length - 1
  const expectedAfterHide = challenge.originalSentence.replace(challenge.hiddenTokenText, '______')
  if (
    !['still-clear', 'now-unclear'].includes(challenge.expectedClarity)
    || occurrences !== 1
    || challenge.sentenceAfterHide !== expectedAfterHide
    || challenge.sentenceAfterHide.includes(challenge.hiddenTokenText)
    || !challenge.explanation.trim()
  ) {
    fail(challenge.id, 'necessity reconstruction and clarity contract')
  }
}

function validateChallenges(
  pack: WordPack,
  repairIds: Set<string>,
  solutionIds: Set<string>,
  necessityIds: Set<string>,
): void {
  const necessity = pack.necessityChallenge
  if (necessity.wordId !== pack.id) fail(necessity.id, 'necessity word id')
  validateNecessityChallenge(necessity, necessityIds)

  const repair = pack.repair
  if (repairIds.has(repair.id)) fail(repair.id, 'unique repair id')
  repairIds.add(repair.id)
  if (repair.wordId !== pack.id || repair.solutions.length < 2) fail(repair.id, 'repair challenge shape')
  const repairMeanings = new Set(repair.solutions.map((solution) => solution.meaningId))
  if (repairMeanings.size !== repair.solutions.length || repairMeanings.size < 2) fail(repair.id, 'distinct repair meanings')
  const subject = repair.ambiguousSentence.trim().split(/\s+/u)[0]
  const expectedFinalWord = EXPECTED_REPAIR_FINAL_WORD[repair.id]
  const expectedTargetSurface = EXPECTED_REPAIR_TARGET_SURFACE[repair.id]
  if (!expectedFinalWord || !expectedTargetSurface) fail(repair.id, 'known repair id')
  for (const solution of repair.solutions) {
    if (solutionIds.has(solution.id)) fail(solution.id, 'unique repair solution id')
    solutionIds.add(solution.id)
    if (!pack.meanings.some((meaning) => meaning.id === solution.meaningId)) fail(solution.id, 'repair meaning belongs to pack')
    if (solution.id.replace('-', ':') !== solution.meaningId) fail(solution.id, 'solution id matches meaning id')
    const completedWords = solution.completedSentence.trim().split(/\s+/u)
    const finalWord = completedWords.at(-1)?.replace(/[.?!]$/u, '')
    if (!solution.blockLabel.trim() || !solution.reviewNote.trim()) fail(solution.id, 'repair text fields')
    if (completedWords[0] !== subject) fail(solution.id, 'repair subject')
    if (!solution.completedSentence.includes(expectedTargetSurface)) fail(solution.id, 'repair target surface')
    if (finalWord !== expectedFinalWord) fail(solution.id, 'repair target inflection')
  }
}

export function validateWordPacks(
  wordPacks: readonly WordPack[],
  routes: readonly RouteDefinition[],
): void {
  if (wordPacks.length !== WORD_ORDER.length) fail('packs', 'exactly eight packs')
  if (wordPacks.map((pack) => pack.id).join(',') !== WORD_ORDER.join(',')) fail('packs', 'exact pack order')

  const sceneIds = new Set<string>()
  const tokenIds = new Set<string>()
  const repairIds = new Set<string>()
  const solutionIds = new Set<string>()
  const necessityIds = new Set<string>()
  for (const pack of wordPacks) {
    if (pack.scenes.length !== 3) fail(pack.id, 'exactly three scenes')
    if (new Set(pack.meanings.map((meaning) => meaning.id)).size !== pack.meanings.length) fail(pack.id, 'unique meanings')
    if (pack.scenes.map((scene) => scene.id).join(',') !== EXPECTED_SCENE_IDS[pack.id].join(',')) fail(pack.id, 'exact scene order')
    pack.scenes.forEach((scene) => validateScene(pack, scene, sceneIds, tokenIds))
    validateChallenges(pack, repairIds, solutionIds, necessityIds)
  }

  if (sceneIds.size !== 24 || tokenIds.size === 0 || necessityIds.size !== 8 || repairIds.size !== 8) {
    fail('aggregate', 'complete global content ids')
  }
  if (new Set(wordPacks.map((pack) => pack.necessityChallenge.expectedClarity)).size !== 2) {
    fail('necessity', 'both clarity outcomes')
  }
  if (routes.length !== 3 || routes.map((route) => route.id).join(',') !== 'core,extension,all') {
    fail('routes', 'route ids')
  }
  const expectedRoutes: readonly WordId[][] = [
    ['nun', 'bae', 'bam', 'mal'],
    ['chada', 'dari', 'sseuda', 'gamda'],
    [...WORD_ORDER],
  ]
  routes.forEach((route, index) => {
    const expected = expectedRoutes[index]
    if (route.wordIds.length !== expected.length || route.wordIds.join(',') !== expected.join(',') || new Set(route.wordIds).size !== route.wordIds.length) {
      fail(route.id, 'route order and no duplicates')
    }
  })
}
