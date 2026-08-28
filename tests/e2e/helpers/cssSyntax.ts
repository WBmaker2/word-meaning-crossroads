export type CssRule = {
  prelude: string
  body: string
}

export type SelectorNode =
  | { kind: 'class'; name: string }
  | { kind: 'id'; name: string }
  | { kind: 'attribute'; content: string }
  | { kind: 'element'; name: string }
  | { kind: 'universal' }
  | { kind: 'combinator'; value: ' ' | '>' | '+' | '~' }
  | { kind: 'pseudo'; name: string; colonCount: 1 | 2; argument?: string }

export type ParsedSelector = {
  source: string
  nodes: SelectorNode[]
  errors: string[]
}

export type CssDeclaration = {
  property: string
  value: string
}

type Delimiter = '(' | '[' | '{'

type SyntaxResult<T> = {
  value: T
  errors: string[]
}

const CLOSING_FOR: Record<Delimiter, ')' | ']' | '}'> = {
  '(': ')',
  '[': ']',
  '{': '}',
}

const OPENING_FOR: Record<')' | ']' | '}', Delimiter> = {
  ')': '(',
  ']': '[',
  '}': '{',
}

function isWhitespace(character: string | undefined): boolean {
  return character !== undefined && /\s/.test(character)
}

function isNameStart(value: string, index: number): boolean {
  const character = value[index]
  if (character === undefined) return false
  if (/[A-Za-z_]/.test(character)) return true
  return character === '-' && (value[index + 1] === '-' || /[A-Za-z_]/.test(value[index + 1] ?? ''))
}

function readName(value: string, start: number): { name: string; nextIndex: number } | null {
  if (!isNameStart(value, start)) return null
  let index = start
  while (index < value.length && /[-_A-Za-z0-9]/.test(value[index]!)) index += 1
  return { name: value.slice(start, index), nextIndex: index }
}

function pushEscapeIndex(value: string, index: number): number {
  return value[index] === '\\' && index + 1 < value.length ? index + 1 : index
}

function stripCssComments(css: string): SyntaxResult<string> {
  const output: string[] = []
  const errors: string[] = []
  let quote: '"' | "'" | null = null

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index]!
    if (quote) {
      output.push(character)
      if (character === '\\') {
        if (index + 1 >= css.length) errors.push('trailing CSS string escape')
        else {
          output.push(css[index + 1]!)
          index += 1
        }
      } else if (character === quote) quote = null
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
  return { value: output.join(''), errors }
}

function readDelimited(value: string, openingIndex: number, opening: Delimiter): { content: string; nextIndex: number } | null {
  const stack: Delimiter[] = [opening]
  let quote: '"' | "'" | null = null

  for (let index = openingIndex + 1; index < value.length; index += 1) {
    const character = value[index]!
    if (quote) {
      if (character === '\\') index = pushEscapeIndex(value, index)
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '\\') {
      index = pushEscapeIndex(value, index)
      continue
    }
    if (character in CLOSING_FOR) {
      stack.push(character as Delimiter)
      continue
    }
    if (character in OPENING_FOR) {
      if (stack.at(-1) !== OPENING_FOR[character as ')' | ']' | '}']) return null
      stack.pop()
      if (stack.length === 0) {
        return { content: value.slice(openingIndex + 1, index), nextIndex: index + 1 }
      }
    }
  }

  return null
}

function readRuleBlock(css: string, openingIndex: number): { body: string; nextIndex: number } | null {
  let depth = 1
  let quote: '"' | "'" | null = null

  for (let index = openingIndex + 1; index < css.length; index += 1) {
    const character = css[index]!
    if (quote) {
      if (character === '\\') index = pushEscapeIndex(css, index)
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '\\') {
      index = pushEscapeIndex(css, index)
      continue
    }
    if (character === '{') depth += 1
    else if (character === '}') {
      depth -= 1
      if (depth === 0) return { body: css.slice(openingIndex + 1, index), nextIndex: index + 1 }
    }
  }

  return null
}

