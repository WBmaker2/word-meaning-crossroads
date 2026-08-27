import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import App from '../../app/App'
import { WORD_PACKS } from '../../content/wordPacks'
import { evaluateMeaningDecision } from '../../domain/evaluation'
import type { MeaningDefinition } from '../../domain/contentTypes'
import { MeaningSignpostScreen } from './MeaningSignpostScreen'

afterEach(() => cleanup())

const clearScene = WORD_PACKS.find((pack) => pack.id === 'nun')!.scenes[0]
const unclearScene = WORD_PACKS.find((pack) => pack.id === 'nun')!.scenes[2]

function candidatesFor(scene = clearScene): readonly [MeaningDefinition, MeaningDefinition] {
  const pack = WORD_PACKS.find((candidate) => candidate.id === scene.wordId)!
  return scene.candidateMeaningIds.map((id) => pack.meanings.find((meaning) => meaning.id === id)!) as unknown as readonly [MeaningDefinition, MeaningDefinition]
}

function renderScreen(scene = clearScene) {
  const onConfirmMeaning = vi.fn()
  const onClearFeedback = vi.fn()
  render(
    <MeaningSignpostScreen
      scene={scene}
      candidateMeanings={candidatesFor(scene)}
      onConfirmMeaning={onConfirmMeaning}
      onClearFeedback={onClearFeedback}
    />,
  )
  return { onConfirmMeaning, onClearFeedback }
}

describe('MeaningSignpostScreen', () => {
  it('shows exactly two ordered meaning cards and a third uncertainty choice', () => {
    renderScreen()

    const group = screen.getByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' })
    expect(group).toHaveAccessibleName('문장 속 뜻은 무엇일까요?')
    const radios = within(group).getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
      clearScene.candidateMeaningIds[0],
      clearScene.candidateMeaningIds[1],
      'insufficient-context',
    ])
    expect(within(group).getByText('내리는 눈')).toBeInTheDocument()
    expect(within(group).getByText('하늘에서 내려오는 하얀 얼음 알갱이')).toBeInTheDocument()
    expect(within(group).getByText(/눈이 내려 길이 하얗습니다/)).toBeInTheDocument()
    expect(within(group).getByText('판단하기 어려움')).toBeInTheDocument()
    expect(within(group).getByText(/문장 속 단서만으로 한 뜻을 정하기 어려워요/)).toBeInTheDocument()
  })

  it('uses native radio keyboard behavior and enables submit only after selection', async () => {
    const user = userEvent.setup()
    renderScreen()
    const group = screen.getByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' })
    const radios = within(group).getAllByRole('radio')
    const submit = screen.getByRole('button', { name: '선택한 뜻 결정하기' })

    expect(submit).toBeDisabled()
    radios[0].focus()
    await user.keyboard('{ArrowDown}')
    expect(radios[1]).toBeChecked()
    await user.keyboard('{ArrowDown}')
    expect(radios[2]).toBeChecked()
    await user.keyboard(' ')
    expect(submit).toBeEnabled()
  })

  it('shows a check icon, underline, and visible selected label without relying on color', async () => {
    const user = userEvent.setup()
    renderScreen()
    const selected = screen.getByRole('radio', { name: /내리는 눈/ })

    await user.click(selected)

    const card = selected.closest('label')!
    expect(card).toHaveClass('meaning-choice-card--selected')
    expect(within(card).getByText('✓')).toBeVisible()
    expect(within(card).getByText('선택됨')).toBeVisible()
    expect(within(card).getByText('내리는 눈')).toHaveStyle({ textDecoration: 'underline' })
  })

  it('submits the exact uncertainty payload once and returns focus to the selected radio', async () => {
    const user = userEvent.setup()
    const { onConfirmMeaning, onClearFeedback } = renderScreen(unclearScene)
    const uncertainty = screen.getByRole('radio', { name: /판단하기 어려움/ })
    const submit = screen.getByRole('button', { name: '선택한 뜻 결정하기' })

    await user.click(uncertainty)
    await user.click(submit)
    expect(onClearFeedback).toHaveBeenCalledTimes(1)
    expect(onConfirmMeaning).toHaveBeenCalledTimes(1)
    expect(onConfirmMeaning).toHaveBeenCalledWith('insufficient-context')
    expect(submit).toBeDisabled()
    expect(uncertainty).toHaveFocus()
    await user.click(submit)
    expect(onConfirmMeaning).toHaveBeenCalledTimes(1)
  })

  it('clears feedback and unlocks submission when the choice changes', async () => {
    const user = userEvent.setup()
    const { onConfirmMeaning, onClearFeedback } = renderScreen()
    const radios = screen.getAllByRole('radio')
    const submit = screen.getByRole('button', { name: '선택한 뜻 결정하기' })

    await user.click(radios[0]!)
    await user.click(submit)
    expect(submit).toBeDisabled()
    await user.click(radios[1]!)
    expect(onClearFeedback).toHaveBeenCalledTimes(2)
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(onConfirmMeaning).toHaveBeenCalledTimes(2)
    expect(onConfirmMeaning).toHaveBeenLastCalledWith(clearScene.candidateMeaningIds[1])
  })

  it('shows non-live corrective comparison context after a submitted choice remains', async () => {
    const user = userEvent.setup()
    renderScreen()
    const selected = screen.getByRole('radio', { name: /보는 눈/ })
    await user.click(selected)
    await user.click(screen.getByRole('button', { name: '선택한 뜻 결정하기' }))

    expect(screen.getByText('그 뜻이 되려면 주변에 어떤 말이 필요할까요?')).toBeInTheDocument()
    expect(screen.getByText(clearScene.wrongChoiceFeedback['nun:eye']!)).toBeInTheDocument()
    expect(screen.getByText('눈으로 책의 글자를 읽습니다.')).toBeInTheDocument()
    expect(document.querySelectorAll('[aria-live], [role="alert"], [role="status"]')).toHaveLength(0)
  })

  it('submits uncertainty successfully for an unclear scene and rejects a specific choice by the evaluator', async () => {
    expect(evaluateMeaningDecision(unclearScene, 'insufficient-context')).toMatchObject({ isCorrect: true, canContinue: true })
    unclearScene.candidateMeaningIds.forEach((candidateId) => {
      expect(evaluateMeaningDecision(unclearScene, candidateId)).toMatchObject({ isCorrect: false, canContinue: false })
    })

    const user = userEvent.setup()
    const { onConfirmMeaning } = renderScreen(unclearScene)
    await user.click(screen.getByRole('radio', { name: /판단하기 어려움/ }))
    await user.click(screen.getByRole('button', { name: '선택한 뜻 결정하기' }))
    expect(onConfirmMeaning).toHaveBeenCalledWith('insufficient-context')
    expect(evaluateMeaningDecision(unclearScene, 'insufficient-context').message).toContain('단서가 부족하다는 판단도 근거 있는 선택이에요')
    expect(screen.queryByText(new RegExp(['모르', '겠', '다'].join('')))).not.toBeInTheDocument()
  })

  it('shows the decision-clue guidance when uncertainty is chosen for a clear scene', async () => {
    const user = userEvent.setup()
    const { onConfirmMeaning } = renderScreen(clearScene)
    await user.click(screen.getByRole('radio', { name: /판단하기 어려움/ }))
    await user.click(screen.getByRole('button', { name: '선택한 뜻 결정하기' }))

    expect(onConfirmMeaning).toHaveBeenCalledTimes(1)
    expect(onConfirmMeaning).toHaveBeenCalledWith('insufficient-context')
    expect(screen.getByText(clearScene.wrongChoiceFeedback['insufficient-context']!)).toBeInTheDocument()
  })

  it('has no forbidden taxonomy terms in UI names and passes axe', async () => {
    renderScreen()
    const group = screen.getByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' })
    const restrictedTerms = [
      ['동', '음', '이', '의', '어'].join(''),
      ['다', '의', '어'].join(''),
      ['품', '사'].join(''),
    ]
    restrictedTerms.forEach((term) => {
      expect(group.textContent).not.toContain(term)
      expect(group.getAttribute('aria-label') ?? '').not.toContain(term)
    })
    expect((await axe(group)).violations).toHaveLength(0)
  })
})

