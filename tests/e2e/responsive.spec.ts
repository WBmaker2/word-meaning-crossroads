import { expect, test, type Locator, type Page } from '@playwright/test'
import { completeScene, completeWord, startRoute } from './helpers/learnerFlow'
import { FLOW_ANSWERS } from './fixtures/answers'

test.use({ viewport: { width: 375, height: 812 } })

test('loads the neutral favicon without a 404 response', async ({ page }) => {
  const faviconConsoleErrors: string[] = []
  const failedFaviconRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /favicon|failed to load resource/i.test(message.text())) {
      faviconConsoleErrors.push(message.text())
    }
  })
  page.on('requestfailed', (request) => {
    if (request.url().endsWith('/favicon.svg')) {
      failedFaviconRequests.push(`${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`)
    }
  })

  await page.goto('./')

  const favicon = page.locator('link[rel="icon"]')
  await expect(favicon).toHaveCount(1)
  await expect(favicon).toHaveAttribute('href', /favicon\.svg$/)
  const [faviconResponse] = await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('/favicon.svg')),
    favicon.evaluate((element) => fetch((element as HTMLLinkElement).href)),
  ])
  expect(faviconResponse.status()).toBe(200)
  expect(faviconResponse.ok()).toBe(true)
  expect(faviconResponse.headers()['content-type']).toMatch(/image\/svg\+xml/)
  expect(await faviconResponse.text()).toContain('<svg')
  expect(faviconConsoleErrors).toEqual([])
  expect(failedFaviconRequests).toEqual([])
})

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(sizes.scroll, `document scrollWidth ${sizes.scroll} exceeds clientWidth ${sizes.client}`).toBeLessThanOrEqual(sizes.client)
}

test('keeps update history outside the entrance card on mobile', async ({ page }) => {
  await page.goto('./')

  const rectangles = await page.evaluate(() => {
    const trigger = document.querySelector<HTMLElement>('.update-history-trigger')
    const entranceCard = document.querySelector<HTMLElement>('.entrance-card')
    if (!trigger || !entranceCard) throw new Error('mobile layout hooks are missing')
    const triggerRect = trigger.getBoundingClientRect()
    const entranceRect = entranceCard.getBoundingClientRect()
    return {
      trigger: { left: triggerRect.left, right: triggerRect.right, top: triggerRect.top, bottom: triggerRect.bottom },
      entrance: { left: entranceRect.left, right: entranceRect.right, top: entranceRect.top, bottom: entranceRect.bottom },
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }
  })

  const intersects = rectangles.trigger.left < rectangles.entrance.right &&
    rectangles.trigger.right > rectangles.entrance.left &&
    rectangles.trigger.top < rectangles.entrance.bottom &&
    rectangles.trigger.bottom > rectangles.entrance.top
  expect(intersects, 'update history must not intersect the entrance card').toBe(false)
  expect(rectangles.scrollWidth).toBeLessThanOrEqual(rectangles.clientWidth)
})

async function expectScreenFits(page: Page): Promise<void> {
  await expectNoHorizontalOverflow(page)
  await expect(page.getByRole('button', { name: '업데이트 내역', exact: true })).toBeVisible()
}

async function expectActionClear(page: Page, primary: Locator): Promise<void> {
  const trigger = page.getByRole('button', { name: '업데이트 내역', exact: true })
  await primary.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight)
    const targetScroll = Math.min(maxScroll, Math.max(0, scrollY + rect.top - ((innerHeight - rect.height) / 2)))
    window.scrollTo({ top: targetScroll, left: 0, behavior: 'instant' })
  })
  await expect(primary).toBeVisible()
  await expect(primary).toBeInViewport()
  await expect(trigger).toBeVisible()
  const boxes = await Promise.all([primary.boundingBox(), trigger.boundingBox()])
  for (const [name, box] of [['primary action', boxes[0]], ['update trigger', boxes[1]] as const]) {
    expect(box, `${name} must have a positive bounding box`).not.toBeNull()
    expect(box!.width, `${name} width`).toBeGreaterThan(0)
    expect(box!.height, `${name} height`).toBeGreaterThan(0)
    expect(box!.x, `${name} left containment`).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, `${name} right containment`).toBeLessThanOrEqual(375)
    if (name === 'primary action') {
      expect(box!.y, `${name} top containment`).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height, `${name} bottom containment`).toBeLessThanOrEqual(812)
    }
  }
  const primaryBox = boxes[0]!
  const triggerBox = boxes[1]!
  const overlaps = triggerBox.x < primaryBox.x + primaryBox.width &&
    triggerBox.x + triggerBox.width > primaryBox.x &&
    triggerBox.y < primaryBox.y + primaryBox.height &&
    triggerBox.y + triggerBox.height > primaryBox.y
  expect(overlaps, 'update trigger must not overlap the explicit current primary action').toBe(false)
}

