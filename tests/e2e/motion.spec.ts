import { expect, test } from '@playwright/test'
import { startRoute } from './helpers/learnerFlow'

async function openPrediction(page: Parameters<typeof startRoute>[0]): Promise<void> {
  await page.goto('./')
  await startRoute(page, 'core')
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill('하늘에서 내리는 것')
}

test('animates only the two required learner actions', async ({ page }) => {
  await openPrediction(page)

  await expect(page.getByRole('button', { name: /단서 찾기/ })).toHaveCSS('animation-name', 'gi-pulse')
  await expect(page.getByRole('button', { name: /뜻 확인/ })).toHaveCount(0)
  await expect(page.locator('button:not(.gi-pulse)').first()).toHaveCSS('animation-name', 'none')

  await page.getByRole('button', { name: /단서 찾기/ }).click()
  await expect(page.getByRole('button', { name: /뜻 확인/ })).toHaveCSS('animation-name', 'gi-pulse')
  await expect(page.locator('button:not(.gi-pulse)').first()).toHaveCSS('animation-name', 'none')
})

test('replaces gi-pulse with a static required-action outline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPrediction(page)

  const required = page.getByRole('button', { name: /단서 찾기/ })
  await expect(required).toHaveCSS('animation-name', 'none')
  await expect(required).toHaveCSS('outline-width', '3px')
  await expect(required).toContainText('필수')

  const motionValues = await page.locator('body *').evaluateAll((elements) =>
    elements.map((element) => {
      const styles = getComputedStyle(element)
      return { animationName: styles.animationName, transitionDuration: styles.transitionDuration }
    }),
  )
  expect(motionValues.every(({ animationName, transitionDuration }) =>
    animationName === 'none' && transitionDuration === '0s')).toBe(true)
})
