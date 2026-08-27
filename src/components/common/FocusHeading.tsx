import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'

export interface FocusHeadingProps extends ComponentPropsWithoutRef<'h1'> {
  readonly level?: 1 | 2
  readonly focusKey?: string | number
  readonly focusOnMount?: boolean
  readonly children: ReactNode
}

export function FocusHeading({ level = 1, focusKey, focusOnMount = false, children, ...props }: FocusHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousFocusKey = useRef(focusKey)
  const hasMounted = useRef(false)
  const Heading = level === 1 ? 'h1' : 'h2'

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      if (focusOnMount) headingRef.current?.focus({ preventScroll: true })
      return
    }
    if (previousFocusKey.current === focusKey) return
    previousFocusKey.current = focusKey
    headingRef.current?.focus({ preventScroll: true })
  }, [focusKey, focusOnMount])

  return (
    <Heading {...props} ref={headingRef} tabIndex={-1}>
      {children}
    </Heading>
  )
}
