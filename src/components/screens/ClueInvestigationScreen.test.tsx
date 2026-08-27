import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WORD_PACKS } from '../../content/wordPacks'
import App from '../../app/App'
import { ClueInvestigationScreen } from './ClueInvestigationScreen'

afterEach(() => cleanup())

const clearScene = WORD_PACKS.find((pack) => pack.id === 'nun')!.scenes.find((scene) => scene.order === 1)!
const unclearScene = WORD_PACKS.find((pack) => pack.id === 'nun')!.scenes.find((scene) => scene.order === 3)!

function renderScreen(scene = clearScene) {
  const onSubmitClueDecision = vi.fn()
  const onFeedback = vi.fn()
  const onClearFeedback = vi.fn()
  render(
    <ClueInvestigationScreen
      scene={scene}
      onSubmitClueDecision={onSubmitClueDecision}
      onFeedback={onFeedback}
      onClearFeedback={onClearFeedback}
    />,
  )
  return { onSubmitClueDecision, onFeedback, onClearFeedback }
}

describe('ClueInvestigationScreen', () => {
  it('renders sentence tokens in reading order and excludes the target from choices', () => {
    renderScreen()
    const sentence = screen.getByTestId('clue-sentence')
    const rendered = within(sentence).getAllByTestId('clue-token')
    expect(rendered.map((token) => token.querySelector('button')?.firstChild?.textContent ?? token.querySelector('mark')?.textContent?.replace(/^낱말\s*/, '').trim())).toEqual(
      clearScene.sentences.flatMap((sentence) => sentence.tokens).map((token) => token.text),
    )
    const target = clearScene.sentences[0].tokens.find((token) => token.role === 'target')!
    expect(screen.getByTestId(`target-token-${target.id}`)).toHaveTextContent(target.text)
    expect(screen.getByTestId(`target-token-${target.id}`)).toHaveAccessibleName(`${target.text}, 목표 낱말`)
    expect(screen.queryByRole('button', { name: new RegExp(target.text) })).not.toBeInTheDocument()
  })

  it('toggles a clue with Enter and Space and keeps selected order', async () => {
    const user = userEvent.setup()
    renderScreen()
    const choices = screen.getAllByRole('button', { name: /선택 안 됨/ })
    choices[0].focus()
    await user.keyboard('{Enter}')
    expect(choices[0]).toHaveAttribute('aria-pressed', 'true')
    choices[1].focus()
    await user.keyboard(' ')
    const basket = screen.getByTestId('selected-clues')
    const selectableLabels = clearScene.sentences[0].tokens.filter((token) => token.role !== 'target').map((token) => token.text)
    expect(within(basket).getAllByRole('listitem').map((item) => item.textContent?.trim())).toEqual(selectableLabels.slice(0, 2))
    await user.keyboard('{Enter}')
    expect(choices[1]).toHaveAttribute('aria-pressed', 'false')
  })

  it('limits selection to two and reports an error without changing the first two', async () => {
    const user = userEvent.setup()
    const { onFeedback, onClearFeedback } = renderScreen()
    const choices = screen.getAllByRole('button', { name: /선택 안 됨/ })
    await user.click(choices[0])
    await user.click(choices[1])
    await user.click(choices[2])
    expect(choices[0]).toHaveAttribute('aria-pressed', 'true')
    expect(choices[1]).toHaveAttribute('aria-pressed', 'true')
    expect(choices[2]).toHaveAttribute('aria-pressed', 'false')
    expect(onFeedback).toHaveBeenCalledTimes(1)
    expect(onFeedback).toHaveBeenCalledWith({ tone: 'error', message: '단서는 두 개까지 고를 수 있어요' })
    expect(onClearFeedback).toHaveBeenCalledTimes(2)
    await user.click(choices[0])
    expect(onClearFeedback).toHaveBeenCalledTimes(3)
  })

  it('duplicates selected state with aria, check, underline, and a visible text label', async () => {
    const user = userEvent.setup()
    renderScreen()
    const choice = screen.getAllByRole('button', { name: /선택 안 됨/ })[0]
    await user.click(choice)
    expect(choice).toHaveAttribute('aria-pressed', 'true')
    expect(choice).toHaveClass('token-underline')
    expect(choice).toHaveStyle({ textDecoration: 'underline' })
    expect(within(choice).getByText('✓')).toBeInTheDocument()
    expect(within(choice).getByText('선택됨')).toBeVisible()
    expect(choice).toHaveAccessibleName(/선택됨/)
  })

  it('keeps insufficient and token decisions mutually exclusive in both directions', async () => {
    const user = userEvent.setup()
    renderScreen(unclearScene)
    const insufficient = screen.getByRole('button', { name: /결정 단서가 없어요/ })
    const choice = screen.getAllByRole('button', { name: /선택 안 됨/ })[0]
    await user.click(insufficient)
    expect(insufficient).toHaveAttribute('aria-pressed', 'true')
    expect(choice).toHaveAttribute('aria-pressed', 'false')
    await user.click(choice)
    expect(insufficient).toHaveAttribute('aria-pressed', 'false')
    expect(choice).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps submit disabled without a decision and submits exact token or insufficient payload', async () => {
    const user = userEvent.setup()
    const result = renderScreen(unclearScene)
    const submit = screen.getByRole('button', { name: /뜻 확인/ })
    expect(submit).toBeDisabled()
    const insufficient = screen.getByRole('button', { name: /결정 단서가 없어요/ })
    await user.click(insufficient)
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(result.onSubmitClueDecision).toHaveBeenCalledWith({ kind: 'insufficient' })

    cleanup()
    const decisive = renderScreen(clearScene)
    const decisiveToken = clearScene.decisiveCueTokenIds[0]
    const decisiveChoice = screen.getByRole('button', { name: new RegExp(clearScene.sentences[0].tokens.find((token) => token.id === decisiveToken)!.text) })
    await user.click(decisiveChoice)
    await user.click(screen.getByRole('button', { name: /뜻 확인/ }))
    expect(decisive.onSubmitClueDecision).toHaveBeenCalledWith({ kind: 'tokens', tokenIds: [decisiveToken] })
  })

  it('shows a retry action after a submitted decision remains on the same scene', async () => {
    const user = userEvent.setup()
    const result = renderScreen()
    const choice = screen.getAllByRole('button', { name: /선택 안 됨/ })[0]
    await user.click(choice)
    const submit = screen.getByRole('button', { name: /뜻 확인/ })
    await user.click(submit)
    expect(result.onSubmitClueDecision).toHaveBeenCalledTimes(1)
    expect(submit).toBeDisabled()
    submit.focus()
    await user.keyboard('{Enter}')
    await user.click(submit)
    expect(result.onSubmitClueDecision).toHaveBeenCalledTimes(1)
    const selectableTokens = clearScene.sentences[0].tokens.filter((token) => token.role !== 'target')
    await user.click(screen.getByRole('button', { name: new RegExp(`${selectableTokens[0]!.text}, 선택됨`) }))
    await user.click(screen.getByRole('button', { name: new RegExp(`${selectableTokens[1]!.text}, 선택 안 됨`) }))
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(result.onSubmitClueDecision).toHaveBeenCalledTimes(2)
    const retry = screen.getByRole('button', { name: '다시 단서 고르기' })
    await user.click(retry)
    expect(screen.queryByRole('button', { name: '다시 단서 고르기' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /선택 안 됨/ })[0]).toHaveFocus()
  })

  it('does not add a second live, alert, or status region', async () => {
    renderScreen()
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(0)
    expect(document.querySelectorAll('[role="alert"], [role="status"]')).toHaveLength(0)
  })
})

