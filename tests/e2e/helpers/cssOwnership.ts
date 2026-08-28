import {
  parseCss,
  parseDeclarations,
  parseNestedRules,
  parseSelectorList,
  type CssRule,
  type ParsedSelector,
} from './cssSyntax'

const OWNED_CLASS_NAMES = new Set([
  'welcome-card',
  'entrance-card',
  'context-card',
  'clue-card',
  'clue-choice-card',
  'meaning-signpost-card',
  'comparison-card',
  'sentence-repair-card',
  'record-card',
  'route-card',
  'meaning-choice-card',
  'sentence-repair-choice-card',
  'clue-decisions',
  'meaning-comparison-panel',
  'necessity-challenge',
  'sentence-repair-alternatives',
  'record-learning-goal',
  'record-evidence',
  'record-necessity',
  'record-repair',
  'required-action-button',
  'required-badge',
  'token-choice',
  'token-underline',
  'meaning-choice-label',
  'selection-status',
  'insufficient-choice--selected',
  'meaning-choice-card--selected',
  'meaning-choice-icon',
  'comparison-word-label',
  'comparison-scene-card',
  'record-word',
  'record-scenes',
  'record-summary',
  'clue-decisions-heading',
  'meaning-feedback-row',
  'meaning-feedback',
  'text-only-reading-notice',
  'history-dialog',
  'restart-dialog',
  'update-history-trigger',
])

const OWNED_ATTRIBUTE_NAMES = new Set(['data-feedback-announcer'])
const OWNED_ELEMENT_NAMES = new Set(['button', 'input', 'li', 'span'])
const SCOPED_DESCENDANT_ELEMENT_NAMES = new Set(['h3', 'p'])

const ALLOWED_PSEUDO_CLASSES = new Set([
  'active',
  'checked',
  'disabled',
  'empty',
  'enabled',
  'first-child',
  'first-of-type',
  'focus',
  'focus-visible',
  'focus-within',
  'has',
  'hover',
  'invalid',
  'is',
  'last-child',
  'last-of-type',
  'link',
  'not',
  'only-child',
  'only-of-type',
  'optional',
  'placeholder-shown',
  'read-only',
  'read-write',
  'required',
  'root',
  'scope',
  'target',
  'valid',
  'visited',
  'where',
])

const ALLOWED_PSEUDO_ELEMENTS = new Set([
  'after',
  'backdrop',
  'before',
  'file-selector-button',
  'marker',
  'placeholder',
  'selection',
])
const SELECTOR_ARGUMENT_PSEUDOS = new Set(['has', 'is', 'not', 'where'])

function isOwnedComponentScopeNode(node: ParsedSelector['nodes'][number]): boolean {
  if (node.kind === 'class') return OWNED_CLASS_NAMES.has(node.name)
  if (node.kind !== 'attribute') return false
  const attribute = node.content.trim().match(/^([-_a-zA-Z][-_a-zA-Z0-9]*)/)?.[1]
  return Boolean(attribute && OWNED_ATTRIBUTE_NAMES.has(attribute))
}

function hasOwnedComponentDescendantScope(selector: ParsedSelector, elementIndex: number): boolean {
  const descendantCombinator = selector.nodes[elementIndex - 1]
  if (descendantCombinator?.kind !== 'combinator' || descendantCombinator.value !== ' ') return false

  for (let index = elementIndex - 2; index >= 0; index -= 1) {
    const node = selector.nodes[index]!
    if (node.kind === 'combinator') return false
    if (isOwnedComponentScopeNode(node)) return true
  }
  return false
}

const ALLOWED_PROPERTIES = new Set([
  'align-items',
  'background',
  'background-color',
  'border',
  'border-color',
  'border-radius',
  'border-width',
  'box-shadow',
  'color',
  'cursor',
  'display',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-wrap',
  'font-size',
  'font-weight',
  'gap',
  'height',
  'justify-content',
  'line-height',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-top',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'overflow',
  'overflow-y',
  'opacity',
  'padding',
  'place-items',
  'text-decoration',
  'text-decoration-thickness',
  'text-underline-offset',
  'vertical-align',
  'white-space',
  'width',
])

const FORBIDDEN_PROPERTIES = new Set([
  'animation',
  'animation-delay',
  'animation-duration',
  'animation-name',
  'animation-timing-function',
  'inset',
  'inset-block',
  'inset-block-end',
  'inset-block-start',
  'inset-inline',
  'inset-inline-end',
  'inset-inline-start',
  'left',
  'position',
  'right',
  'top',
  'bottom',
  'transition',
  'transition-delay',
  'transition-duration',
  'transition-property',
  'transition-timing-function',
])

