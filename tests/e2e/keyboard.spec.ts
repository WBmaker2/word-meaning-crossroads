import { expect, test, type Locator, type Page } from '@playwright/test'
import { completeRoute } from './helpers/learnerFlow'

async function tabUntilFocused(page: Page, target: Locator, limit = 80): Promise<void> {
  for (let index = 0; index < limit; index += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`Could not reach ${await target.getAttribute('aria-label') ?? await target.textContent()}`)
}

async function expectFocusedHeading(page: Page, name: string): Promise<Locator> {
  const heading = page.getByRole('heading', { level: 2, name })
  await expect(heading).toBeFocused()
  await expect(page.getByRole('heading', { level: 1, name: '낱말 뜻 갈림길' })).not.toBeFocused()
  return heading
}

test('completes the first core word with keyboard-only learner actions', async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => {
    const violations: string[] = []
    document.addEventListener('focusin', (event) => {
      const target = event.target
      if (target instanceof Element && (target.matches('[hidden], svg') || target.closest('[hidden], svg'))) {
        violations.push(target.tagName.toLowerCase())
      }
      document.documentElement.dataset.keyboardFocusViolations = JSON.stringify(violations)
    })
  })

  const skipLink = page.getByRole('link', { name: '본문으로 건너뛰기' })
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  const historyTrigger = page.getByRole('button', { name: '업데이트 내역', exact: true })
  await page.keyboard.press('Shift+Tab')
  await expect(historyTrigger).toBeFocused()
  await page.keyboard.press('Enter')
  const historyDialog = page.getByRole('dialog', { name: '업데이트 내역' })
  await expect(historyDialog.getByRole('button', { name: '닫기' })).toBeFocused()
  await expect(page.locator('.app-shell')).toHaveAttribute('inert', '')
  await page.keyboard.press('Escape')
  await expect(historyDialog).toBeHidden()
  await expect(historyTrigger).toBeFocused()

  const coreRoute = page.getByRole('button', { name: '기본 길 4개', exact: true })
  await tabUntilFocused(page, coreRoute)
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장을 읽고 처음 생각을 적어 보아요')

  await page.keyboard.press('Tab')
  await page.keyboard.type('하늘에서 내리는 것')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /단서 찾기/ })).toBeFocused()
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장에서 뜻을 알려 주는 단서를 골라 보아요')

  const firstClue = page.getByRole('button', { name: /^아침부터,/ })
  const secondClue = page.getByRole('button', { name: /^흰,/ })
  await page.keyboard.press('Tab')
  await expect(firstClue).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(secondClue).toBeFocused()
  await expect(firstClue).toHaveAttribute('aria-pressed', 'true')

  const decisiveClue = page.getByRole('button', { name: /^내려,/ })
  await page.keyboard.press('Tab')
  await expect(decisiveClue).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(decisiveClue).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /뜻 확인/ })).toBeFocused()
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장 속 뜻을 골라 보아요')

  const meaningRadios = page.getByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' }).getByRole('radio')
  await page.keyboard.press('Tab')
  await expect(meaningRadios.nth(0)).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(meaningRadios.nth(1)).toBeChecked()
  await page.keyboard.press('ArrowUp')
  await expect(meaningRadios.nth(0)).toBeChecked()
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장을 읽고 처음 생각을 적어 보아요')

  await page.keyboard.press('Tab')
  await page.keyboard.type('보는 몸의 부분')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장에서 뜻을 알려 주는 단서를 골라 보아요')

  const eyeDecisiveClue = page.getByRole('button', { name: '보았습니다., 선택 안 됨' })
  await tabUntilFocused(page, eyeDecisiveClue)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장 속 뜻을 골라 보아요')

  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '같은 낱말을 두 문장에서 비교해 보아요')

  const hideCue = page.getByRole('button', { name: '단서 하나 가리기', exact: true })
  await page.keyboard.press('Tab')
  await expect(hideCue).toBeFocused()
  await page.keyboard.press('Enter')
  const clarityRadios = page.getByRole('group', { name: '가린 뒤 문장의 뜻은 어떠한가요?' }).getByRole('radio')
  await expect(clarityRadios.nth(0)).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장을 읽고 처음 생각을 적어 보아요')

  await page.keyboard.press('Tab')
  await page.keyboard.type('잘 모르겠어요')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장에서 뜻을 알려 주는 단서를 골라 보아요')

  const insufficient = page.getByRole('button', { name: /결정 단서가 없어요/ })
  await tabUntilFocused(page, insufficient)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /뜻 확인/ })).toBeFocused()
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장 속 뜻을 골라 보아요')

  await page.keyboard.press('Tab')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '모호한 문장을 분명하게 고쳐 보아요')

  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await expect(page.getByRole('radio', { name: /내리는 눈 단서/ })).toBeChecked()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expectFocusedHeading(page, '문장을 읽고 처음 생각을 적어 보아요')
  await expect(page.getByText('현재 낱말 2/4')).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(document.documentElement.dataset.keyboardFocusViolations ?? '[]'))).toEqual([])
})

test('opens and closes update history with a keyboard modal boundary', async ({ page }) => {
  await page.goto('./')
  const trigger = page.getByRole('button', { name: '업데이트 내역', exact: true })
  await tabUntilFocused(page, trigger)
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: '업데이트 내역' })
  const close = dialog.getByRole('button', { name: '닫기' })
  await expect(dialog).toBeVisible()
  await expect(close).toBeFocused()
  await expect(page.locator('.app-shell')).toHaveAttribute('inert', '')
  await expect(page.locator('.app-shell')).toHaveAttribute('aria-hidden', 'true')
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.locator('.app-shell')).not.toHaveAttribute('inert')
  await expect(page.locator('.app-shell')).not.toHaveAttribute('aria-hidden')

  await page.keyboard.press('Enter')
  await expect(close).toBeFocused()
  await expect(page.locator('.app-shell')).toHaveAttribute('aria-hidden', 'true')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.locator('.app-shell')).not.toHaveAttribute('aria-hidden')
})

test('opens and cancels the restart dialog from the record with keyboard actions', async ({ page }) => {
  await page.goto('./')
  await completeRoute(page, 'core')

  const trigger = page.getByRole('button', { name: '다시 하기', exact: true })
  await tabUntilFocused(page, trigger)
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: '응답을 지우고 다시 할까요?' })
  const cancel = dialog.getByRole('button', { name: '취소' })
  const confirm = dialog.getByRole('button', { name: '응답 지우기' })
  await expect(cancel).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(confirm).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(cancel).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
})
