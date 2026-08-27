import type { ChangeEvent } from 'react'
import type { LineSpacing } from '../../hooks/useLineSpacing'

export interface LineSpacingControlsProps {
  readonly value: LineSpacing
  readonly onChange: (value: LineSpacing) => void
}

const OPTIONS: readonly { value: LineSpacing; label: string }[] = [
  { value: 'comfortable', label: '보통' },
  { value: 'wide', label: '넓게' },
]

export function LineSpacingControls({ value, onChange }: LineSpacingControlsProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(event.target.value as LineSpacing)

  return (
    <fieldset className="accessibility-control" role="radiogroup" aria-label="줄 간격">
      <legend>줄 간격</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name="line-spacing"
            value={option.value}
            checked={value === option.value}
            onChange={handleChange}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}
