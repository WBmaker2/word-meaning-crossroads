import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const componentsCss = readFileSync(resolve(process.cwd(), 'src/styles/components.css'), 'utf8')

test('keeps shell, layout, illustration, typography, and generic form rules out of components.css', () => {
  const forbiddenSelectors = [
    '.app-shell', '.site-header', '.main-content', '.shared-controls', '.route-list',
    '.comparison-scene-grid', '.history-backdrop', '.progress-header', '.eyebrow',
    '.scene-kicker', '.route-marker', '.neutral-illustration-wrap',
    '.neutral-crossroads-illustration', '.context-sentence', '.clue-sentence',
    '.comparison-sentence', '.token-label', '.accessibility-control', '.privacy-notice',
    'textarea', '#prediction-count', '#prediction-judgement', '.meaning-choice-group',
    '.sentence-repair-choice-group', '.necessity-choice-group', '.record-scenes dl',
  ]
  for (const selector of forbiddenSelectors) {
    expect(componentsCss).not.toContain(selector)
  }
})
