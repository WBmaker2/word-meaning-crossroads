import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { completeScene, completeWord, startRoute } from './helpers/learnerFlow'
import { FLOW_ANSWERS } from './fixtures/answers'

const FIRST_WORD_REPAIR_LABEL = '내리는 눈 단서'

function clarityLabel(decision: 'still-clear' | 'now-unclear'): string {
  return decision === 'still-clear' ? '여전히 분명해요' : '판단하기 어려워졌어요'
}

async function expectSeriousAndCriticalAxeClean(page: Page, screenName: string): Promise<void> {
  const result = await new AxeBuilder({ page }).analyze()
  const severeViolations = result.violations.filter((item) => item.impact === 'serious' || item.impact === 'critical')
  expect(severeViolations, `${screenName} serious/critical axe violations`).toEqual([])
}

async function expectNoOtherAnnouncement(page: Page, message: string): Promise<void> {
  const duplicateCount = await page.locator('[aria-live], [role="status"], [role="alert"]').evaluateAll(
    (elements, expectedMessage) => elements.filter((element) => {
      if (element.hasAttribute('data-feedback-announcer')) return false
      return element.textContent?.includes(String(expectedMessage)) ?? false
    }).length,
    message,
  )
  expect(duplicateCount, `duplicate live/status/alert message: ${message}`).toBe(0)
}

async function expectSingleAnnouncer(
  page: Page,
  role: 'status' | 'alert',
  live: 'polite' | 'assertive',
): Promise<string> {
  const announcer = page.locator('[data-feedback-announcer]')
  await expect(announcer).toHaveCount(1)
  await expect(announcer).toHaveAttribute('role', role)
  await expect(announcer).toHaveAttribute('aria-live', live)
  await expect(announcer).toHaveAttribute('aria-atomic', 'true')
  await expect(announcer).not.toHaveText('')
  const message = (await announcer.textContent())?.trim() ?? ''
  expect(message).not.toBe('')
  await expectNoOtherAnnouncement(page, message)
  return message
}

async function expectVisuallyHiddenTextNotFocusable(page: Page): Promise<void> {
  const focusableHiddenText = await page.locator('[hidden], .visually-hidden').evaluateAll((roots) => roots.flatMap((root) => [root, ...root.querySelectorAll('*')]).filter((element) => {
    const htmlElement = element as HTMLElement
    const contentEditable = element.getAttribute('contenteditable')
    const naturalFocusable = element.matches('a[href], button, input, select, textarea') ||
      (contentEditable !== null && contentEditable.toLowerCase() !== 'false')
    return element.hasAttribute('tabindex') || htmlElement.tabIndex >= 0 || naturalFocusable
  }).map((element) => element.outerHTML))
  expect(focusableHiddenText, 'hidden roots and all descendants must not be focusable').toEqual([])
}