function parseRuleBlocks(css: string): SyntaxResult<CssRule[]> {
  const rules: CssRule[] = []
  const errors: string[] = []
  let segmentStart = 0
  let quote: '"' | "'" | null = null
  const stack: Delimiter[] = []

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index]!
    if (quote) {
      if (character === '\\') index = pushEscapeIndex(css, index)
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '\\') {
      index = pushEscapeIndex(css, index)
      continue
    }
    if (character === '(' || character === '[') {
      stack.push(character as Delimiter)
      continue
    }
    if (character === ')' || character === ']') {
      const expected = OPENING_FOR[character as ')' | ']' | '}']
      if (stack.at(-1) !== expected) {
        errors.push(`unbalanced rule delimiter: ${character}`)
        continue
      }
      stack.pop()
      continue
    }
    if (stack.length > 0) continue

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
    const block = readRuleBlock(css, index)
    if (!block) {
      errors.push('unbalanced rule block')
      break
    }
    rules.push({ prelude, body: block.body })
    index = block.nextIndex - 1
    segmentStart = block.nextIndex
  }

  if (quote) errors.push('unclosed CSS string')
  if (stack.length > 0) errors.push('unbalanced rule delimiters')
  if (css.slice(segmentStart).trim()) errors.push('unclosed rule or unsupported statement')
  return { value: rules, errors }
}

function splitTopLevel(value: string, separator: ',' | ';'): SyntaxResult<string[]> {
  const pieces: string[] = []
  const errors: string[] = []
  let start = 0
  let quote: '"' | "'" | null = null
  const stack: Delimiter[] = []

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!
    if (quote) {
      if (character === '\\') index = pushEscapeIndex(value, index)
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '\\') {
      index = pushEscapeIndex(value, index)
      continue
    }
    if (character in CLOSING_FOR) {
      stack.push(character as Delimiter)
      continue
    }
    if (character in OPENING_FOR) {
      const expected = OPENING_FOR[character as ')' | ']' | '}']
      if (stack.at(-1) !== expected) errors.push(`unbalanced text delimiter: ${character}`)
      else stack.pop()
      continue
    }
    if (character === separator && stack.length === 0) {
      pieces.push(value.slice(start, index))
      start = index + 1
    }
  }

  if (quote) errors.push('unclosed CSS string')
  if (stack.length > 0) errors.push('unbalanced text delimiters')
  pieces.push(value.slice(start))
  return { value: pieces, errors }
}

function parseSelector(source: string): ParsedSelector {
  const nodes: SelectorNode[] = []
  const errors: string[] = []
  let index = 0

  while (index < source.length) {
    const character = source[index]!
    if (isWhitespace(character)) {
      let nextIndex = index + 1
      while (nextIndex < source.length && isWhitespace(source[nextIndex])) nextIndex += 1
      const previousNode = nodes.at(-1); const nextCharacter = source[nextIndex]
      if (previousNode && previousNode.kind !== 'combinator' && nextCharacter !== undefined && !'>+~'.includes(nextCharacter)) {
        nodes.push({ kind: 'combinator', value: ' ' })
      }
      index = nextIndex; continue
    }
    if (character === '>' || character === '+' || character === '~') {
      nodes.push({ kind: 'combinator', value: character })
      index += 1
      continue
    }
    if (character === '*') {
      nodes.push({ kind: 'universal' })
      index += 1
      continue
    }
    if (character === '.' || character === '#') {
      const name = readName(source, index + 1)
      if (!name) {
        errors.push(`malformed ${character === '.' ? 'class' : 'id'} selector`)
        index += 1
        continue
      }
      nodes.push({ kind: character === '.' ? 'class' : 'id', name: name.name })
      index = name.nextIndex
      continue
    }
    if (character === '[') {
      const attribute = readDelimited(source, index, '[')
      if (!attribute) {
        errors.push('unbalanced attribute selector')
        break
      }
      if (!attribute.content.trim()) errors.push('empty attribute selector')
      nodes.push({ kind: 'attribute', content: attribute.content })
      index = attribute.nextIndex
      continue
    }
    if (character === ':') {
      const colonCount = source[index + 1] === ':' ? 2 : 1
      index += colonCount
      const pseudo = readName(source, index)
      if (!pseudo) {
        errors.push('malformed pseudo selector')
        continue
      }
      index = pseudo.nextIndex
      let argument: string | undefined
      if (source[index] === '(') {
        const functionBody = readDelimited(source, index, '(')
        if (!functionBody) {
          errors.push(`unbalanced pseudo function: ${pseudo.name}`)
          nodes.push({ kind: 'pseudo', name: pseudo.name, colonCount: colonCount as 1 | 2 })
          break
        }
        argument = functionBody.content
        if (!argument.trim()) errors.push(`empty pseudo function: ${pseudo.name}`)
        index = functionBody.nextIndex
      }
      nodes.push({ kind: 'pseudo', name: pseudo.name, colonCount: colonCount as 1 | 2, ...(argument === undefined ? {} : { argument }) })
      continue
    }
    const element = readName(source, index)
    if (element) {
      nodes.push({ kind: 'element', name: element.name })
      index = element.nextIndex
      continue
    }
    errors.push(`unsupported selector token: ${character}`)
    index += 1
  }

  if (!nodes.some((node) => node.kind !== 'combinator')) errors.push('selector has no subject')
  if (nodes[0]?.kind === 'combinator' || nodes.at(-1)?.kind === 'combinator') errors.push('dangling selector combinator')
  return { source, nodes, errors }
}

