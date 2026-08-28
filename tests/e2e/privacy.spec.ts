import { expect, test, type Page } from '@playwright/test'
import { FLOW_ANSWERS } from './fixtures/answers'
import { completeRoute, completeScene, completeWord, startRoute } from './helpers/learnerFlow'

const LOCAL_ORIGIN = 'http://127.0.0.1:4173'
const HTML_LIKE_PREDICTION = '<img src=x onerror=alert(1)>'
const IDENTITY_FIELD_PATTERN = /이름|학번|학생번호|반|학교|이메일|전자우편|email|student|school|class/i

async function expectEmptyPrivacySurface(page: Page): Promise<void> {
  const storage = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    indexedDb: (await indexedDB.databases()).length,
    cookie: document.cookie,
  }))
  expect(storage).toEqual({ local: 0, session: 0, indexedDb: 0, cookie: '' })

  const controlMetadata = await page.locator('input, textarea, select').evaluateAll((elements) => elements.map((element) => {
    const id = element.getAttribute('id')
    const associatedLabel = id
      ? [...document.querySelectorAll('label')].find((label) => label.htmlFor === id)?.textContent
      : element.closest('label')?.textContent
    return [
      element.getAttribute('aria-label'),
      element.getAttribute('placeholder'),
      element.getAttribute('name'),
      element.getAttribute('autocomplete'),
      associatedLabel,
    ].filter(Boolean).join(' ')
  }))
  expect(controlMetadata.filter((metadata) => IDENTITY_FIELD_PATTERN.test(metadata)), 'identifying fields must not be requested').toEqual([])
}

async function completeFirstWordAfterCustomFirstScene(page: Page): Promise<void> {
  const nunAnswers = FLOW_ANSWERS.scenes
  await page.getByRole('textbox', { name: /처음에는 어떤 뜻/ }).fill(HTML_LIKE_PREDICTION)
  await page.getByRole('button', { name: /단서 찾기/ }).click()
  await page.getByRole('button', { name: /내려, 선택 안 됨/ }).click()
  await page.getByRole('button', { name: /뜻 확인/ }).click()
  await page.getByRole('radio', { name: new RegExp(nunAnswers['nun-snow-01'].meaningLabel) }).check()
  await page.getByRole('button', { name: '선택한 뜻 결정하기', exact: true }).click()

  await completeScene(page, 'nun-eye-02')
  await page.getByRole('button', { name: '단서 하나 가리기', exact: true }).click()
  await page.getByRole('radio', { name: '여전히 분명해요', exact: true }).check()
  await page.getByRole('button', { name: '판단 확인하기', exact: true }).click()
  await completeScene(page, 'nun-uncertain-03')
  await page.getByRole('radio', { name: /내리는 눈 단서/ }).check()
  await page.getByRole('button', { name: '문장을 분명하게 만들기', exact: true }).click()
}

test('keeps the complete core route local and leaves no privacy-sensitive state', async ({ page }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== LOCAL_ORIGIN) externalRequests.push(request.url())
  })

  await page.goto('./')
  await expectEmptyPrivacySurface(page)
  await completeRoute(page, 'core')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expectEmptyPrivacySurface(page)
  expect(externalRequests, 'the complete core route must not contact an external origin').toEqual([])
})

test('completes the core route with every audio MP3 request blocked', async ({ page }) => {
  const blockedAudioRequests: string[] = []
  const externalRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== LOCAL_ORIGIN) externalRequests.push(request.url())
  })
  await page.route('**/*.mp3', async (route) => {
    blockedAudioRequests.push(route.request().url())
    await route.abort()
  })

  await page.goto('./')
  await startRoute(page, 'core')
  await expect(page.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeVisible()
  await expect(page.getByTestId('context-sentence')).toBeVisible()
  await expectEmptyPrivacySurface(page)
  for (const wordId of ['nun', 'bae', 'bam', 'mal'] as const) await completeWord(page, wordId)

  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  expect(blockedAudioRequests).toHaveLength(0)
  expect(externalRequests, 'the audio-blocked route must not contact an external origin').toEqual([])
  await expectEmptyPrivacySurface(page)
})

test('removes the first prediction from the DOM and derived record after restart', async ({ page }) => {
  const firstPrediction = FLOW_ANSWERS.scenes['nun-snow-01'].prediction
  await page.goto('./')
  await completeRoute(page, 'core')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expect(page.getByText(firstPrediction, { exact: true })).toHaveCount(1)

  await page.getByRole('button', { name: '다시 하기', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '응답을 지우고 다시 할까요?' })
  await dialog.getByRole('button', { name: '응답 지우기' }).click()

  await expect(page.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeVisible()
  await expect(page.locator('[data-record-root]')).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: /처음에는 어떤 뜻/ })).toHaveValue('')
  await expect(page.locator('body')).not.toContainText(firstPrediction)
})

test('renders an HTML-like prediction as text without executable markup', async ({ page }) => {
  let dialogCount = 0
  page.on('dialog', async (dialog) => {
    dialogCount += 1
    await dialog.dismiss()
  })

  await page.goto('./')
  await startRoute(page, 'core')
  await completeFirstWordAfterCustomFirstScene(page)
  await completeWord(page, 'bae')
  await completeWord(page, 'bam')
  await completeWord(page, 'mal')

  const record = page.locator('[data-record-root]')
  await expect(record).toBeVisible()
  await expect(record.getByText(HTML_LIKE_PREDICTION, { exact: true })).toHaveCount(1)
  await expect(record.locator('img, iframe, object, embed, [onerror], [onclick], [onload], a[href^="javascript:"]')).toHaveCount(0)
  expect(dialogCount, 'HTML-like input must not execute an event handler').toBe(0)
})
