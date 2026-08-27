import type { ChangeEvent } from 'react'
import type { TextScale } from '../../hooks/useTextScale'

export interface TextScaleControlsProps {
  readonly value: TextScale
  readonly onChange: (value: TextScale) => void
}

const OPTIONS: readonly { value: TextScale; label: string }[] = [
  { value: 'normal', label: '보통' },
  { value: 'large', label: '크게' },
  { value: 'xlarge', label: '아주 크게' },
]

export function TextScaleControls({ value, onChange }: TextScaleControlsProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(event.target.value as TextScale)

  return (
    <fieldset className="accessibility-control" role="radiogroup" aria-label="글자 크기">
      <legend>글자 크기</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name="text-scale"
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
