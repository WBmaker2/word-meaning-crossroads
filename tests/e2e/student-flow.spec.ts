import { expect, test, type Page } from '@playwright/test'
import type { WordId } from '../../src/domain/contentTypes'
import { FLOW_ANSWERS, TEST_ROUTE_WORDS } from './fixtures/answers'
import { completeRoute, completeScene, completeWord, startRoute } from './helpers/learnerFlow'

const WORD_LABELS: Readonly<Record<WordId, string>> = {
  nun: '눈',
  bae: '배',
  bam: '밤',
  mal: '말',
  chada: '차다',
  dari: '다리',
  sseuda: '쓰다',
  gamda: '감다',
}

type FlowMetrics = {
  context: number
  clue: number
  comparison: number
  hiddenCue: number
  repair: number
}

async function installFlowMetrics(page: Page): Promise<void> {
  await page.evaluate(() => {
    const metrics: FlowMetrics = { context: 0, clue: 0, comparison: 0, hiddenCue: 0, repair: 0 }
    const seen = new WeakSet<Element>()
    const selectors: Readonly<Record<keyof FlowMetrics, string>> = {
      context: 'section.context-card',
      clue: 'section.clue-card',
      comparison: 'section.comparison-card',
      hiddenCue: '[data-testid="necessity-hidden-sentence"]',
      repair: 'section.sentence-repair-card',
    }

    const scan = () => {
      for (const key of Object.keys(selectors) as (keyof FlowMetrics)[]) {
        for (const element of document.querySelectorAll(selectors[key])) {
          if (seen.has(element)) continue
          seen.add(element)
          metrics[key] += 1
        }
      }
      document.documentElement.dataset.studentFlowMetrics = JSON.stringify(metrics)
    }

    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true })
    scan()
  })
}

async function expectFlowMetrics(page: Page, expected: FlowMetrics): Promise<void> {
  const actual = await page.evaluate(() => JSON.parse(
    document.documentElement.dataset.studentFlowMetrics ?? '{}',
  ) as FlowMetrics)
  expect(actual).toEqual(expected)
}

async function expectRecord(page: Page, routeLabel: string, wordIds: readonly WordId[]): Promise<void> {
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expect(page.locator('.record-route-label')).toContainText(routeLabel)

  const words = page.locator('.record-word')
  await expect(words).toHaveCount(wordIds.length)
  await expect(words.locator('h4')).toHaveText(wordIds.map((wordId, index) => `${index + 1}. ${WORD_LABELS[wordId]}`))
  for (const word of await words.all()) {
    await expect(word.locator('.record-scenes > li')).toHaveCount(3)
    await expect(word.locator('.record-necessity')).toHaveCount(1)
    await expect(word.locator('.record-repair')).toHaveCount(1)
  }

  const evidence = page.locator('[data-evidence]')
  await expect(evidence).toHaveCount(4)
  await expect(evidence.getByText('기록됨', { exact: true })).toHaveCount(4)
}

test('completes the core route and records all four learning evidence types', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('./')
  await installFlowMetrics(page)
  await completeRoute(page, 'core')

  await expectRecord(page, '기본 길 4개', TEST_ROUTE_WORDS.core)
  await expectFlowMetrics(page, { context: 12, clue: 12, comparison: 4, hiddenCue: 4, repair: 4 })
})

test('completes the extension route with all four extended word paths', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('./')
  await installFlowMetrics(page)
  await completeRoute(page, 'extension')

  await expectRecord(page, '확장 길 4개', TEST_ROUTE_WORDS.extension)
  await expectFlowMetrics(page, { context: 12, clue: 12, comparison: 4, hiddenCue: 4, repair: 4 })
})

test('completes the all route and preserves the reviewed word order in the record', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('./')
  await installFlowMetrics(page)
  await completeRoute(page, 'all')

  await expectRecord(page, '전체 길 8개', TEST_ROUTE_WORDS.all)
  await expectFlowMetrics(page, { context: 24, clue: 24, comparison: 8, hiddenCue: 8, repair: 8 })
})

test('recovers from supportive-only clues, a wrong meaning, and a wrong clarity choice', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('./')
  await startRoute(page, 'core')

  const firstScene = FLOW_ANSWERS.scenes['nun-snow-01']
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(firstScene.prediction)
  await page.getByRole('button', { name: /단서 찾기/ }).click()

  await page.getByRole('button', { name: '흰, 선택 안 됨', exact: true }).click()
  await page.getByRole('button', { name: /뜻 확인/ }).click()
  await expect(page.locator('[data-feedback-announcer]')).toHaveAttribute('role', 'alert')
  await expect(page.locator('[data-feedback-announcer]')).toContainText('도움이 되는 단서')
  await expect(page.getByRole('button', { name: '다시 단서 고르기', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '다시 단서 고르기', exact: true }).click()
  await page.getByRole('button', { name: '내려, 선택 안 됨', exact: true }).click()
  await page.getByRole('button', { name: /뜻 확인/ }).click()

  await page.getByRole('radio', { name: /보는 눈/ }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
  await expect(page.locator('[data-feedback-announcer]')).toHaveAttribute('role', 'alert')
  await expect(page.locator('[data-feedback-announcer]')).toContainText('눈으로 보는 행동이 아니라')
  const meaningFeedback = page.getByTestId('meaning-feedback')
  await expect(meaningFeedback).toBeVisible()
  await expect(meaningFeedback).toHaveAttribute('aria-hidden', 'true')
  await expect(meaningFeedback).toContainText('눈으로 보는 행동이 아니라')
  await expect(meaningFeedback).toBeInViewport()
  const meaningFeedbackBox = await meaningFeedback.boundingBox()
  expect(meaningFeedbackBox).not.toBeNull()
  expect(meaningFeedbackBox!.height).toBeGreaterThan(0)
  expect(meaningFeedbackBox!.y + meaningFeedbackBox!.height).toBeLessThanOrEqual(812)
  await expect(page.getByRole('button', { name: '다시 뜻 고르기', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '그 뜻이 되려면 주변에 어떤 말이 필요할까요?' })).toBeVisible()

  await page.getByRole('button', { name: '다시 뜻 고르기', exact: true }).click()
  await expect(page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true })).toBeEnabled()
  await expect(page.getByRole('radio', { name: /보는 눈/ })).toBeChecked()
  await page.getByRole('radio', { name: /내리는 눈/ }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
  await completeScene(page, 'nun-eye-02')

  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await page.getByRole('radio', { name: '판단하기 어려워졌어요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await expect(page.locator('[data-feedback-announcer]')).toHaveAttribute('role', 'alert')
  await expect(page.locator('[data-feedback-announcer]')).toContainText('다시 비교해 보세요')
  await expect(page.getByRole('heading', { name: '같은 낱말을 두 문장에서 비교해 보아요' })).toBeVisible()

  await page.getByRole('radio', { name: '여전히 분명해요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await completeScene(page, 'nun-uncertain-03')
  await page.getByRole('radio', { name: /내리는 눈 단서/ }).check()
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()

  await completeWord(page, 'bae')
  await completeWord(page, 'bam')
  await completeWord(page, 'mal')
  await expectRecord(page, '기본 길 4개', TEST_ROUTE_WORDS.core)
  await expect(page.locator('.record-word').first()).toContainText('나는 창밖에 내리는 눈을 보았다.')
})
