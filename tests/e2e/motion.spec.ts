import { expect, test } from '@playwright/test'
import { startRoute } from './helpers/learnerFlow'

async function openPrediction(page: Parameters<typeof startRoute>[0]): Promise<void> {
  await page.goto('./')
  await startRoute(page, 'core')
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill('하늘에서 내리는 것')
}

function channel(value: string): [number, number, number] {
  const match = value.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/)
  if (!match) throw new Error(`Expected an RGB color, received: ${value}`)
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const [red, green, blue] = channel(color).map((value) => value / 255)
    const linear = (value: number) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    return (0.2126 * linear(red!)) + (0.7152 * linear(green!)) + (0.0722 * linear(blue!))
  }
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

function parseStaticShadow(value: string): { offsets: number[]; rgb: number[]; alpha: number } {
  const color = value.match(/rgba?\(([^)]+)\)/i)
  if (!color) throw new Error(`Expected a colored box-shadow, received: ${value}`)
  const colorParts = color[1]!.split(/[,/ ]+/).filter(Boolean).map(Number)
  const offsets = [...value.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]))
  return { offsets, rgb: colorParts.slice(0, 3), alpha: colorParts[3] ?? 1 }
}

test('animates only the two required learner actions', async ({ page }) => {
  await openPrediction(page)

  await expect(page.getByRole('button', { name: /단서 찾기/ })).toHaveCSS('animation-name', 'gi-pulse')
  await expect(page.getByRole('button', { name: /뜻 확인/ })).toHaveCount(0)
  const ordinaryButtons = page.locator('button:not(.gi-pulse)')
  for (let index = 0; index < await ordinaryButtons.count(); index += 1) {
    await expect(ordinaryButtons.nth(index)).toHaveCSS('animation-name', 'none')
  }

  await page.getByRole('button', { name: /단서 찾기/ }).click()
  await expect(page.getByRole('button', { name: /뜻 확인/ })).toHaveCSS('animation-name', 'gi-pulse')
  for (let index = 0; index < await ordinaryButtons.count(); index += 1) {
    await expect(ordinaryButtons.nth(index)).toHaveCSS('animation-name', 'none')
  }
})

test('replaces gi-pulse with a static required-action outline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openPrediction(page)

  const required = page.getByRole('button', { name: /단서 찾기/ })
  await expect(required).toHaveCSS('animation-name', 'none')
  await expect(required).toHaveCSS('outline-width', '3px')
  await expect(required).toContainText('필수')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')
  const shadow = parseStaticShadow(await required.evaluate((element) => getComputedStyle(element).boxShadow))
  expect(shadow.offsets).toEqual([0, 0, 0, 3])
  expect(shadow.rgb).toEqual([244, 162, 97])
  expect(shadow.alpha).toBeCloseTo(0.35, 2)

  const motionValues = await page.locator('body, body *').evaluateAll((elements) =>
    elements.map((element) => {
      const styles = getComputedStyle(element)
      return { animationName: styles.animationName, transitionDuration: styles.transitionDuration }
    }),
  )
  expect(motionValues.every(({ animationName, transitionDuration }) =>
    animationName === 'none' && transitionDuration === '0s')).toBe(true)
})

test('keeps core rendered text and action colors at WCAG AA contrast', async ({ page }) => {
  await openPrediction(page)

  const contrast = await page.evaluate(() => {
    const bodyStyles = getComputedStyle(document.body)
    const required = document.querySelector<HTMLButtonElement>('[data-emphasis="gi-pulse"]')
    if (!required) throw new Error('Required action button is missing')
    const requiredStyles = getComputedStyle(required)
    return {
      bodyForeground: bodyStyles.color,
      canvasBackground: bodyStyles.backgroundColor,
      actionForeground: requiredStyles.color,
      actionBackground: requiredStyles.backgroundColor,
    }
  })

  expect(contrastRatio(contrast.bodyForeground, contrast.canvasBackground)).toBeGreaterThanOrEqual(4.5)
  expect(contrastRatio(contrast.actionForeground, contrast.actionBackground)).toBeGreaterThanOrEqual(4.5)
})
