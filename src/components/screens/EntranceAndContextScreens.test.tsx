import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContextSceneScreen } from './ContextSceneScreen'
import { EntranceScreen } from './EntranceScreen'
import App from '../../app/App'
import { ROUTES } from '../../content/routes'
import { WORD_PACKS } from '../../content/wordPacks'

afterEach(() => cleanup())

describe('EntranceScreen', () => {
  it('explains the learning goal and offers the three non-competitive routes', () => {
    const onStartRoute = vi.fn()
    const { container } = render(<EntranceScreen routes={ROUTES} onStartRoute={onStartRoute} />)

    expect(screen.getByRole('heading', { name: '오늘의 학습 목표' })).toBeInTheDocument()
    expect(screen.getByText(/같은 모양의 낱말도 문장 속 단서에 따라 뜻이 달라질 수 있어요/)).toBeInTheDocument()
    expect(screen.getByText(/응답은 새로고침하면 사라져요/)).toBeInTheDocument()
    expect(screen.getByText(/이 탭을 닫으면 학습 기록도 남지 않아요/)).toBeInTheDocument()
    expect(screen.queryByText(/난이도|점수|순위|경쟁|빠르게|타이머|리더보드/)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /이름|학년|반|번호/ })).not.toBeInTheDocument()
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0)

    for (const route of ROUTES) {
      const button = screen.getByRole('button', { name: route.label })
      expect(button).toBeInTheDocument()
      const card = button.closest('[data-route-card]')
      expect(card).not.toBeNull()
      expect(within(card as HTMLElement).getByText(new RegExp(route.recommendedMinutes))).toBeInTheDocument()
      for (const wordId of route.wordIds) {
        expect(within(card as HTMLElement).getByText(WORD_PACKS.find((pack) => pack.id === wordId)!.lemma)).toBeInTheDocument()
      }
    }
  })

  it('sends the selected route id without changing the other route copy', async () => {
    const user = userEvent.setup()
    const onStartRoute = vi.fn()
    render(<EntranceScreen routes={ROUTES} onStartRoute={onStartRoute} />)

    await user.click(screen.getByRole('button', { name: '확장 길 4개' }))
    expect(onStartRoute).toHaveBeenCalledWith('extension')
    expect(onStartRoute).toHaveBeenCalledTimes(1)
  })
})

