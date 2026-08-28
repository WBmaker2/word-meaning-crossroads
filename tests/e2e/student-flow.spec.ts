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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(sizes.scroll, `document scrollWidth ${sizes.scroll} exceeds clientWidth ${sizes.client}`).toBeLessThanOrEqual(sizes.client)
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

  await expect(page.getByRole('heading', { name: '내가 배운 것', exact: true })).toBeVisible()
  await expect(page.getByText('같은 낱말도 문장에 따라 뜻이 달라져요. 주변 낱말을 단서로 살펴보면 더 정확하게 읽을 수 있어요.', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '내가 해낸 것', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '다음에 해 볼 것', exact: true })).toBeVisible()
  await expect(page.getByText('다음에는 새 문장에서 단서를 찾아 뜻을 말해 보세요.', { exact: true })).toBeVisible()
  const summaryBeforeResponses = await page.evaluate(() => {
    const takeaway = document.getElementById('record-takeaway-title')
    const nextStep = document.getElementById('record-next-step-title')
    const responses = document.getElementById('record-responses-title')
    return Boolean(
      takeaway && nextStep && responses
      && (takeaway.compareDocumentPosition(responses) & Node.DOCUMENT_POSITION_FOLLOWING)
      && (nextStep.compareDocumentPosition(responses) & Node.DOCUMENT_POSITION_FOLLOWING),
    )
  })
  expect(summaryBeforeResponses).toBe(true)

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

test('keeps scene progress visible through comparison and repair', async ({ page }) => {
  await page.goto('./')
  await startRoute(page, 'core')

  await expect(page.getByRole('group', { name: '현재 낱말 1/4 · 장면 1/3', exact: true })).toBeVisible()
  await completeScene(page, 'nun-snow-01')
  await expect(page.getByRole('group', { name: '현재 낱말 1/4 · 장면 2/3', exact: true })).toBeVisible()

  await completeScene(page, 'nun-eye-02')
  await expect(page.getByRole('heading', { name: '같은 낱말을 두 문장에서 비교해 보아요' })).toBeVisible()
  await expect(page.getByRole('group', { name: '현재 낱말 1/4 · 장면 2/3', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await page.getByRole('radio', { name: '여전히 분명해요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()

  await completeScene(page, 'nun-uncertain-03')
  await expect(page.getByRole('group', { name: '현재 낱말 1/4 · 장면 3/3', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true })).toBeVisible()
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

test.describe('mobile meaning feedback recovery', () => {
  test.use({ viewport: { width: 375, height: 812 } })

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
    await expect(page.locator('[data-feedback-announcer]')).toContainText('이 문장에서는 눈이 내려 운동장을 하얗게 만들었어요. ‘보는 눈’이 아니라 ‘내리는 눈’이에요. 주변 단서를 비교해 보세요.')
    const meaningFeedback = page.getByTestId('meaning-feedback')
    await expect(meaningFeedback).toBeVisible()
    await expect(meaningFeedback).toHaveAttribute('aria-hidden', 'true')
    await expect(meaningFeedback).toContainText('이 문장에서는 눈이 내려 운동장을 하얗게 만들었어요. ‘보는 눈’이 아니라 ‘내리는 눈’이에요. 주변 단서를 비교해 보세요.')
    await expect(meaningFeedback).toBeInViewport()
    const retryMeaning = page.getByRole('button', { name: '다시 뜻 고르기', exact: true })
    await expect(retryMeaning).toBeVisible()
    await expect(retryMeaning).toBeInViewport()
    await expect(page.getByRole('heading', { name: '그 뜻이 되려면 주변에 어떤 말이 필요할까요?' })).toBeVisible()

    await retryMeaning.click()
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

  test('keeps wrong-meaning feedback usable at 200 percent text and wide spacing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')
    await page.locator('html').evaluate((element) => { element.style.fontSize = '200%' })
    await page.getByRole('radio', { name: '넓게', exact: true }).check()
    await startRoute(page, 'core')

    const firstScene = FLOW_ANSWERS.scenes['nun-snow-01']
    await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(firstScene.prediction)
    await page.getByRole('button', { name: /단서 찾기/ }).click()
    await page.getByRole('button', { name: '내려, 선택 안 됨', exact: true }).click()
    await page.getByRole('button', { name: /뜻 확인/ }).click()
    await page.getByRole('radio', { name: /보는 눈/ }).check()
    await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()

    const feedback = page.getByTestId('meaning-feedback')
    const retry = page.getByRole('button', { name: '다시 뜻 고르기', exact: true })
    await expect(feedback).toBeVisible()
    await expect(retry).toBeVisible()
    await expect.poll(async () => page.evaluate(() => {
      const elements = [
        document.querySelector<HTMLElement>('[data-testid="meaning-feedback"]'),
        [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === '다시 뜻 고르기'),
      ]
      if (elements.some((element) => !element)) return false
      const rectangles = elements.map((element) => element!.getBoundingClientRect())
      const viewportWidth = document.documentElement.clientWidth
      const viewportHeight = window.innerHeight
      return document.documentElement.scrollWidth <= viewportWidth && rectangles.every((rect) => (
        rect.left >= 0 && rect.right <= viewportWidth && rect.top >= 0 && rect.bottom <= viewportHeight
      ))
    }), { timeout: 5_000, message: 'feedback and retry must settle fully inside the viewport' }).toBe(true)
    await expect(feedback).toBeInViewport()
    await expect(retry).toBeInViewport()
    await expectNoHorizontalOverflow(page)

    const geometry = await Promise.all([feedback.boundingBox(), retry.boundingBox()])
    for (const [name, box] of [['feedback', geometry[0]], ['retry', geometry[1]] as const]) {
      expect(box, `${name} must have a positive bounding box`).not.toBeNull()
      expect(box!.x, `${name} left containment`).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width, `${name} right containment`).toBeLessThanOrEqual(375)
      expect(box!.y, `${name} top containment`).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height, `${name} bottom containment`).toBeLessThanOrEqual(812)
    }

    await retry.click()
    await expect(page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true })).toBeEnabled()
    await expect(page.getByRole('radio', { name: /보는 눈/ })).toBeChecked()
  })
})
