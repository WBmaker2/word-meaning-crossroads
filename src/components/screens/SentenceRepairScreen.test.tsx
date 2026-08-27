import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { WORD_PACKS } from '../../content/wordPacks'
import type { RepairChallenge } from '../../domain/contentTypes'
import App from '../../app/App'
import { SentenceRepairScreen } from './SentenceRepairScreen'

const challenge = (id: RepairChallenge['id']): RepairChallenge => {
  const result = WORD_PACKS.find((pack) => pack.repair.id === id)?.repair
  if (!result) throw new Error(`Missing repair fixture: ${id}`)
  return result
}

describe('SentenceRepairScreen', () => {
  afterEach(() => cleanup())

  it('renders only the current challenge in original order with a neutral preview', () => {
    const target = challenge('repair-nun')
    render(
      <SentenceRepairScreen
        challenge={target}
        onConfirmRepair={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )

    expect(screen.getByText(target.ambiguousSentence)).toBeInTheDocument()
    const group = screen.getByRole('group', { name: '문장 정비 방법은 무엇일까요?' })
    expect(group).toHaveAccessibleName('문장 정비 방법은 무엇일까요?')
    const radios = within(group).getAllByRole('radio')
    expect(radios).toHaveLength(target.solutions.length)
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(target.solutions.map((solution) => solution.id))
    target.solutions.forEach((solution) => {
      expect(screen.getByText(solution.blockLabel)).toBeInTheDocument()
      expect(screen.getByText(solution.completedSentence)).toBeInTheDocument()
      expect(screen.getByText(solution.reviewNote)).toBeInTheDocument()
    })
    expect(screen.getByText('아직 정비 방법을 고르지 않았어요.')).toHaveAttribute('id', 'repair-preview')
    expect(radios.every((radio) => radio.getAttribute('aria-describedby') === 'repair-preview')).toBe(true)
    expect(group).toHaveAccessibleDescription(
      '원문을 읽고, 뜻을 더 잘 알 수 있게 해 주는 정비 방법을 골라요. 아직 정비 방법을 고르지 않았어요.',
    )
    expect(screen.getByRole('button', { name: '문장을 분명하게 만들기' })).toBeDisabled()
    expect(screen.queryByText(/유일한 정답|완벽한 문장/)).not.toBeInTheDocument()
  })

  it('announces the selected sentence once after clearing feedback and supports native radio keyboard input', async () => {
    const user = userEvent.setup()
    const target = challenge('repair-nun')
    const onFeedback = vi.fn()
    const onClearFeedback = vi.fn()
    render(
      <SentenceRepairScreen
        challenge={target}
        onConfirmRepair={vi.fn()}
        onFeedback={onFeedback}
        onClearFeedback={onClearFeedback}
      />,
    )

    const group = screen.getByRole('group', { name: '문장 정비 방법은 무엇일까요?' })
    const radios = within(group).getAllByRole('radio')
    radios[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(radios[1]).toBeChecked()
    expect(document.getElementById('repair-preview')).toHaveTextContent(target.solutions[1].completedSentence)
    expect(group).toHaveAccessibleDescription(
      `원문을 읽고, 뜻을 더 잘 알 수 있게 해 주는 정비 방법을 골라요. ${target.solutions[1].completedSentence}`,
    )
    expect(onClearFeedback).toHaveBeenCalledTimes(1)
    expect(onFeedback).toHaveBeenCalledTimes(1)
    expect(onFeedback).toHaveBeenCalledWith({ tone: 'status', message: target.solutions[1].completedSentence })
    expect(onClearFeedback.mock.invocationCallOrder[0]).toBeLessThan(onFeedback.mock.invocationCallOrder[0]!)
  })

  it('confirms the exact selected solution once, then shows every unselected reviewed sentence', async () => {
    const user = userEvent.setup()
    const target = challenge('repair-gamda')
    const onConfirmRepair = vi.fn()
    const onFeedback = vi.fn()
    const onClearFeedback = vi.fn()
    render(
      <SentenceRepairScreen
        challenge={target}
        onConfirmRepair={onConfirmRepair}
        onFeedback={onFeedback}
        onClearFeedback={onClearFeedback}
      />,
    )

    const selected = screen.getByRole('radio', { name: /잠들기 전에 두 눈을/ })
    await user.click(selected)
    const submit = screen.getByRole('button', { name: '문장을 분명하게 만들기' })
    expect(submit).toBeEnabled()
    await user.dblClick(submit)
    expect(onConfirmRepair).toHaveBeenCalledTimes(1)
    expect(onConfirmRepair).toHaveBeenCalledWith('gamda-close')
    expect(submit).toBeDisabled()
    expect(document.getElementById('repair-preview')).toHaveTextContent(target.solutions[0].completedSentence)
    const alternatives = screen.getByRole('region', { name: '다른 방법도 있어요' })
    expect(alternatives).toHaveTextContent(target.solutions[1].completedSentence)
    expect(alternatives).toHaveTextContent(target.solutions[2].completedSentence)
    expect(alternatives.textContent).not.toContain(target.solutions[0].completedSentence)
    expect(screen.queryByText(/유일한 정답|완벽한 문장/)).not.toBeInTheDocument()

    expect(screen.getByRole('radio', { name: /잠들기 전에 두 눈을/ })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /상자에 리본을/ }))
    expect(submit).toBeDisabled()
    expect(onConfirmRepair).toHaveBeenCalledTimes(1)
    expect(onClearFeedback).toHaveBeenCalledTimes(1)
    expect(onFeedback).toHaveBeenCalledTimes(1)
  })

  it('resets selection and submission when the challenge id changes', async () => {
    const user = userEvent.setup()
    const first = challenge('repair-nun')
    const second = challenge('repair-gamda')
    const { rerender } = render(
      <SentenceRepairScreen
        challenge={first}
        onConfirmRepair={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('radio', { name: /창밖에 내리는/ }))
    await user.click(screen.getByRole('button', { name: '문장을 분명하게 만들기' }))
    rerender(
      <SentenceRepairScreen
        challenge={second}
        onConfirmRepair={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    expect(screen.getByText(second.ambiguousSentence)).toBeInTheDocument()
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true)
    expect(screen.getByText('아직 정비 방법을 고르지 않았어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '문장을 분명하게 만들기' })).toBeDisabled()
  })

  it('keeps malformed external-looking content as escaped text without exposing ids or creating nested markup', () => {
    const malformed = {
      id: 'repair-nun',
      wordId: 'nun',
      ambiguousSentence: '<img src=x onerror=alert(1)>',
      solutions: [
        {
          id: 'nun-snow',
          meaningId: 'nun:snow',
          blockLabel: '<script>alert(1)</script>',
          completedSentence: '<img src=x onerror=alert(1)>',
          reviewNote: '<b>unsafe</b>',
        },
        challenge('repair-nun').solutions[1],
      ],
    } as unknown as RepairChallenge
    render(
      <SentenceRepairScreen
        challenge={malformed}
        onConfirmRepair={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    expect(screen.getAllByText('<img src=x onerror=alert(1)>')).toHaveLength(2)
    expect(screen.queryByText('nun-snow')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /script/ })).not.toBeInTheDocument()
  })

  it('has no accessibility violations in the repair group', async () => {
    render(
      <SentenceRepairScreen
        challenge={challenge('repair-gamda')}
        onConfirmRepair={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    expect((await axe(document.querySelector('.sentence-repair-card')!)).violations).toHaveLength(0)
  })

  it('connects the core route to nun repair and advances to the next word after one submission', async () => {
    const user = userEvent.setup()
    const target = challenge('repair-nun')
    render(<App />)
    await user.click(screen.getByRole('button', { name: '기본 길 4개' }))

    const finishScene = async (clue: RegExp, meaning: RegExp) => {
      await user.type(screen.getByRole('textbox'), '문맥을 살펴봤어요')
      await user.click(screen.getByRole('button', { name: /단서 찾기/ }))
      await user.click(screen.getByRole('button', { name: clue }))
      await user.click(screen.getByRole('button', { name: /뜻 확인/ }))
      await user.click(screen.getByRole('radio', { name: meaning }))
      await user.click(screen.getByRole('button', { name: '선택한 뜻 결정하기' }))
    }

    await finishScene(/내려/, /내리는 눈/)
    await finishScene(/보았습니다\./, /보는 눈/)
    await user.click(screen.getByRole('button', { name: '단서 하나 가리기' }))
    await user.click(screen.getByRole('radio', { name: '여전히 분명해요' }))
    await user.click(screen.getByRole('button', { name: '판단 확인하기' }))
    await finishScene(/결정 단서가 없어요/, /판단하기 어려움/)

    expect(screen.getByText(target.ambiguousSentence)).toBeInTheDocument()
    const repairGroup = screen.getByRole('group', { name: '문장 정비 방법은 무엇일까요?' })
    expect(within(repairGroup).getAllByRole('radio')).toHaveLength(target.solutions.length)
    await user.click(within(repairGroup).getByRole('radio', { name: /창밖에 내리는/ }))
    expect(document.getElementById('repair-preview')).toHaveTextContent(target.solutions[0].completedSentence)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(target.solutions[0].completedSentence))
    await user.click(screen.getByRole('button', { name: '문장을 분명하게 만들기' }))

    expect(screen.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeInTheDocument()
    expect(screen.getByText('현재 낱말 2/4')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('이제 한 가지 뜻으로 읽을 수 있어요.'))
  })
})