describe('ContextSceneScreen', () => {
  const snowPack = WORD_PACKS.find((pack) => pack.id === 'nun')!
  const snowScene = snowPack.scenes[0]

  it('shows the current sentence, reading-order tokens, and neutral local placeholders only', () => {
    render(
      <ContextSceneScreen
        wordPack={snowPack}
        scene={snowScene}
        initialPrediction=""
        onSavePrediction={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )

    const sentence = screen.getByTestId('context-sentence')
    expect(sentence).toHaveTextContent(snowScene.sentences[0].plainText.replace('눈이', '낱말 눈이'))
    expect(sentence.querySelectorAll('[data-sentence-id]')).toHaveLength(1)
    expect(sentence.querySelectorAll('[data-sentence-id]').length).toBe(snowScene.sentences.length)
    expect(sentence.querySelectorAll('[data-sentence-id]').length).toBeLessThanOrEqual(3)
    const renderedTokens = within(sentence).getAllByTestId('sentence-token')
    expect(renderedTokens.map((token) => token.textContent?.replace(/낱말\s*/, '').trim()).join(' ')).toBe(
      snowScene.sentences[0].tokens.map((token) => token.text).join(' '),
    )
    const target = within(sentence).getByText('눈이')
    expect(target.closest('mark')).toBeInTheDocument()
    expect(target.closest('mark')).toHaveTextContent('낱말 눈이')
    expect(screen.getByTestId('neutral-illustration-placeholder')).toHaveAttribute(
      'aria-label',
      '정답을 알려 주지 않는 갈림길 그림 자리',
    )
    expect(screen.getByTestId('local-audio-placeholder').tagName).toBe('P')
    expect(screen.getByTestId('local-audio-placeholder')).toHaveTextContent('문장 듣기 준비 중')
    expect(screen.getByTestId('local-audio-placeholder')).not.toHaveAttribute('aria-live')
    expect(screen.getByText(/외부로 보내지지 않아요/)).toBeInTheDocument()
    expect(document.querySelectorAll('img')).toHaveLength(0)
    for (const element of document.querySelectorAll('[src], [href]')) {
      expect(element.getAttribute('src') ?? element.getAttribute('href')).not.toMatch(/^https?:\/\//i)
    }
    expect(screen.queryByText(/내리는 눈|보는 눈/)).not.toBeInTheDocument()
    expect(document.querySelector('[data-correct-decision]')).not.toBeInTheDocument()
  })

  it('saves a trimmed prediction, clears old feedback on first input, and enforces 60 characters', async () => {
    const user = userEvent.setup()
    const onSavePrediction = vi.fn()
    const onClearFeedback = vi.fn()
    render(
      <ContextSceneScreen
        wordPack={snowPack}
        scene={snowScene}
        initialPrediction=""
        onSavePrediction={onSavePrediction}
        onFeedback={vi.fn()}
        onClearFeedback={onClearFeedback}
      />,
    )
    const input = screen.getByRole('textbox', { name: /처음에는 어떤 뜻/ }) as HTMLTextAreaElement
    const submit = screen.getByRole('button', { name: /단서 찾기/ })
    expect(input).toHaveAttribute('maxLength', '60')
    expect(screen.getByText('0/60')).toBeInTheDocument()
    expect(screen.getByText('자동으로 맞고 틀림을 판단하지 않아요')).toBeInTheDocument()
    expect(submit).toBeDisabled()

    await user.type(input, '  하늘에서 오는 것  ')
    expect(onClearFeedback).toHaveBeenCalledTimes(1)
    expect(screen.getByText(`${input.value.length}/60`)).toBeInTheDocument()
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(onSavePrediction).toHaveBeenCalledWith('하늘에서 오는 것')
    expect(onSavePrediction).toHaveBeenCalledTimes(1)

    await user.clear(input)
    await user.type(input, 'a'.repeat(61))
    expect(input).toHaveValue('a'.repeat(60))
    expect(screen.getByText('60/60')).toBeInTheDocument()
    expect(onClearFeedback).toHaveBeenCalledTimes(1)
  })

  it('keeps meaning definitions and correct decisions out of the pre-card DOM', () => {
    render(
      <ContextSceneScreen
        wordPack={snowPack}
        scene={snowScene}
        initialPrediction=""
        onSavePrediction={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    for (const meaning of snowPack.meanings) {
      expect(screen.queryByText(meaning.childFriendlyLabel)).not.toBeInTheDocument()
      expect(screen.queryByText(meaning.childFriendlyDescription)).not.toBeInTheDocument()
      expect(screen.queryByText(meaning.contrastExample)).not.toBeInTheDocument()
    }
    expect(document.body.textContent).not.toContain('childFriendlyLabel')
    expect(document.body.innerHTML).not.toMatch(/data-(correct|meaning|answer)/i)
  })

  it('syncs a new scene draft and resets first-input feedback clearing', async () => {
    const user = userEvent.setup()
    const onClearFeedback = vi.fn()
    const { rerender } = render(
      <ContextSceneScreen
        wordPack={snowPack}
        scene={snowPack.scenes[0]}
        initialPrediction="첫 장면 메모"
        onSavePrediction={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={onClearFeedback}
      />,
    )
    const nextScene = snowPack.scenes[1]
    rerender(
      <ContextSceneScreen
        wordPack={snowPack}
        scene={nextScene}
        initialPrediction="새 장면 메모"
        onSavePrediction={vi.fn()}
        onFeedback={vi.fn()}
        onClearFeedback={onClearFeedback}
      />,
    )
    const input = screen.getByRole('textbox', { name: /처음에는 어떤 뜻/ })
    expect(input).toHaveValue('새 장면 메모')
    await user.type(input, ' 추가')
    expect(onClearFeedback).toHaveBeenCalledTimes(1)
  })

  it('activates the required prediction action from the keyboard exactly once', async () => {
    const user = userEvent.setup()
    const onSavePrediction = vi.fn()
    render(
      <ContextSceneScreen
        wordPack={snowPack}
        scene={snowScene}
        initialPrediction=""
        onSavePrediction={onSavePrediction}
        onFeedback={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox', { name: /처음에는 어떤 뜻/ })
    await user.type(input, '하늘에서 오는 것')
    const submit = screen.getByRole('button', { name: /단서 찾기/ })
    submit.focus()
    await user.keyboard('{Enter}')
    expect(onSavePrediction).toHaveBeenCalledWith('하늘에서 오는 것')
    expect(onSavePrediction).toHaveBeenCalledTimes(1)
  })
})

describe('App entrance and prediction integration', () => {
  it('starts each route through the session and shows its first context scene', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '기본 길 4개' }))
    expect(screen.getByTestId('context-sentence')).toHaveTextContent('아침부터 흰 낱말 눈이 내려 운동장이 하얗게 변했습니다.')
    expect(screen.getByRole('textbox', { name: /처음에는 어떤 뜻/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '낱말 뜻 갈림길' })).toHaveFocus()

    cleanup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '확장 길 4개' }))
    expect(screen.getByTestId('context-sentence')).toHaveTextContent('준호가 발로 공을 힘껏 낱말 찼습니다.')

    cleanup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '전체 길 8개' }))
    expect(screen.getByTestId('context-sentence')).toHaveTextContent('아침부터 흰 낱말 눈이 내려 운동장이 하얗게 변했습니다.')
    expect(screen.getByText('현재 낱말 1/8')).toBeInTheDocument()
  })

  it('keeps exactly one app feedback announcer and shared controls', () => {
    render(<App />)
    expect(document.querySelectorAll('[data-feedback-announcer]')).toHaveLength(1)
    expect(screen.getByRole('radiogroup', { name: '글자 크기' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '줄 간격' })).toBeInTheDocument()
  })
})