async function expectRouteCardsStacked(page: Page): Promise<void> {
  const cards = page.locator('[data-route-card]')
  await expect(cards).toHaveCount(3)
  const boxes = await cards.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  }))
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index]!.y, `route card ${index + 1} vertical order`).toBeGreaterThan(boxes[index - 1]!.y + boxes[index - 1]!.height)
    expect(boxes[index]!.x).toBe(boxes[0]!.x)
    expect(boxes[index]!.width).toBe(boxes[0]!.width)
  }
}

async function expectContainedElement(page: Page, element: Locator, name: string): Promise<void> {
  await element.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }))
  await expect(element).toBeVisible()
  await expect(element).toBeInViewport()
  const box = await element.boundingBox()
  expect(box, `${name} must have a positive bounding box`).not.toBeNull()
  expect(box!.width, `${name} width`).toBeGreaterThan(0)
  expect(box!.height, `${name} height`).toBeGreaterThan(0)
  expect(box!.x, `${name} left containment`).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width, `${name} right containment`).toBeLessThanOrEqual(375)
  expect(box!.y, `${name} top containment`).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height, `${name} bottom containment`).toBeLessThanOrEqual(812)
  const scrollSizes = await element.evaluate((node) => ({ scrollHeight: node.scrollHeight, clientHeight: node.clientHeight }))
  expect(scrollSizes.scrollHeight, `${name} must not contain a vertically scrolling region`).toBeLessThanOrEqual(scrollSizes.clientHeight)
  await expectNoHorizontalOverflow(page)
}

async function expectTouchTargets(page: Page): Promise<void> {
  const targets = page.locator('.token-choice, .meaning-choice-card input, .sentence-repair-choice-card input')
  for (let index = 0; index < await targets.count(); index += 1) {
    const box = await targets.nth(index).boundingBox()
    expect(box, `target ${index} should have a box`).not.toBeNull()
    expect(box!.width, `target ${index} width`).toBeGreaterThanOrEqual(44)
    expect(box!.height, `target ${index} height`).toBeGreaterThanOrEqual(44)
  }
}

