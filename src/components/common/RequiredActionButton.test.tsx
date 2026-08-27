import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RequiredActionButton } from './RequiredActionButton'

describe('RequiredActionButton', () => {
  it('emphasizes only the two required learner actions', () => {
    render(
      <div>
        <RequiredActionButton label="단서 찾기" />
        <RequiredActionButton label="뜻 확인" />
        <button type="button">일반 행동</button>
      </div>,
    )

    for (const label of ['단서 찾기', '뜻 확인']) {
      const button = screen.getByRole('button', { name: new RegExp(label) })
      expect(button).toHaveClass('required-action-button')
      expect(button).toHaveClass('gi-pulse')
      expect(button).toHaveAttribute('data-emphasis', 'gi-pulse')
      expect(button).toHaveTextContent('필수')
    }

    const ordinary = screen.getByRole('button', { name: '일반 행동' })
    expect(ordinary).not.toHaveClass('gi-pulse')
    expect(ordinary).not.toHaveAttribute('data-emphasis')
  })

  it('rejects a type-bypassed third label in development', () => {
    expect(() => render(<RequiredActionButton label={'다음 단계' as '단서 찾기'} />)).toThrow(
      'Invalid RequiredActionButton label: 다음 단계',
    )
  })
})
