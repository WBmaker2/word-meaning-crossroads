import { expect, type Page } from '@playwright/test'
import type { RouteId, SceneId, WordId } from '../../../src/domain/contentTypes'
import type { RepairSolutionId } from '../../../src/domain/contentTypes'
import { FLOW_ANSWERS, TEST_ROUTE_WORDS } from '../fixtures/answers'

const SCENES_BY_WORD: Readonly<Record<WordId, readonly SceneId[]>> = {
  nun: ['nun-snow-01', 'nun-eye-02', 'nun-uncertain-03'],
  bae: ['bae-boat-01', 'bae-belly-02', 'bae-pear-03'],
  bam: ['bam-night-01', 'bam-chestnut-02', 'bam-uncertain-03'],
  mal: ['mal-horse-01', 'mal-speech-02', 'mal-uncertain-03'],
  chada: ['chada-kick-01', 'chada-wear-02', 'chada-fill-03'],
  dari: ['dari-leg-01', 'dari-bridge-02', 'dari-uncertain-03'],
  sseuda: ['sseuda-write-01', 'sseuda-wear-02', 'sseuda-bitter-03'],
  gamda: ['gamda-close-01', 'gamda-wind-02', 'gamda-wash-03'],
}

const ROUTE_LABELS: Readonly<Record<RouteId, string>> = {
  core: '기본 길 4개', extension: '확장 길 4개', all: '전체 길 8개',
}

const REPAIR_LABELS: Readonly<Record<RepairSolutionId, string>> = {
  'nun-snow': '내리는 눈 단서', 'nun-eye': '보는 눈 단서',
  'bae-pear': '과일 단서', 'bae-boat': '탈것 단서',
  'bam-night': '시간 단서', 'bam-chestnut': '열매 단서',
  'mal-horse': '동물 단서', 'mal-speech': '대화 단서',
  'chada-kick': '공을 차기', 'chada-wear': '시계를 차기',
  'dari-bridge': '건너는 다리', 'dari-leg': '몸의 부분',
  'sseuda-write': '글쓰기 단서', 'sseuda-wear': '모자 단서',
  'gamda-close': '눈을 감기', 'gamda-wind': '리본을 감기', 'gamda-wash': '머리를 감기',
}

function quoteRegExp(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
}

export type PreMeaningPhase = 'context' | 'clue'
export type PreMeaningObserver = (page: Page, phase: PreMeaningPhase) => Promise<void>

function sceneOrder(sceneId: SceneId): 1 | 2 | 3 {
  const order = Number(sceneId.slice(-2))
  if (order !== 1 && order !== 2 && order !== 3) throw new Error(`Unsupported scene order in ${sceneId}`)
  return order
}

export async function startRoute(page: Page, routeId: RouteId): Promise<void> {
  await page.getByRole('button', { name: ROUTE_LABELS[routeId], exact: true }).click()
}

export async function completeScene(page: Page, sceneId: SceneId, observe?: PreMeaningObserver): Promise<void> {
  const answer = FLOW_ANSWERS.scenes[sceneId]
  await expect(page.locator(`[data-context-order="${sceneOrder(sceneId)}"] [data-sentence-order="1"]`)).toBeVisible()
  await observe?.(page, 'context')
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(answer.prediction)
  await page.getByRole('button', { name: /단서 찾기/ }).click()
  await expect(page.locator('section.clue-card')).toBeVisible()
  await observe?.(page, 'clue')
  if (answer.clue.kind === 'insufficient') {
    await page.getByRole('button', { name: /결정 단서가 없어요/ }).click()
  } else {
    for (const label of answer.clue.labels) {
      await page.getByRole('button', { name: quoteRegExp(`${label}, 선택 안 됨`) }).click()
    }
  }
  await page.getByRole('button', { name: /뜻 확인/ }).click()
  await page.getByRole('radio', { name: quoteRegExp(answer.meaningLabel) }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
}

export async function completeWord(page: Page, wordId: WordId, observe?: PreMeaningObserver): Promise<void> {
  const sceneIds = SCENES_BY_WORD[wordId]
  await completeScene(page, sceneIds[0], observe)
  await completeScene(page, sceneIds[1], observe)
  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  const necessity = FLOW_ANSWERS.words[wordId].necessityDecision
  await page.getByRole('radio', { name: necessity === 'still-clear' ? '여전히 분명해요' : '판단하기 어려워졌어요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await completeScene(page, sceneIds[2], observe)
  await page.getByRole('radio', { name: new RegExp(REPAIR_LABELS[FLOW_ANSWERS.words[wordId].repairSolutionId]) }).check()
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()
}

export async function completeRoute(page: Page, routeId: RouteId): Promise<void> {
  await startRoute(page, routeId)
  for (const wordId of TEST_ROUTE_WORDS[routeId]) await completeWord(page, wordId)
}
