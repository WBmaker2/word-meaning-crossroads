type CssRule = {
  prelude: string
  body: string
}

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
  'history-dialog',
  'restart-dialog',
  'update-history-trigger',
])

const OWNED_ATTRIBUTE_NAMES = new Set(['data-feedback-announcer'])
const OWNED_ELEMENT_NAMES = new Set(['button', 'input', 'li', 'span'])

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

const EXPLICITLY_FORBIDDEN_PROPERTIES = new Set([
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

function stripCssComments(css: string): { css: string; errors: string[] } {
  const output: string[] = []
  const errors: string[] = []
  let quote: '"' | "'" | null = null

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index]!
    if (quote) {
      output.push(character)
      if (character === '\\' && index + 1 < css.length) {
        output.push(css[index + 1]!)
        index += 1
      } else if (character === quote) {
        quote = null
      }
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      output.push(character)
      continue
    }

    if (character === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2)
      if (end < 0) {
        errors.push('unclosed CSS comment')
        break
      }
      output.push(' ')
      index = end + 1
      continue
    }

    output.push(character)
  }

  if (quote) errors.push('unclosed CSS string')
  return { css: output.join(''), errors }
}

function readBalancedBlock(css: string, openingIndex: number): { body: string; nextIndex: number } | null {
  let depth = 1
  let quote: '"' | "'" | null = null

  for (let index = openingIndex + 1; index < css.length; index += 1) {
    const character = css[index]!
    if (quote) {
      if (character === '\\') index += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '{') depth += 1
    if (character === '}') {
      depth -= 1
      if (depth === 0) return { body: css.slice(openingIndex + 1, index), nextIndex: index + 1 }
    }
  }

  return null
}

function parseRules(css: string): { rules: CssRule[]; errors: string[] } {
  const rules: CssRule[] = []
  const errors: string[] = []
  let segmentStart = 0
  let quote: '"' | "'" | null = null
  let parentheses = 0
  let brackets = 0

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index]!
    if (quote) {
      if (character === '\\') index += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '(') parentheses += 1
    else if (character === ')') {
      parentheses -= 1
      if (parentheses < 0) errors.push('unbalanced selector parentheses')
    } else if (character === '[') brackets += 1
    else if (character === ']') {
      brackets -= 1
      if (brackets < 0) errors.push('unbalanced selector brackets')
    }

    if (parentheses || brackets) continue
    if (character === ';') {
      if (css.slice(segmentStart, index).trim()) errors.push('unsupported statement')
      segmentStart = index + 1
      continue
    }
    if (character === '}') {
      errors.push('unexpected closing brace')
      continue
    }
    if (character !== '{') continue

    const prelude = css.slice(segmentStart, index).trim()
    if (!prelude) errors.push('rule is missing a selector')
    const balanced = readBalancedBlock(css, index)
    if (!balanced) {
      errors.push('unbalanced rule block')
      break
    }
    rules.push({ prelude, body: balanced.body })
    index = balanced.nextIndex - 1
    segmentStart = balanced.nextIndex
  }

  if (quote) errors.push('unclosed CSS string')
  if (parentheses || brackets) errors.push('unbalanced selector delimiters')
  if (css.slice(segmentStart).trim()) errors.push('unclosed rule or unsupported statement')
  return { rules, errors }
}

function splitSelectorList(prelude: string): { selectors: string[]; errors: string[] } {
  const selectors: string[] = []
  const errors: string[] = []
  let start = 0
  let quote: '"' | "'" | null = null
  let parentheses = 0
  let brackets = 0

  for (let index = 0; index < prelude.length; index += 1) {
    const character = prelude[index]!
    if (quote) {
      if (character === '\\') index += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '(') parentheses += 1
    else if (character === ')') parentheses -= 1
    else if (character === '[') brackets += 1
    else if (character === ']') brackets -= 1
    else if (character === ',' && parentheses === 0 && brackets === 0) {
      selectors.push(prelude.slice(start, index).trim())
      start = index + 1
    }
    if (parentheses < 0 || brackets < 0) errors.push('unbalanced selector delimiters')
  }

  selectors.push(prelude.slice(start).trim())
  if (quote || parentheses || brackets) errors.push('unbalanced selector delimiters')
  if (selectors.some((selector) => !selector)) errors.push('empty selector in selector list')
  return { selectors, errors }
}

function readIdentifier(value: string, start: number): { identifier: string; nextIndex: number } {
  let index = start
  while (index < value.length && /[-_a-zA-Z0-9]/.test(value[index]!)) index += 1
  return { identifier: value.slice(start, index), nextIndex: index }
}

