import { expect, test } from '@playwright/test'
import { completeRoute } from './helpers/learnerFlow'

test('prints only the learning evidence record', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => document.body.setAttribute('data-print-called', 'true')
  })
  await page.goto('./')
  await completeRoute(page, 'core')
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  const wordHeadings = page.getByRole('heading', { level: 4 })
  await expect(wordHeadings).toHaveText(['1. 눈', '2. 배', '3. 밤', '4. 말'])
  for (let index = 0; index < 4; index += 1) await expect(wordHeadings.nth(index)).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByText(/URL|브라우저 주소|주소 표시줄/)).toHaveCount(0)
  await page.getByRole('button', { name: '인쇄하기', exact: true }).click()
  await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true')
  await page.getByRole('button', { name: '업데이트 내역', exact: true }).click()

  await page.emulateMedia({ media: 'print' })
  await expect(page.getByRole('heading', { name: '탐사 기록' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '학습목표' })).toBeVisible()
  await expect(page.getByText('뜻 구별', { exact: true })).toBeVisible()
  await expect(page.getByText('근거 사용', { exact: true })).toBeVisible()
  await expect(page.getByText('불확실성 판단', { exact: true })).toBeVisible()
  await expect(page.getByText('명확한 표현', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '응답 기록' })).toBeVisible()
  await expect(page.getByRole('button', { name: '다시 하기', exact: true })).toBeHidden()
  await expect(page.getByRole('button', { name: '입구로 돌아가기', exact: true })).toBeHidden()
  await expect(page.getByRole('button', { name: '인쇄하기', exact: true })).toBeHidden()
  await expect(page.getByRole('button', { name: '업데이트 내역', exact: true })).toBeHidden()
  await expect(page.getByRole('dialog', { name: '업데이트 내역' })).toBeHidden()
  await expect(page.getByText(/점수|정답률|등급|순위|소요 시간|학생 이름/)).toHaveCount(0)
})
