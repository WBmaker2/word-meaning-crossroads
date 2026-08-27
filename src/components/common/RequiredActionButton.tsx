import type { ButtonHTMLAttributes } from 'react'

export type RequiredActionLabel = '단서 찾기' | '뜻 확인'

export interface RequiredActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  readonly label: RequiredActionLabel
}

const REQUIRED_ACTION_LABELS = new Set<RequiredActionLabel>(['단서 찾기', '뜻 확인'])

export function RequiredActionButton({ label, ...props }: RequiredActionButtonProps) {
  if (import.meta.env.DEV && !REQUIRED_ACTION_LABELS.has(label)) {
    throw new Error(`Invalid RequiredActionButton label: ${String(label)}`)
  }

  return (
    <button
      {...props}
      type="button"
      className={['gi-pulse', props.className].filter(Boolean).join(' ')}
      data-emphasis="gi-pulse"
    >
      <span aria-hidden="true">✦</span> {label} <span className="required-badge">필수</span>
    </button>
  )
}
