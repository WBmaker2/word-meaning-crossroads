import { useMemo, useState, type CSSProperties } from 'react'

export type TextScale = 'normal' | 'large' | 'xlarge'

const TEXT_SCALE_VALUES: Record<TextScale, number> = {
  normal: 1,
  large: 1.25,
  xlarge: 1.5,
}

export function useTextScale(initial: TextScale = 'normal') {
  const [textScale, setTextScale] = useState<TextScale>(initial)
  const textScaleStyle = useMemo(
    () => ({ '--text-scale': TEXT_SCALE_VALUES[textScale] } as CSSProperties),
    [textScale],
  )
  return { textScale, setTextScale, textScaleStyle, textScaleValue: TEXT_SCALE_VALUES[textScale] }
}