describe('App clue-investigation integration', () => {
  it('keeps supportive-only submissions on the clue phase, then advances after decisive evidence', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '기본 길 4개' }))
    await user.type(screen.getByRole('textbox', { name: /처음에는 어떤 뜻/ }), '하늘에서 오는 것')
    await user.click(screen.getByRole('button', { name: /단서 찾기/ }))

    const scene = clearScene
    const supportiveId = scene.supportiveCueTokenIds[0]!
    const supportive = scene.sentences[0].tokens.find((token) => token.id === supportiveId)!
    await user.click(screen.getByRole('button', { name: new RegExp(supportive.text) }))
    await user.click(screen.getByRole('button', { name: /뜻 확인/ }))
    expect(screen.getByRole('heading', { name: '문장에서 뜻을 알려 주는 단서를 골라 보아요' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('도움이 되는 단서예요'))
    const submit = screen.getByRole('button', { name: /뜻 확인/ })
    const feedbackText = screen.getByRole('alert').textContent
    expect(submit).toBeDisabled()
    submit.focus()
    await user.keyboard('{Enter}')
    await user.click(submit)
    expect(screen.getByRole('alert').textContent).toBe(feedbackText)
    expect(screen.getByRole('button', { name: '다시 단서 고르기' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 단서 고르기' }))
    const decisiveId = scene.decisiveCueTokenIds[0]!
    const decisive = scene.sentences[0].tokens.find((token) => token.id === decisiveId)!
    await user.click(screen.getByRole('button', { name: new RegExp(decisive.text) }))
    await user.click(screen.getByRole('button', { name: /뜻 확인/ }))
    expect(screen.queryByRole('heading', { name: '문장에서 뜻을 알려 주는 단서를 골라 보아요' })).not.toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '뜻 선택' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-feedback-announcer]')).toHaveLength(1)
  })
})