async function expectTokenContrast(page: Page): Promise<void> {
  const tokenElements = page.locator('mark, .token-choice')
  const tokenCount = await tokenElements.count()
  const tokenContrast = await tokenElements.evaluateAll((elements) => {
    type Color = { red: number; green: number; blue: number; alpha: number }
    const parseColor = (value: string): Color | null => {
      const match = value.match(/^rgba?\(([^)]+)\)$/i)
      if (!match) return null
      const parts = match[1]!.replace(/\s*\/\s*/g, ' ').split(/[,\s]+/).filter(Boolean)
      const parseChannel = (part: string): number => part.endsWith('%') ? Number(part.slice(0, -1)) * 2.55 : Number(part)
      const parseAlpha = (part: string | undefined): number => part === undefined ? 1 : part.endsWith('%') ? Number(part.slice(0, -1)) / 100 : Number(part)
      const color = {
        red: parseChannel(parts[0]!),
        green: parseChannel(parts[1]!),
        blue: parseChannel(parts[2]!),
        alpha: parseAlpha(parts[3]),
      }
      return Object.values(color).every((part) => Number.isFinite(part)) &&
        color.red >= 0 && color.red <= 255 && color.green >= 0 && color.green <= 255 &&
        color.blue >= 0 && color.blue <= 255 && color.alpha >= 0 && color.alpha <= 1 ? color : null
    }
    const composite = (foreground: Color, background: Color): Color => {
      const alpha = foreground.alpha + (background.alpha * (1 - foreground.alpha))
      if (alpha === 0) return { red: 0, green: 0, blue: 0, alpha: 0 }
      return {
        red: ((foreground.red * foreground.alpha) + (background.red * background.alpha * (1 - foreground.alpha))) / alpha,
        green: ((foreground.green * foreground.alpha) + (background.green * background.alpha * (1 - foreground.alpha))) / alpha,
        blue: ((foreground.blue * foreground.alpha) + (background.blue * background.alpha * (1 - foreground.alpha))) / alpha,
        alpha,
      }
    }
    const luminance = (value: Color) => {
      const linear = (channel: number) => {
        const normalized = channel / 255
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      }
      return (0.2126 * linear(value.red)) + (0.7152 * linear(value.green)) + (0.0722 * linear(value.blue))
    }
    const results: Array<{ label: string; ratio?: number; error?: string }> = []
    for (const element of elements) {
      const label = element.getAttribute('aria-label') || element.textContent?.trim() || element.className.toString() || element.tagName.toLowerCase()
      const foreground = parseColor(getComputedStyle(element).color)
      if (!foreground) {
        results.push({ label, error: 'foreground color is not parseable' })
        continue
      }
      let ancestor: Element | null = element
      let background: Color | null = null
      while (ancestor) {
        const candidate = parseColor(getComputedStyle(ancestor).backgroundColor)
        if (!candidate) {
          results.push({ label, error: 'background color is not parseable' })
          background = null
          break
        }
        background = background ? composite(background, candidate) : candidate
        if (background.alpha >= 1) break
        ancestor = ancestor.parentElement
      }
      if (!background || background.alpha < 1) {
        results.push({ label, error: 'background remains transparent' })
        continue
      }
      const effectiveForeground = foreground.alpha < 1 ? composite(foreground, background) : foreground
      if (effectiveForeground.alpha < 1) {
        results.push({ label, error: 'foreground remains transparent' })
        continue
      }
      const lighter = Math.max(luminance(effectiveForeground), luminance(background))
      const darker = Math.min(luminance(effectiveForeground), luminance(background))
      results.push({ label, ratio: (lighter + 0.05) / (darker + 0.05) })
    }
    return results
  })
  expect(tokenContrast, 'every rendered token must return a contrast result').toHaveLength(tokenCount)
  expect(tokenContrast.filter((item) => item.error), 'token contrast must fail closed on parse/compositing errors').toEqual([])
  for (const item of tokenContrast) {
    expect(item.ratio, `${item.label} contrast must meet WCAG AA`).toBeGreaterThanOrEqual(4.5)
  }
}

async function startFirstSceneClue(page: Page): Promise<void> {
  const answer = FLOW_ANSWERS.scenes['nun-snow-01']
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(answer.prediction)
  await page.getByRole('button', { name: /단서 찾기/ }).click()
}

