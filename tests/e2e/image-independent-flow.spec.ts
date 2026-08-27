import { expect, test, type Page } from '@playwright/test'
import type { SceneId, WordId } from '../../src/domain/contentTypes'
import { FLOW_ANSWERS } from './fixtures/answers'
import { completeScene, startRoute } from './helpers/learnerFlow'

const CORE_WORDS = ['nun', 'bae', 'bam', 'mal'] as const satisfies readonly WordId[]

const SCENES_BY_WORD: Readonly<Record<(typeof CORE_WORDS)[number], readonly [SceneId, SceneId, SceneId]>> = {
  nun: ['nun-snow-01', 'nun-eye-02', 'nun-uncertain-03'],
  bae: ['bae-boat-01', 'bae-belly-02', 'bae-pear-03'],
  bam: ['bam-night-01', 'bam-chestnut-02', 'bam-uncertain-03'],
  mal: ['mal-horse-01', 'mal-speech-02', 'mal-uncertain-03'],
}

const REPAIR_LABELS: Readonly<Record<(typeof CORE_WORDS)[number], string>> = {
  nun: '내리는 눈 단서',
  bae: '과일 단서',
  bam: '시간 단서',
  mal: '동물 단서',
}

async function expectCurrentIllustration(page: Page, wordId: WordId): Promise<void> {
  const illustration = page.locator('[data-illustration-id]')
  await expect(illustration).toHaveCount(1)
  await expect(illustration).toHaveAttribute('data-illustration-id', `crossroads-${wordId}`)
}

test('completes the core route with every context illustration hidden', async ({ page }) => {
  await page.goto('./')
  await startRoute(page, 'core')
  await expectCurrentIllustration(page, 'nun')
  await page.addStyleTag({ content: '[data-illustration-id] { display: none !important; }' })

  for (const wordId of CORE_WORDS) {
    const [firstSceneId, secondSceneId, thirdSceneId] = SCENES_BY_WORD[wordId]
    await expectCurrentIllustration(page, wordId)
    await expect(page.locator(`[data-sentence-id="${firstSceneId}:s1"]`)).toBeVisible()
    await completeScene(page, firstSceneId)

    await expectCurrentIllustration(page, wordId)
    await expect(page.locator(`[data-sentence-id="${secondSceneId}:s1"]`)).toBeVisible()
    await completeScene(page, secondSceneId)

    await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
    const necessity = FLOW_ANSWERS.words[wordId].necessityDecision
    await page.getByRole('radio', { name: necessity === 'still-clear' ? '여전히 분명해요' : '판단하기 어려워졌어요', exact: true }).check()
    await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()

    await expectCurrentIllustration(page, wordId)
    await expect(page.locator(`[data-sentence-id="${thirdSceneId}:s1"]`)).toBeVisible()
    await completeScene(page, thirdSceneId)

    await page.getByRole('radio', { name: new RegExp(REPAIR_LABELS[wordId]) }).check()
    await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()
  }

  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
})
