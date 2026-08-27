import { expect, test } from '@playwright/test'
import { TEST_ROUTE_WORDS } from './fixtures/answers'
import { completeWord, startRoute } from './helpers/learnerFlow'

async function expectCurrentIllustration(page: Parameters<typeof startRoute>[0], wordId: string): Promise<void> {
  const illustration = page.locator('[data-illustration-id]')
  await expect(illustration).toHaveCount(1)
  await expect(illustration).toHaveAttribute('data-illustration-id', `crossroads-${wordId}`)
}

test('completes the core route with every context illustration hidden', async ({ page }) => {
  await page.goto('./')
  await startRoute(page, 'core')
  await expectCurrentIllustration(page, 'nun')
  await page.addStyleTag({ content: '[data-illustration-id] { display: none !important; }' })

  await page.evaluate(() => {
    const seen = new Set<string>()
    const collect = () => {
      document.querySelectorAll<HTMLElement>('[data-context-order]').forEach((context) => {
        const illustrations = context.querySelectorAll<HTMLElement>('[data-illustration-id]')
        const illustrationId = illustrations[0]?.dataset.illustrationId ?? ''
        seen.add(`${illustrationId}|${context.dataset.contextOrder}|${illustrations.length}`)
      })
      document.documentElement.dataset.seenContextIllustrations = JSON.stringify([...seen])
    }
    new MutationObserver(collect).observe(document.body, { childList: true, subtree: true, attributes: true })
    collect()
  })

  for (const wordId of TEST_ROUTE_WORDS.core) {
    await expectCurrentIllustration(page, wordId)
    await completeWord(page, wordId)
  }

  const expectedTriples = TEST_ROUTE_WORDS.core.flatMap((wordId) => ([1, 2, 3] as const)
    .map((order) => `crossroads-${wordId}|${order}|1`))
  const seenTriples = await page.evaluate(() => JSON.parse(document.documentElement.dataset.seenContextIllustrations ?? '[]') as string[])
  expect(seenTriples).toHaveLength(12)
  expect(new Set(seenTriples)).toEqual(new Set(expectedTriples))

  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
})
