import { expect, test } from '@playwright/test'
import { TEST_ROUTE_WORDS } from './fixtures/answers'
import { completeWord, startRoute, type PreMeaningObserver } from './helpers/learnerFlow'

async function expectCurrentIllustration(page: Parameters<typeof startRoute>[0], wordId: string): Promise<void> {
  const illustration = page.locator('[data-illustration-id]')
  await expect(illustration).toHaveCount(1)
  await expect(illustration).toHaveAttribute('data-illustration-id', `crossroads-${wordId}`)
}

const SENSE_METADATA_TOKENS = [
  'snow', 'eye', 'boat', 'belly', 'pear', 'night', 'chestnut', 'horse', 'speech', 'kick', 'wear', 'fill',
  'leg', 'bridge', 'write', 'bitter', 'close', 'wind', 'wash', 'uncertain',
] as const

function senseMetadataPattern(): RegExp {
  return new RegExp(`(?:^|[-_:])(?:${SENSE_METADATA_TOKENS.join('|')})(?=$|[-_:])`, 'i')
}

test('keeps every pre-meaning context and clue DOM hook answer-neutral on the all route', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('./')
  await startRoute(page, 'all')

  const snapshots: Array<{ kind: 'context' | 'clue'; attributes: string[] }> = []
  const observe: PreMeaningObserver = async (currentPage, phase) => {
    snapshots.push(await currentPage.evaluate((currentPhase) => {
      const selector = currentPhase === 'context' ? 'section.context-card' : 'section.clue-card'
      const section = document.querySelector<HTMLElement>(selector)
      if (!section) throw new Error(`Missing ${currentPhase} section during the learner flow`)
      const elements = [section, ...section.querySelectorAll<HTMLElement>('*')]
      return {
        kind: currentPhase,
        attributes: elements.flatMap((element) =>
          [...element.attributes].map((attribute) => `${attribute.name}=${attribute.value}`),
        ),
      }
    }, phase))
  }

  for (const wordId of TEST_ROUTE_WORDS.all) await completeWord(page, wordId, observe)

  const attributeText = snapshots.flatMap((snapshot) => snapshot.attributes)
  const forbidden = senseMetadataPattern()
  expect(attributeText.filter((attribute) => forbidden.test(attribute)), 'semantic answer metadata leaked into pre-meaning DOM').toEqual([])
  expect(snapshots.filter((snapshot) => snapshot.kind === 'context')).toHaveLength(24)
  expect(snapshots.filter((snapshot) => snapshot.kind === 'clue')).toHaveLength(24)

  for (const snapshot of snapshots) {
    const contextOrder = snapshot.attributes.find((attribute) => attribute.startsWith('data-context-order='))
    expect(contextOrder, `${snapshot.kind} is missing the neutral context order hook`).toMatch(/^data-context-order=[1-3]$/)
    const sentenceOrders = snapshot.attributes.filter((attribute) => attribute.startsWith('data-sentence-order='))
    expect(sentenceOrders.every((attribute) => /^data-sentence-order=[1-3]$/.test(attribute))).toBe(true)
    expect(snapshot.attributes.some((attribute) => attribute.startsWith('data-sentence-id='))).toBe(false)
    expect(snapshot.attributes.some((attribute) => /^data-testid=target-token-/.test(attribute))).toBe(false)
  }
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
})

test('completes the core route with every context illustration hidden', async ({ page }) => {
  await page.goto('./')
  await startRoute(page, 'core')
  await expectCurrentIllustration(page, 'nun')
  await page.addStyleTag({ content: '[data-illustration-id] { display: none !important; }' })

  await page.evaluate(() => {
    const seen = new Set<string>()
    const collect = () => {
      document.querySelectorAll<HTMLElement>('section.context-card[data-context-order]').forEach((context) => {
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
