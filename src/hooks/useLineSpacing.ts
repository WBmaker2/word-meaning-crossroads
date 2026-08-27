import { useMemo, useState, type CSSProperties } from 'react'

export type LineSpacing = 'comfortable' | 'wide'

const LINE_SPACING_VALUES: Record<LineSpacing, number> = {
  comfortable: 1.65,
  wide: 1.9,
}

export function useLineSpacing(initial: LineSpacing = 'comfortable') {
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(initial)
  const lineSpacingStyle = useMemo(
    () => ({ '--line-spacing': LINE_SPACING_VALUES[lineSpacing] } as CSSProperties),
    [lineSpacing],
  )
  return {
    lineSpacing,
    setLineSpacing,
    lineSpacingStyle,
    lineSpacingValue: LINE_SPACING_VALUES[lineSpacing],
  }
}