test('checks entrance, context, and the single error announcement with axe', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '오늘의 학습 목표' })).toBeVisible()
  const initialAnnouncer = page.locator('[data-feedback-announcer]')
  await expect(initialAnnouncer).toHaveCount(1)
  await expect(initialAnnouncer).toHaveAttribute('role', 'status')
  await expect(initialAnnouncer).toHaveAttribute('aria-live', 'polite')
  await expectSeriousAndCriticalAxeClean(page, 'entrance')

  await startRoute(page, 'core')
  await expect(page.locator('.progress-header')).toHaveAccessibleName('현재 낱말 1/4 · 장면 1/3')
  await expect(page.locator('.progress-header')).not.toContainText(/%|점수|등급|남은 시간|타이머/)
  const contextHeading = page.getByRole('heading', { level: 2, name: '문장을 읽고 처음 생각을 적어 보아요' })
  await expect(contextHeading).toBeVisible()
  await expect(contextHeading).toHaveAccessibleDescription(/목표 낱말/)
  await expect(page.getByRole('region', { name: /목표 낱말/ })).toBeVisible()
  const target = page.getByTestId('context-sentence').locator('mark[role="group"]')
  await expect(target).toHaveCount(1)
  const targetLabel = await target.getAttribute('aria-label')
  expect(targetLabel).toMatch(/목표 낱말/)
  const targetWord = (await page.locator('#context-target-word').textContent())?.replace(/^목표 낱말:\s*/u, '').trim() ?? ''
  expect(targetWord).not.toBe('')
  await expect(target).toHaveAccessibleName(new RegExp(targetWord))
  await expect(contextHeading).toHaveAccessibleDescription(new RegExp(targetWord))
  const illustration = page.getByTestId('neutral-illustration')
  await expect(illustration).toHaveAttribute('aria-hidden', 'true')
  await expect(illustration).toHaveAttribute('focusable', 'false')
  await expectTokenContrast(page)
  await expectSeriousAndCriticalAxeClean(page, 'context')
  await expectVisuallyHiddenTextNotFocusable(page)

  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill('문장에서 가리키는 뜻')
  await page.getByRole('button', { name: /단서 찾기/ }).click()
  await expectSingleAnnouncer(page, 'status', 'polite')
  const clueTarget = page.locator('.clue-sentence mark[role="group"]')
  await expect(clueTarget).toHaveCount(1)
  await expect(clueTarget).toHaveAccessibleName(new RegExp(targetWord))
  await expectSeriousAndCriticalAxeClean(page, 'clue')

  const clueChoices = page.locator('.token-choice')
  await expect(clueChoices).toHaveCount(6)
  await expectTokenContrast(page)
  const insufficientChoice = page.getByRole('button', { name: /결정 단서가 없어요/ })
  await expect(insufficientChoice).toHaveAttribute('aria-pressed', 'false')
  await expect(insufficientChoice).toHaveAccessibleName(/결정 단서가 없어요.*선택 안 됨/)
  await insufficientChoice.click()
  await expect(insufficientChoice).toHaveAttribute('aria-pressed', 'true')
  await expect(insufficientChoice).toHaveAccessibleName(/결정 단서가 없어요.*선택됨/)
  await insufficientChoice.click()
  await expect(insufficientChoice).toHaveAttribute('aria-pressed', 'false')
  await expect(insufficientChoice).toHaveAccessibleName(/결정 단서가 없어요.*선택 안 됨/)
  await clueChoices.nth(0).click()
  await expect(clueChoices.nth(0)).toHaveAttribute('aria-pressed', 'true')
  await expect(clueChoices.nth(0)).toHaveAccessibleName(/선택됨/)
  await clueChoices.nth(1).click()
  await clueChoices.nth(2).click()
  const errorMessage = await expectSingleAnnouncer(page, 'alert', 'assertive')
  await expectNoOtherAnnouncement(page, errorMessage)
  await expectVisuallyHiddenTextNotFocusable(page)
  await expectSeriousAndCriticalAxeClean(page, 'clue error')
})

