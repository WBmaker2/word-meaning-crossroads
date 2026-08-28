import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { componentOwnershipErrors } from './helpers/cssOwnership'

const componentsCss = readFileSync(resolve(process.cwd(), 'src/styles/components.css'), 'utf8')
const layoutCss = readFileSync(resolve(process.cwd(), 'src/styles/layout.css'), 'utf8')
const motionCss = readFileSync(resolve(process.cwd(), 'src/styles/motion.css'), 'utf8')

function selectors(css: string): string[] {
  return [...css.replaceAll(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)]
    .flatMap((match) => match[1]!.split(',').map((selector) => selector.trim()))
    .filter((selector) => !selector.startsWith('@'))
}

test('rejects unowned selectors and layout properties even when names are not denylisted', () => {
  const cases = [
    '.record-grid { display: grid; }',
    'p { margin: 0; }',
    'h3 { margin: 0; }',
    '.record-summary + p { margin: 0; }',
    'p + .record-summary { margin: 0; }',
    '.record-summary ~ h3 { margin: 0; }',
    'p > .record-summary { margin: 0; }',
    '.record-summary > p { margin: 0; }',
    '.clue-decisions-heading > h3 { margin: 0; }',
    '.record-summary .inner p { margin: 0; }',
    '[data-record-root] { padding: 1rem; }',
    '@media (max-width: 48rem) { .main-content { width: 100%; } }',
    '@media (max-width: 48rem) { .clue-choice-card { animation: none; } }',
    '@media (max-width: 48rem) { .clue-choice-card { position: relative; } }',
    '@media (max-width: 48rem) { .clue-choice-card { grid-template-columns: 1fr; } }',
  ]

  for (const css of cases) expect(componentOwnershipErrors(css)).not.toEqual([])
})

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

test('fails closed for malformed rules and unsupported at-rules', () => {
  expect(componentOwnershipErrors('.clue-choice-card { padding: 1rem;')).not.toEqual([])
  expect(componentOwnershipErrors('@supports (display: grid) { .clue-choice-card { display: grid; } }')).not.toEqual([])
  expect(componentOwnershipErrors('/* unclosed comment')).not.toEqual([])
})

test('fails closed for malformed pseudo selectors and declaration values', () => {
  const malformedCases = [
    '.clue-card: { padding: 1rem; }',
    '.clue-card:not() { padding: 1rem; }',
    '.clue-card { padding:; }',
    '.clue-card { padding: 1rem) (x); }',
    '.clue-card:unknown { padding: 1rem; }',
    '.clue-card:not(.clue-card { padding: 1rem; }',
    '.clue-card { padding: 1rem]; }',
    '.clue-card { padding: calc(1rem; }',
    '.clue-card { padding: /* only a comment */ ; }',
  ]

  for (const css of malformedCases) {
    expect(componentOwnershipErrors(css), css).not.toEqual([])
  }
})

test('accepts the current component pseudo selectors and function values', () => {
  const validCss = `
    [data-feedback-announcer]:empty { min-height: 0; }
    button:hover:not(:disabled), button:focus-visible:not(:disabled) {
      color: var(--card);
      background: rgb(244 162 97 / 45%);
    }
    button:disabled { opacity: 0.55; }
    .sentence-repair-choice-card:has(input:checked) {
      box-shadow: inset 0 0 0 3px var(--soft-success);
    }
    .clue-card { padding: clamp(1.25rem, 4vw, 2.5rem); }
    .clue-card { background: url("data:image/svg+xml;utf8,<svg>{}</svg>"); }
    [data-feedback-announcer="status:ready"] { color: var(--color-success); }
  `

  expect(componentOwnershipErrors(validCss)).toEqual([])
})

test('keeps layout selectors limited to shell, grid, width, and fixed update names', () => {
  const approvedSelectors = new Set([
    '.app-shell', '.site-header', '.site-heading', '.main-content', '.shared-controls', '.route-list',
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