describe('meaning signpost integration', () => {
  it('keeps one global feedback announcer and retries before moving to the next prediction', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '기본 길 4개' }))
    await user.type(screen.getByRole('textbox', { name: /처음에는 어떤 뜻/ }), '하늘에서 오는 것')
    await user.click(screen.getByRole('button', { name: /단서 찾기/ }))
    const firstScene = WORD_PACKS.find((pack) => pack.id === 'nun')!.scenes[0]
    const decisiveToken = firstScene.decisiveCueTokenIds[0]!
    const decisiveText = firstScene.sentences[0].tokens.find((token) => token.id === decisiveToken)!.text
    await user.click(screen.getByRole('button', { name: new RegExp(decisiveText) }))
    await user.click(screen.getByRole('button', { name: /뜻 확인/ }))
    expect(screen.getByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-feedback-announcer]')).toHaveLength(1)

    await user.click(screen.getByRole('radio', { name: /보는 눈/ }))
    await user.click(screen.getByRole('button', { name: '선택한 뜻 결정하기' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/내려/))
    expect(screen.getByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '선택한 뜻 결정하기' })).toBeDisabled()
    expect(screen.queryByRole('alert', { name: /그 뜻이 되려면/ })).not.toBeInTheDocument()
    expect(screen.getByText('그 뜻이 되려면 주변에 어떤 말이 필요할까요?')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /내리는 눈/ }))
    expect(screen.getByRole('button', { name: '선택한 뜻 결정하기' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '선택한 뜻 결정하기' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /문장을 읽고 처음 생각을 적어 보아요/ })).toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/뜻을 잘 골랐어요/))
  })
})