export function parseSelectorList(prelude: string): SyntaxResult<ParsedSelector[]> {
  const split = splitTopLevel(prelude, ',')
  const selectors: ParsedSelector[] = []
  const errors = [...split.errors]
  for (const piece of split.value) {
    const source = piece.trim()
    if (!source) {
      errors.push('empty selector in selector list')
      continue
    }
    const selector = parseSelector(source)
    selectors.push(selector)
    errors.push(...selector.errors)
  }
  return { value: selectors, errors }
}

function findDeclarationColon(segment: string): number {
  let quote: '"' | "'" | null = null
  const stack: Delimiter[] = []
  for (let index = 0; index < segment.length; index += 1) {
    const character = segment[index]!
    if (quote) {
      if (character === '\\') index = pushEscapeIndex(segment, index)
      else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '\\') {
      index = pushEscapeIndex(segment, index)
      continue
    }
    if (character in CLOSING_FOR) {
      stack.push(character as Delimiter)
      continue
    }
    if (character in OPENING_FOR) {
      const expected = OPENING_FOR[character as ')' | ']' | '}']
      if (stack.at(-1) === expected) stack.pop()
      continue
    }
    if (character === ':' && stack.length === 0) return index
  }
  return -1
}

function declarationValueErrors(value: string): string[] {
  const errors: string[] = []
  const stack: Delimiter[] = []
  let quote: '"' | "'" | null = null

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!
    if (quote) {
      if (character === '\\') {
        if (index + 1 >= value.length) errors.push('trailing declaration string escape')
        else index += 1
      } else if (character === quote) quote = null
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '\\') {
      if (index + 1 >= value.length) errors.push('trailing declaration escape')
      else index += 1
      continue
    }
    if (character in CLOSING_FOR) {
      stack.push(character as Delimiter)
      if (character === '{') errors.push('nested declaration block')
      continue
    }
    if (character in OPENING_FOR) {
      const expected = OPENING_FOR[character as ')' | ']' | '}']
      if (stack.at(-1) !== expected) {
        errors.push(`unbalanced declaration value: ${character}`)
        continue
      }
      stack.pop()
      if (character === '}') errors.push('nested declaration block')
    }
  }

  if (quote) errors.push('unclosed declaration string')
  if (stack.length > 0) errors.push('unbalanced declaration value')
  return errors
}

export function parseDeclarations(body: string): SyntaxResult<CssDeclaration[]> {
  const split = splitTopLevel(body, ';')
  const declarations: CssDeclaration[] = []
  const errors = [...split.errors]

  for (const piece of split.value) {
    const segment = piece.trim()
    if (!segment) continue
    const colon = findDeclarationColon(segment)
    if (colon < 0) {
      errors.push(`malformed declaration: ${segment}`)
      continue
    }
    const property = segment.slice(0, colon).trim().toLowerCase()
    const value = segment.slice(colon + 1).trim()
    if (!/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(property)) {
      errors.push(`invalid declaration property: ${property}`)
      continue
    }
    if (!value) errors.push(`empty declaration value: ${property}`)
    errors.push(...declarationValueErrors(value))
    declarations.push({ property, value })
  }

  return { value: declarations, errors }
}

export function parseCss(css: string): SyntaxResult<CssRule[]> {
  const stripped = stripCssComments(css)
  const rules = parseRuleBlocks(stripped.value)
  return { value: rules.value, errors: [...stripped.errors, ...rules.errors] }
}

export function parseNestedRules(css: string): SyntaxResult<CssRule[]> {
  return parseRuleBlocks(css)
}
