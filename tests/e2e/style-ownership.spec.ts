import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const componentsCss = readFileSync(resolve(process.cwd(), 'src/styles/components.css'), 'utf8')
const layoutCss = readFileSync(resolve(process.cwd(), 'src/styles/layout.css'), 'utf8')
const motionCss = readFileSync(resolve(process.cwd(), 'src/styles/motion.css'), 'utf8')

const COMPONENT_FORBIDDEN_MARKERS = [
  '.app-shell', '.site-header', '.main-content', '.shared-controls', '.route-list',
  '.comparison-scene-grid', '.history-backdrop', '.progress-header', '.eyebrow',
  '.scene-kicker', '.route-marker', '.neutral-illustration-wrap',
  '.neutral-crossroads-illustration', '.context-sentence', '.clue-sentence',
  '.comparison-sentence', '.token-label', '.accessibility-control', '.privacy-notice',
  'textarea', '#prediction-count', '#prediction-judgement', '.meaning-choice-group',
  '.sentence-repair-choice-group', '.necessity-choice-group', '.record-scenes dl',
  '.gi-pulse', '@keyframes', 'animation', 'transition', 'scroll-behavior',
]

function componentOwnershipErrors(css: string): string[] {
  return COMPONENT_FORBIDDEN_MARKERS.filter((marker) => css.includes(marker))
}

function selectors(css: string): string[] {
  return [...css.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)]
    .flatMap((match) => match[1]!.split(',').map((selector) => selector.trim()))
    .filter((selector) => !selector.startsWith('@'))
}

test('keeps shell, layout, illustration, typography, and generic form rules out of components.css', () => {
  expect(componentOwnershipErrors(componentsCss)).toEqual([])
})

test('allows owned responsive component rules but rejects forbidden nested rules', () => {
  const allowedResponsiveComponentCss = '@media (max-width: 48rem) { .clue-choice-card { padding: 1rem; border-radius: 20px; } }'
  expect(componentOwnershipErrors(allowedResponsiveComponentCss)).toEqual([])

  const nestedLayoutCss = '@media (max-width: 48rem) { .main-content { width: 100%; } }'
  expect(componentOwnershipErrors(nestedLayoutCss)).not.toEqual([])

  const nestedMotionCss = '@media (max-width: 48rem) { .clue-choice-card { animation: none; } }'
  expect(componentOwnershipErrors(nestedMotionCss)).not.toEqual([])
})

test('keeps layout selectors limited to shell, grid, width, and fixed update names', () => {
  const approvedSelectors = new Set([
    '.app-shell', '.site-header', '.main-content', '.shared-controls', '.route-list',
    '.comparison-scene-grid', '.update-history-trigger',
  ])
  expect(selectors(layoutCss).every((selector) => approvedSelectors.has(selector))).toBe(true)
  expect(layoutCss).not.toMatch(/animation|transition|box-shadow|border-radius|color:\s|background:\s/)
})

test('keeps motion.css limited to the required animation contract', () => {
  expect(motionCss).toContain('@keyframes gi-pulse')
  expect(motionCss).toContain('@media (prefers-reduced-motion: reduce)')
  expect(motionCss).toContain('.gi-pulse')
  expect(motionCss).toMatch(/animation|outline|box-shadow|scroll-behavior|transition-duration/)
  expect(motionCss).not.toMatch(/color\s*:|background\s*:|font(?:-family|-size|-weight)?\s*:|padding\s*:|margin\s*:|(?:min-)?width\s*:|(?:min-)?height\s*:|border-radius\s*:/)
  const forbiddenComponentSelectors = [
    '.app-shell', '.site-header', '.main-content', '.shared-controls', '.route-list',
    '.comparison-scene-grid', '.update-history-trigger', '.welcome-card', '.route-card',
    '.meaning-choice-card', '.record-card', 'button', 'textarea', '[data-feedback-announcer]',
  ]
  for (const selector of forbiddenComponentSelectors) expect(motionCss).not.toContain(selector)
})