test('walks the real learner screens and checks names, legends, order, and record evidence', async ({ page }) => {
  await page.goto('./')
  await startRoute(page, 'core')

  const contextHeading = page.getByRole('heading', { level: 2, name: '문장을 읽고 처음 생각을 적어 보아요' })
  await expect(contextHeading).toHaveAccessibleDescription(/목표 낱말/)
  await expectSeriousAndCriticalAxeClean(page, 'context')
  await startFirstSceneClue(page)

  const clueHeading = page.getByRole('heading', { name: '문장에서 뜻을 알려 주는 단서를 골라 보아요' })
  await expect(clueHeading).toBeVisible()
  await expectSeriousAndCriticalAxeClean(page, 'clue')
  const decisive = page.getByRole('button', { name: /내려, 선택 안 됨/ })
  await decisive.click()
  await page.getByRole('button', { name: /뜻 확인/ }).click()

  const meaningHeading = page.getByRole('heading', { name: '문장 속 뜻을 골라 보아요' })
  await expect(meaningHeading).toBeVisible()
  const meaningGroup = page.getByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' })
  await expect(meaningGroup.locator('legend')).toHaveText('문장 속 뜻은 무엇일까요?')
  await expect(meaningGroup.getByRole('radio')).toHaveCount(3)
  await expectSeriousAndCriticalAxeClean(page, 'meaning')
  await meaningGroup.getByRole('radio', { name: new RegExp(FLOW_ANSWERS.scenes['nun-snow-01'].meaningLabel) }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()
  await expectSingleAnnouncer(page, 'status', 'polite')

  await completeScene(page, 'nun-eye-02')
  const comparisonHeading = page.getByRole('heading', { name: '같은 낱말을 두 문장에서 비교해 보아요' })
  await expect(comparisonHeading).toBeVisible()
  const comparisonCards = page.getByTestId('comparison-scene-card')
  await expect(comparisonCards).toHaveCount(2)
  await expect(comparisonCards.nth(0).getByRole('heading', { name: '첫째 문장' })).toBeVisible()
  await expect(comparisonCards.nth(1).getByRole('heading', { name: '둘째 문장' })).toBeVisible()
  await expect(comparisonCards.nth(0)).toContainText('아침부터')
  await expect(comparisonCards.nth(0)).toContainText(FLOW_ANSWERS.scenes['nun-snow-01'].meaningLabel)
  await expect(comparisonCards.nth(0)).toContainText(FLOW_ANSWERS.scenes['nun-snow-01'].clue.kind === 'tokens' ? FLOW_ANSWERS.scenes['nun-snow-01'].clue.labels[0] : '')
  await expect(comparisonCards.nth(1)).toContainText('민서는')
  await expect(comparisonCards.nth(1)).toContainText(FLOW_ANSWERS.scenes['nun-eye-02'].meaningLabel)
  await expect(comparisonCards.nth(1)).toContainText(FLOW_ANSWERS.scenes['nun-eye-02'].clue.kind === 'tokens' ? FLOW_ANSWERS.scenes['nun-eye-02'].clue.labels[0] : '')
  const comparisonReadingOrder = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.comparison-scene-card')]
    const necessity = document.querySelector('.necessity-challenge')
    if (cards.length !== 2 || !necessity) return null
    return {
      firstBeforeSecond: Boolean(cards[0]!.compareDocumentPosition(cards[1]!) & Node.DOCUMENT_POSITION_FOLLOWING),
      secondBeforeNecessity: Boolean(cards[1]!.compareDocumentPosition(necessity) & Node.DOCUMENT_POSITION_FOLLOWING),
    }
  })
  expect(comparisonReadingOrder, 'comparison cards must precede the necessity challenge in reading order').toEqual({
    firstBeforeSecond: true,
    secondBeforeNecessity: true,
  })
  const necessitySection = page.getByRole('region', { name: '필요 단서를 찾아 보아요' })
  await expect(necessitySection).toContainText('필요 단서를 찾아 보아요')
  await expectSeriousAndCriticalAxeClean(page, 'comparison before hiding cue')
  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await expect(page.getByRole('img', { name: '가린 단서', exact: true })).toHaveAccessibleName('가린 단서')
  const clarityGroup = page.getByRole('group', { name: '가린 뒤 문장의 뜻은 어떠한가요?' })
  await expect(clarityGroup.locator('legend')).toHaveText('가린 뒤 문장의 뜻은 어떠한가요?')
  await expect(clarityGroup.getByRole('radio')).toHaveCount(2)
  await expectVisuallyHiddenTextNotFocusable(page)
  await expectSeriousAndCriticalAxeClean(page, 'comparison after hiding cue')
  await clarityGroup.getByRole('radio', { name: clarityLabel(FLOW_ANSWERS.words.nun.necessityDecision), exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()

  await completeScene(page, 'nun-uncertain-03')
  const repairHeading = page.getByRole('heading', { name: '모호한 문장을 분명하게 고쳐 보아요' })
  await expect(repairHeading).toBeVisible()
  const repairGroup = page.getByRole('group', { name: '문장 정비 방법은 무엇일까요?' })
  await expect(repairGroup.locator('legend')).toHaveText('문장 정비 방법은 무엇일까요?')
  await expect(repairGroup.getByRole('radio')).toHaveCount(2)
  await expectSeriousAndCriticalAxeClean(page, 'sentence repair')
  await repairGroup.getByRole('radio', { name: new RegExp(FIRST_WORD_REPAIR_LABEL) }).check()
  await expect(page.locator('#repair-preview')).not.toHaveText('아직 정비 방법을 고르지 않았어요.')
  const repairMessage = await expectSingleAnnouncer(page, 'status', 'polite')
  await expectNoOtherAnnouncement(page, repairMessage)
  await expectSeriousAndCriticalAxeClean(page, 'sentence repair with preview')
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()

  await completeWord(page, 'bae')
  await completeWord(page, 'bam')
  await completeWord(page, 'mal')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '학습목표' })).toBeVisible()
  const evidenceItems = page.locator('[data-evidence]')
  await expect(evidenceItems).toHaveCount(4)
  const evidenceOrder = await evidenceItems.evaluateAll((items) => items.map((item) => item.getAttribute('data-evidence')))
  expect(evidenceOrder).toEqual([
    'meaning', 'evidence', 'uncertainty', 'clarity',
  ])
  for (const label of ['뜻 구별', '근거 사용', '불확실성 판단', '명확한 표현']) {
    const evidenceItem = evidenceItems.filter({ hasText: label })
    await expect(evidenceItem).toHaveCount(1)
    await expect(evidenceItem.getByText('기록됨', { exact: true })).toHaveCount(1)
  }
  await expectSeriousAndCriticalAxeClean(page, 'record')
})