function findClosingDelimiter(value: string, openingIndex: number, opening: string, closing: string): number {
  let depth = 1
  let quote: '"' | "'" | null = null
  for (let index = openingIndex + 1; index < value.length; index += 1) {
    const character = value[index]!
    if (quote) {
      if (character === '\\') index += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === opening) depth += 1
    else if (character === closing) {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

function selectorOwnershipErrors(selector: string, requireOwnedToken = true): string[] {
  const errors: string[] = []
  let index = 0
  let hasOwnedToken = false

  while (index < selector.length) {
    const character = selector[index]!
    if (/\s/.test(character) || character === '>' || character === '+' || character === '~' || character === '*') {
      index += 1
      continue
    }
    if (character === '.') {
      const identifier = readIdentifier(selector, index + 1)
      if (!identifier.identifier || !OWNED_CLASS_NAMES.has(identifier.identifier)) {
        errors.push(`unowned class selector: ${identifier.identifier || selector}`)
      } else hasOwnedToken = true
      index = identifier.nextIndex
      continue
    }
    if (character === '#') {
      errors.push(`unowned id selector: ${selector}`)
      const identifier = readIdentifier(selector, index + 1)
      index = identifier.nextIndex
      continue
    }
    if (character === '[') {
      const closingIndex = findClosingDelimiter(selector, index, '[', ']')
      if (closingIndex < 0) {
        errors.push('unbalanced attribute selector')
        break
      }
      const attribute = selector.slice(index + 1, closingIndex).trim().match(/^([-_a-zA-Z][-_a-zA-Z0-9]*)/)?.[1]
      if (!attribute || !OWNED_ATTRIBUTE_NAMES.has(attribute)) errors.push(`unowned attribute selector: ${attribute || selector}`)
      else hasOwnedToken = true
      index = closingIndex + 1
      continue
    }
    if (character === ':') {
      index += selector[index + 1] === ':' ? 1 : 0
      const pseudo = readIdentifier(selector, index + 1)
      index = pseudo.nextIndex
      if (selector[index] === '(') {
        const closingIndex = findClosingDelimiter(selector, index, '(', ')')
        if (closingIndex < 0) {
          errors.push('unbalanced pseudo-class')
          break
        }
        errors.push(...selectorOwnershipErrors(selector.slice(index + 1, closingIndex), false))
        index = closingIndex + 1
      }
      continue
    }
    if (/[-_a-zA-Z]/.test(character)) {
      const identifier = readIdentifier(selector, index)
      if (!OWNED_ELEMENT_NAMES.has(identifier.identifier)) errors.push(`unowned element selector: ${identifier.identifier}`)
      else hasOwnedToken = true
      index = identifier.nextIndex
      continue
    }
    errors.push(`unsupported selector token: ${character}`)
    index += 1
  }

  if (requireOwnedToken && !hasOwnedToken) errors.push(`selector has no owned component token: ${selector}`)
  return errors
}

function declarationPropertyNames(body: string): { properties: string[]; errors: string[] } {
  const properties: string[] = []
  const errors: string[] = []
  let segmentStart = 0
  let quote: '"' | "'" | null = null
  let parentheses = 0
  let brackets = 0

  const consume = (segment: string) => {
    const trimmed = segment.trim()
    if (!trimmed) return
    let colon = -1
    quote = null
    parentheses = 0
    brackets = 0
    for (let index = 0; index < trimmed.length; index += 1) {
      const character = trimmed[index]!
      if (quote) {
        if (character === '\\') index += 1
        else if (character === quote) quote = null
        continue
      }
      if (character === '"' || character === "'") quote = character
      else if (character === '(') parentheses += 1
      else if (character === ')') parentheses -= 1
      else if (character === '[') brackets += 1
      else if (character === ']') brackets -= 1
      else if (character === ':' && parentheses === 0 && brackets === 0) {
        colon = index
        break
      }
    }
    if (colon < 0) {
      errors.push(`malformed declaration: ${trimmed}`)
      return
    }
    const property = trimmed.slice(0, colon).trim().toLowerCase()
    if (!/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(property)) {
      errors.push(`invalid declaration property: ${property}`)
      return
    }
    properties.push(property)
    if (EXPLICITLY_FORBIDDEN_PROPERTIES.has(property)) errors.push(`forbidden component property: ${property}`)
    else if (/^grid-template(?:-|$)/.test(property)) errors.push(`forbidden component property: ${property}`)
    else if (!ALLOWED_PROPERTIES.has(property)) errors.push(`unowned component property: ${property}`)
  }

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index]!
    if (quote) {
      if (character === '\\') index += 1
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '(') parentheses += 1
    else if (character === ')') parentheses -= 1
    else if (character === '[') brackets += 1
    else if (character === ']') brackets -= 1
    else if (character === '{' || character === '}') errors.push('nested declaration block')
    else if (character === ';' && parentheses === 0 && brackets === 0) {
      consume(body.slice(segmentStart, index))
      segmentStart = index + 1
    }
  }
  consume(body.slice(segmentStart))
  if (quote || parentheses || brackets) errors.push('unbalanced declaration value')
  return { properties, errors }
}

function validateRules(rules: CssRule[], errors: string[]): void {
  for (const rule of rules) {
    if (/^@media\b/i.test(rule.prelude)) {
      const nested = parseRules(rule.body)
      errors.push(...nested.errors)
      validateRules(nested.rules, errors)
      continue
    }
    if (rule.prelude.startsWith('@')) {
      errors.push(`unsupported component at-rule: ${rule.prelude}`)
      continue
    }
    const selectorList = splitSelectorList(rule.prelude)
    errors.push(...selectorList.errors)
    for (const selector of selectorList.selectors) errors.push(...selectorOwnershipErrors(selector))
    errors.push(...declarationPropertyNames(rule.body).errors)
  }
}

export function componentOwnershipErrors(css: string): string[] {
  const stripped = stripCssComments(css)
  const parsed = parseRules(stripped.css)
  const errors = [...stripped.errors, ...parsed.errors]
  validateRules(parsed.rules, errors)
  return errors
}