function selectorOwnershipErrors(selector: ParsedSelector, requireOwnedToken = true): string[] {
  const errors: string[] = []
  let hasOwnedToken = false

  for (const [nodeIndex, node] of selector.nodes.entries()) {
    if (node.kind === 'class') {
      if (!OWNED_CLASS_NAMES.has(node.name)) errors.push(`unowned class selector: ${node.name}`)
      else hasOwnedToken = true
      continue
    }
    if (node.kind === 'id') {
      errors.push(`unowned id selector: ${node.name}`)
      continue
    }
    if (node.kind === 'attribute') {
      const attribute = node.content.trim().match(/^([-_a-zA-Z][-_a-zA-Z0-9]*)/)?.[1]
      if (!attribute || !OWNED_ATTRIBUTE_NAMES.has(attribute)) errors.push(`unowned attribute selector: ${attribute || node.content}`)
      else hasOwnedToken = true
      continue
    }
    if (node.kind === 'element') {
      const isAllowedElement = OWNED_ELEMENT_NAMES.has(node.name) ||
        (SCOPED_DESCENDANT_ELEMENT_NAMES.has(node.name) && hasOwnedComponentDescendantScope(selector, nodeIndex))
      if (!isAllowedElement) errors.push(`unowned element selector: ${node.name}`)
      else hasOwnedToken = true
      continue
    }
    if (node.kind === 'universal') {
      errors.push('unowned universal selector')
      continue
    }
    if (node.kind !== 'pseudo') continue

    const isPseudoElement = ALLOWED_PSEUDO_ELEMENTS.has(node.name)
    const isPseudoClass = ALLOWED_PSEUDO_CLASSES.has(node.name)
    if ((node.colonCount === 2 && !isPseudoElement) || (node.colonCount === 1 && !isPseudoClass && !isPseudoElement)) {
      errors.push(`unknown pseudo selector: ${node.name}`)
      continue
    }
    if (node.colonCount === 2 && isPseudoClass) errors.push(`pseudo-class used as pseudo-element: ${node.name}`)
    if (node.argument !== undefined) {
      if (!SELECTOR_ARGUMENT_PSEUDOS.has(node.name)) {
        errors.push(`unsupported functional pseudo selector: ${node.name}`)
        continue
      }
      const nested = parseSelectorList(node.argument)
      errors.push(...nested.errors)
      for (const nestedSelector of nested.value) errors.push(...selectorOwnershipErrors(nestedSelector, false))
    } else if (SELECTOR_ARGUMENT_PSEUDOS.has(node.name)) {
      errors.push(`functional pseudo requires arguments: ${node.name}`)
    }
  }

  if (requireOwnedToken && !hasOwnedToken) errors.push(`selector has no owned component token: ${selector.source}`)
  return errors
}

function propertyOwnershipErrors(property: string): string[] {
  if (FORBIDDEN_PROPERTIES.has(property) || /^grid-template(?:-|$)/.test(property)) return [`forbidden component property: ${property}`]
  if (!ALLOWED_PROPERTIES.has(property)) return [`unowned component property: ${property}`]
  return []
}

function validateRules(rules: CssRule[], errors: string[]): void {
  for (const rule of rules) {
    if (/^@media\b/i.test(rule.prelude)) {
      if (!rule.prelude.slice('@media'.length).trim()) errors.push('empty media prelude')
      const nested = parseNestedRules(rule.body)
      errors.push(...nested.errors)
      validateRules(nested.value, errors)
      continue
    }
    if (rule.prelude.startsWith('@')) {
      errors.push(`unsupported component at-rule: ${rule.prelude}`)
      continue
    }

    const selectorList = parseSelectorList(rule.prelude)
    errors.push(...selectorList.errors)
    for (const selector of selectorList.value) errors.push(...selectorOwnershipErrors(selector))

    const declarations = parseDeclarations(rule.body)
    errors.push(...declarations.errors)
    for (const declaration of declarations.value) errors.push(...propertyOwnershipErrors(declaration.property))
  }
}

export function componentOwnershipErrors(css: string): string[] {
  const parsed = parseCss(css)
  const errors = [...parsed.errors]
  validateRules(parsed.value, errors)
  return errors
}
