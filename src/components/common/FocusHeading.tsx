import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

export interface FocusHeadingProps extends ComponentPropsWithoutRef<'h1'> {
  readonly level?: 1 | 2
  readonly focusKey?: string | number
  readonly children: ReactNode
}

export function FocusHeading({ level = 1, focusKey, children, ...props }: FocusHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousFocusKey = useRef(focusKey)
  const Heading = level === 1 ? 'h1' : 'h2'

  useEffect(() => {
    if (previousFocusKey.current === focusKey) return
    previousFocusKey.current = focusKey
    headingRef.current?.focus({ preventScroll: true })
  }, [focusKey])

  return (
    <Heading {...props} ref={headingRef} tabIndex={-1}>
      {children}
    </Heading>
  )
}
