import { expect, test, type Page } from '@playwright/test'
import { completeScene, completeWord, startRoute } from './helpers/learnerFlow'
import { FLOW_ANSWERS } from './fixtures/answers'

test.use({ viewport: { width: 375, height: 812 } })

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }))
  expect(sizes.scroll, `document scrollWidth ${sizes.scroll} exceeds clientWidth ${sizes.client}`).toBeLessThanOrEqual(sizes.client)
}

async function expectScreenFits(page: Page): Promise<void> {
  await expectNoHorizontalOverflow(page)
  await expect(page.getByRole('button', { name: '업데이트 내역', exact: true })).toBeInViewport()
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

async function expectUpdateTriggerClear(page: Page): Promise<void> {
  const trigger = page.getByRole('button', { name: '업데이트 내역', exact: true })
  const primary = page.locator('main button').last()
  const triggerBox = await trigger.boundingBox()
  const primaryBox = await primary.boundingBox()
  expect(triggerBox).not.toBeNull()
  expect(primaryBox).not.toBeNull()
  const overlaps = triggerBox!.x < primaryBox!.x + primaryBox!.width &&
    triggerBox!.x + triggerBox!.width > primaryBox!.x &&
    triggerBox!.y < primaryBox!.y + primaryBox!.height &&
    triggerBox!.y + triggerBox!.height > primaryBox!.y
  expect(overlaps, 'fixed update trigger must not overlap the current primary action').toBe(false)
}

test('keeps every learner screen usable at 375 by 812', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '오늘의 학습 목표' })).toBeVisible()
  await expectScreenFits(page)

  await startRoute(page, 'core')
  await expect(page.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectUpdateTriggerClear(page)

  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(FLOW_ANSWERS.scenes['nun-snow-01'].prediction)
  await page.getByRole('button', { name: /단서 찾기/ }).click()
  await expect(page.getByRole('heading', { name: '문장에서 뜻을 알려 주는 단서를 골라 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await expectUpdateTriggerClear(page)

  await page.getByRole('button', { name: /내려, 선택 안 됨/ }).click()
  await page.getByRole('button', { name: /뜻 확인/ }).click()
  await expect(page.getByRole('heading', { name: '문장 속 뜻을 골라 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await expectUpdateTriggerClear(page)

  await page.getByRole('radio', { name: /내리는 눈/ }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
  await expect(page.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeVisible()
  await expectScreenFits(page)
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
  await expectUpdateTriggerClear(page)

  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await page.getByRole('radio', { name: '여전히 분명해요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await completeScene(page, 'nun-uncertain-03')
  await expect(page.getByRole('heading', { name: '모호한 문장을 분명하게 고쳐 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await expectUpdateTriggerClear(page)

  await page.getByRole('radio', { name: /내리는 눈 단서/ }).check()
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()
  await completeWord(page, 'bae')
  await completeWord(page, 'bam')
  await completeWord(page, 'mal')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expectScreenFits(page)
  await expectUpdateTriggerClear(page)
})

test('has no horizontal overflow at 200 percent text and wide spacing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await page.locator('html').evaluate((element) => { element.style.fontSize = '200%' })
  await page.getByRole('radio', { name: '넓게' }).check()
  await expect(page.getByRole('heading', { name: '오늘의 학습 목표' })).toBeVisible()
  await expectScreenFits(page)

  await startRoute(page, 'core')
  await expectScreenFits(page)
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(FLOW_ANSWERS.scenes['nun-snow-01'].prediction)
  await page.getByRole('button', { name: /단서 찾기/ }).click()
  const clueButtons = page.locator('.token-choice')
  await clueButtons.nth(0).click()
  await clueButtons.nth(1).click()
  await clueButtons.nth(2).click()
  await expect(page.locator('[data-feedback-announcer]')).toContainText('두 개까지')
  await expectScreenFits(page)
  await clueButtons.nth(0).click()
  await clueButtons.nth(1).click()
  await clueButtons.nth(2).click()
  await expectTouchTargets(page)
  await page.getByRole('button', { name: /뜻 확인/ }).click()
  await expect(page.getByRole('heading', { name: '문장 속 뜻을 골라 보아요' })).toBeVisible()
  await expectScreenFits(page)
  await expectTouchTargets(page)
  await page.getByRole('radio', { name: /내리는 눈/ }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
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
  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await expectScreenFits(page)

  await page.getByRole('radio', { name: '여전히 분명해요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await completeScene(page, 'nun-uncertain-03')
  await expect(page.getByRole('heading', { name: '모호한 문장을 분명하게 고쳐 보아요' })).toBeVisible()
  await expectTouchTargets(page)
  await page.getByRole('radio', { name: /내리는 눈 단서/ }).check()
  await expect(page.locator('#repair-preview')).toBeVisible()
  await expectScreenFits(page)
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()
  await completeWord(page, 'bae')
  await completeWord(page, 'bam')
  await completeWord(page, 'mal')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expectScreenFits(page)

  await page.getByRole('button', { name: '업데이트 내역', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '업데이트 내역' })
  await expect(dialog).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expect(dialog).toBeInViewport()
})