test('keeps every learner screen usable at 375 by 812', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '오늘의 학습 목표' })).toBeVisible()
  await expectScreenFits(page)
  await expectRouteCardsStacked(page)
  await expect(page.getByRole('button', { name: '기본 길 4개', exact: true })).toBeInViewport()
  await expectActionClear(page, page.getByRole('button', { name: '기본 길 4개', exact: true }))

  await startRoute(page, 'core')
  await expect(page.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectActionClear(page, page.getByRole('button', { name: /단서 찾기/ }))

  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(FLOW_ANSWERS.scenes['nun-snow-01'].prediction)
  await page.getByRole('button', { name: /단서 찾기/ }).click()
  const clueHeading = page.getByRole('heading', { name: '문장에서 뜻을 알려 주는 단서를 골라 보아요' })
  await expect(clueHeading).toBeVisible()
  await expect(clueHeading).toHaveCSS('word-break', 'keep-all')
  await expect(page.getByRole('button', { name: '흰, 선택 안 됨', exact: true })).toHaveCSS('text-decoration-style', 'dotted')
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await expectActionClear(page, page.getByRole('button', { name: /뜻 확인/ }))

  await page.getByRole('button', { name: /내려, 선택 안 됨/ }).click()
  await page.getByRole('button', { name: /뜻 확인/ }).click()
  await expect(page.getByRole('heading', { name: '문장 속 뜻을 골라 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await expectActionClear(page, page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }))

  await page.getByRole('radio', { name: /내리는 눈/ }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
  await expect(page.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectActionClear(page, page.getByRole('button', { name: /단서 찾기/ }))
  await completeScene(page, 'nun-eye-02')
  await expect(page.getByRole('heading', { name: '같은 낱말을 두 문장에서 비교해 보아요' })).toBeVisible()
  await expectScreenFits(page)
  const comparisonCards = page.locator('[data-testid="comparison-scene-card"]')
  await expect(comparisonCards).toHaveCount(2)
  const comparisonBoxes = await comparisonCards.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  }))
  expect(comparisonBoxes[1]!.y).toBeGreaterThan(comparisonBoxes[0]!.y + comparisonBoxes[0]!.height)
  await expectActionClear(page, page.getByRole('button', { name: '단서 하나 가리기', exact: true }))

  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await page.getByRole('radio', { name: '여전히 분명해요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await completeScene(page, 'nun-uncertain-03')
  await expect(page.getByRole('heading', { name: '모호한 문장을 분명하게 고쳐 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await expectActionClear(page, page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }))

  await page.getByRole('radio', { name: /내리는 눈 단서/ }).check()
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()
  await completeWord(page, 'bae')
  await completeWord(page, 'bam')
  await completeWord(page, 'mal')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expectScreenFits(page)
  await expectActionClear(page, page.getByRole('button', { name: '다시 하기', exact: true }))
})

test('has no horizontal overflow at 200 percent text and wide spacing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await page.locator('html').evaluate((element) => { element.style.fontSize = '200%' })
  await page.getByRole('radio', { name: '넓게' }).check()
  await expect(page.getByRole('heading', { name: '오늘의 학습 목표' })).toBeVisible()
  await expectScreenFits(page)
  await expectRouteCardsStacked(page)
  await expectActionClear(page, page.getByRole('button', { name: '기본 길 4개', exact: true }))

  await startRoute(page, 'core')
  await expectScreenFits(page)
  await expectActionClear(page, page.getByRole('button', { name: /단서 찾기/ }))
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(FLOW_ANSWERS.scenes['nun-snow-01'].prediction)
  await page.getByRole('button', { name: /단서 찾기/ }).click()
  const clueButtons = page.locator('.token-choice')
  await clueButtons.nth(0).click()
  await clueButtons.nth(1).click()
  await clueButtons.nth(2).click()
  await expect(page.locator('[data-feedback-announcer]')).toContainText('두 개까지')
  await expectContainedElement(page, page.locator('[data-feedback-announcer]'), 'error feedback')
  await expectScreenFits(page)
  await clueButtons.nth(0).click()
  await clueButtons.nth(1).click()
  await clueButtons.nth(2).click()
  await expectTouchTargets(page)
  await expectActionClear(page, page.getByRole('button', { name: /뜻 확인/ }))
  await page.getByRole('button', { name: /뜻 확인/ }).click()
  await expect(page.getByRole('heading', { name: '문장 속 뜻을 골라 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await expectActionClear(page, page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }))
  await page.getByRole('radio', { name: /내리는 눈/ }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
  await expectActionClear(page, page.getByRole('button', { name: /단서 찾기/ }))
  await completeScene(page, 'nun-eye-02')
  await expectScreenFits(page)

  const cards = page.locator('[data-testid="comparison-scene-card"]')
  await expect(cards).toHaveCount(2)
  const cardBoxes = await cards.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  }))
  expect(cardBoxes[1]!.y).toBeGreaterThan(cardBoxes[0]!.y + cardBoxes[0]!.height)
  await expectScreenFits(page)
  await expectActionClear(page, page.getByRole('button', { name: '단서 하나 가리기', exact: true }))
  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await expectScreenFits(page)

  await page.getByRole('radio', { name: '여전히 분명해요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await completeScene(page, 'nun-uncertain-03')
  await expect(page.getByRole('heading', { name: '모호한 문장을 분명하게 고쳐 보아요' })).toBeVisible()
  await expectTouchTargets(page)
  await expectActionClear(page, page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }))
  await page.getByRole('radio', { name: /내리는 눈 단서/ }).check()
  await expectContainedElement(page, page.locator('#repair-preview'), 'repair preview')
  await expectActionClear(page, page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }))
  await expectScreenFits(page)
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()
  await completeWord(page, 'bae')
  await completeWord(page, 'bam')
  await completeWord(page, 'mal')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expectScreenFits(page)
  await expectActionClear(page, page.getByRole('button', { name: '다시 하기', exact: true }))

  await page.getByRole('button', { name: '업데이트 내역', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '업데이트 내역' })
  await expect(dialog).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expect(dialog).toBeInViewport()
})
