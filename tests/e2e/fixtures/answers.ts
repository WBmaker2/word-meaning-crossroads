import type { RouteId, SceneId, WordId } from '../../../src/domain/contentTypes'
import type { CueNecessityDecision, RepairSolutionId } from '../../../src/domain/contentTypes'

export interface ExpectedSceneInteraction {
  readonly prediction: string
  readonly clue:
    | { readonly kind: 'tokens'; readonly labels: readonly [string] | readonly [string, string] }
    | { readonly kind: 'insufficient' }
  readonly meaningLabel: string
}

export interface ExpectedWordInteraction {
  readonly necessityDecision: CueNecessityDecision
  readonly repairSolutionId: RepairSolutionId
}

export interface ExpectedFlowAnswers {
  readonly scenes: Readonly<Record<SceneId, ExpectedSceneInteraction>>
  readonly words: Readonly<Record<WordId, ExpectedWordInteraction>>
}

export const TEST_ROUTE_WORDS: Readonly<Record<RouteId, readonly WordId[]>> = {
  core: ['nun', 'bae', 'bam', 'mal'],
  extension: ['chada', 'dari', 'sseuda', 'gamda'],
  all: ['nun', 'bae', 'bam', 'mal', 'chada', 'dari', 'sseuda', 'gamda'],
}

export const FLOW_ANSWERS: ExpectedFlowAnswers = {
  scenes: {
    'nun-snow-01': { prediction: '하늘에서 내리는 것', clue: { kind: 'tokens', labels: ['내려'] }, meaningLabel: '내리는 눈' },
    'nun-eye-02': { prediction: '보는 몸의 부분', clue: { kind: 'tokens', labels: ['보았습니다.'] }, meaningLabel: '보는 눈' },
    'nun-uncertain-03': { prediction: '잘 모르겠어요', clue: { kind: 'insufficient' }, meaningLabel: '판단하기 어려움' },
    'bae-boat-01': { prediction: '물 위의 탈것', clue: { kind: 'tokens', labels: ['타고'] }, meaningLabel: '물 위의 배' },
    'bae-belly-02': { prediction: '몸의 앞부분', clue: { kind: 'tokens', labels: ['불렀습니다.'] }, meaningLabel: '몸의 배' },
    'bae-pear-03': { prediction: '먹는 과일', clue: { kind: 'tokens', labels: ['먹었습니다.'] }, meaningLabel: '먹는 배' },
    'bam-night-01': { prediction: '어두운 시간', clue: { kind: 'tokens', labels: ['어두운'] }, meaningLabel: '어두운 시간' },
    'bam-chestnut-02': { prediction: '먹는 열매', clue: { kind: 'tokens', labels: ['쪘습니다.'] }, meaningLabel: '먹는 열매' },
    'bam-uncertain-03': { prediction: '잘 모르겠어요', clue: { kind: 'insufficient' }, meaningLabel: '판단하기 어려움' },
    'mal-horse-01': { prediction: '달리는 동물', clue: { kind: 'tokens', labels: ['달렸습니다.'] }, meaningLabel: '달리는 동물' },
    'mal-speech-02': { prediction: '주고받는 말', clue: { kind: 'tokens', labels: ['듣고'] }, meaningLabel: '주고받는 말' },
    'mal-uncertain-03': { prediction: '잘 모르겠어요', clue: { kind: 'insufficient' }, meaningLabel: '판단하기 어려움' },
    'chada-kick-01': { prediction: '발로 차는 행동', clue: { kind: 'tokens', labels: ['공을'] }, meaningLabel: '발로 차기' },
    'chada-wear-02': { prediction: '몸에 두르는 행동', clue: { kind: 'tokens', labels: ['시계를'] }, meaningLabel: '몸에 차기' },
    'chada-fill-03': { prediction: '물이 가득해지는 상태', clue: { kind: 'tokens', labels: ['물이'] }, meaningLabel: '물이 차오르기' },
    'dari-leg-01': { prediction: '몸의 부분', clue: { kind: 'tokens', labels: ['아팠습니다.'] }, meaningLabel: '몸의 다리' },
    'dari-bridge-02': { prediction: '건너는 시설', clue: { kind: 'tokens', labels: ['건너'] }, meaningLabel: '건너는 다리' },
    'dari-uncertain-03': { prediction: '잘 모르겠어요', clue: { kind: 'insufficient' }, meaningLabel: '판단하기 어려움' },
    'sseuda-write-01': { prediction: '글을 적는 행동', clue: { kind: 'tokens', labels: ['일기에'] }, meaningLabel: '글을 쓰기' },
    'sseuda-wear-02': { prediction: '모자를 머리에 얹는 행동', clue: { kind: 'tokens', labels: ['모자를'] }, meaningLabel: '모자를 쓰기' },
    'sseuda-bitter-03': { prediction: '쓴맛이 나는 상태', clue: { kind: 'tokens', labels: ['맛이'] }, meaningLabel: '맛이 쓰기' },
    'gamda-close-01': { prediction: '눈을 덮는 행동', clue: { kind: 'tokens', labels: ['눈을'] }, meaningLabel: '눈을 감기' },
    'gamda-wind-02': { prediction: '둘러 두르는 행동', clue: { kind: 'tokens', labels: ['리본을'] }, meaningLabel: '둘러 감기' },
    'gamda-wash-03': { prediction: '머리를 씻는 행동', clue: { kind: 'tokens', labels: ['머리를'] }, meaningLabel: '머리를 감기' },
  },
  words: {
    nun: { necessityDecision: 'still-clear', repairSolutionId: 'nun-snow' },
    bae: { necessityDecision: 'now-unclear', repairSolutionId: 'bae-pear' },
    bam: { necessityDecision: 'now-unclear', repairSolutionId: 'bam-night' },
    mal: { necessityDecision: 'now-unclear', repairSolutionId: 'mal-horse' },
    chada: { necessityDecision: 'still-clear', repairSolutionId: 'chada-kick' },
    dari: { necessityDecision: 'still-clear', repairSolutionId: 'dari-bridge' },
    sseuda: { necessityDecision: 'still-clear', repairSolutionId: 'sseuda-write' },
    gamda: { necessityDecision: 'still-clear', repairSolutionId: 'gamda-close' },
  },
}
