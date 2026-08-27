import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import * as missionSession from '../../hooks/useMissionSession'
import { WORD_PACKS } from '../../content/wordPacks'
import { evaluateClueDecision, evaluateCueNecessity, evaluateMeaningDecision } from '../../domain/evaluation'
import { createInitialSessionState } from '../../domain/sessionReducer'
import type { CueNecessityDecision } from '../../domain/contentTypes'
import type { SceneAttempt, UseMissionSessionResult } from '../../domain/sessionTypes'
import { ComparisonScreen } from './ComparisonScreen'
import App from '../../app/App'

function completedAttempts(wordId: (typeof WORD_PACKS)[number]['id']): readonly [SceneAttempt, SceneAttempt] {
  const pack = WORD_PACKS.find((candidate) => candidate.id === wordId)!
  return pack.scenes.slice(0, 2).map((scene) => {
    const clueDecision = { kind: 'tokens' as const, tokenIds: [scene.decisiveCueTokenIds[0]!] as const }
    return {
      sceneId: scene.id,
      initialPrediction: '처음 예상',
      clueDecision,
      clueEvaluation: evaluateClueDecision(scene, clueDecision),
      meaningDecision: scene.expectedDecision,
      meaningEvaluation: evaluateMeaningDecision(scene, scene.expectedDecision),
    }
  }) as unknown as readonly [SceneAttempt, SceneAttempt]
}

function renderComparison(wordId: (typeof WORD_PACKS)[number]['id'] = 'nun', callbacks?: {
  onConfirmCueNecessity?: (decision: CueNecessityDecision) => void
  onClearFeedback?: () => void
}) {
  const pack = WORD_PACKS.find((candidate) => candidate.id === wordId)!
  render(
    <ComparisonScreen
      wordPack={pack}
      completedScenes={completedAttempts(wordId)}
      challenge={pack.necessityChallenge}
      onConfirmCueNecessity={callbacks?.onConfirmCueNecessity ?? vi.fn()}
      onClearFeedback={callbacks?.onClearFeedback ?? vi.fn()}
    />,
  )
  return pack
}

describe('ComparisonScreen', () => {
  afterEach(() => cleanup())

  it('renders the completed scenes in order using the selected meaning and clue', () => {
    const pack = renderComparison('nun')
    const cards = screen.getAllByTestId('comparison-scene-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent(pack.scenes[0].sentences[0].plainText)
    expect(cards[1]).toHaveTextContent(pack.scenes[1].sentences[0].plainText)
    expect(cards[0]).toHaveTextContent('내리는 눈')
    expect(cards[1]).toHaveTextContent('보는 눈')
    expect(cards[0]).toHaveTextContent(pack.scenes[0].sentences[0].tokens.find((token) => token.id === pack.scenes[0].decisiveCueTokenIds[0])!.text)
    expect(cards[1]).toHaveTextContent(pack.scenes[1].sentences[0].tokens.find((token) => token.id === pack.scenes[1].decisiveCueTokenIds[0])!.text)
    expect(screen.getAllByText('눈')).not.toHaveLength(0)
    expect(screen.getByTestId('comparison-scene-grid')).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
      gap: '1rem',
    })
  })

  it('shows visible relation cues and the required comparison titles without classification jargon', () => {
    renderComparison()
    expect(screen.getByText('글자는 같아요')).toBeInTheDocument()
    expect(screen.getByText('문장 속 뜻은 달라요')).toBeInTheDocument()
    expect(screen.getAllByText('뜻을 가른 단서')).toHaveLength(2)
    expect(screen.getByText('같은 낱말')).toBeInTheDocument()
    expect(screen.getByText('↔')).toBeInTheDocument()
    expect(screen.getByTestId('same-word-badge')).toHaveTextContent('같은 낱말')
    const relation = screen.getByRole('group', { name: '같은 낱말과 다른 뜻의 관계' })
    expect(relation).toBeInTheDocument()
    const selectedClueList = screen.getByRole('list', { name: '첫째 문장의 선택 단서' })
    const selectedClueDescription = document.getElementById(selectedClueList.getAttribute('aria-describedby') ?? '')
    expect(selectedClueDescription).toHaveAttribute('hidden')
    expect(selectedClueDescription).toHaveTextContent('밑줄 친 항목은 학생이 선택한 단서입니다.')
    expect(selectedClueList).toHaveAccessibleDescription('밑줄 친 항목은 학생이 선택한 단서입니다.')
    expect(screen.queryByText(/어원|동음이의어|다의어|품사/)).not.toBeInTheDocument()
    expect(screen.getAllByTestId('selected-clue')).toHaveLength(2)
    expect(screen.getAllByTestId('selected-clue').every((element) => element.tagName === 'U')).toBe(true)
    return axe(relation).then((result) => expect(result.violations).toHaveLength(0))
  })

  it('shows the exact original challenge before hiding and native radios after hiding', async () => {
    const user = userEvent.setup()
    const pack = renderComparison()
    const before = screen.getByTestId('necessity-original-sentence')
    expect(before).toHaveTextContent(pack.necessityChallenge.originalSentence)
    expect(within(before).getByText(pack.necessityChallenge.hiddenTokenText)).toHaveStyle({ textDecoration: 'underline' })
    const hideButton = screen.getByRole('button', { name: '단서 하나 가리기' })
    const hiddenCueDescription = document.getElementById(hideButton.getAttribute('aria-describedby') ?? '')
    expect(hiddenCueDescription).toHaveAttribute('hidden')
    expect(hiddenCueDescription).toHaveTextContent('밑줄 친 어절이 가려집니다.')
    expect(hideButton).toHaveAttribute('aria-describedby', `${pack.necessityChallenge.id}-hidden-cue-description`)
    expect(hideButton).toHaveAccessibleDescription('밑줄 친 어절이 가려집니다.')
    expect(hideButton).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: '단서 하나 가리기' }))
    const hiddenSentence = screen.getByTestId('necessity-hidden-sentence')
    expect(hiddenSentence).toHaveTextContent(pack.necessityChallenge.sentenceAfterHide)
    expect(within(hiddenSentence).getByRole('img', { name: '가린 단서' })).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(radios[0]).toHaveFocus()
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['still-clear', 'now-unclear'])
    expect(screen.getByRole('radio', { name: '여전히 분명해요' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '판단하기 어려워졌어요' })).toBeInTheDocument()
  })

  it('supports native radio ArrowDown and Space selection after hiding the clue', async () => {
    const user = userEvent.setup()
    renderComparison()
    await user.click(screen.getByRole('button', { name: '단서 하나 가리기' }))
    const radios = screen.getAllByRole('radio')
    radios[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(radios[1]).toBeChecked()
    await user.keyboard(' ')
    expect(radios[1]).toBeChecked()
    expect(screen.getByRole('button', { name: '판단 확인하기' })).toBeEnabled()
  })

  it('moves focus to the first radio when hiding is activated with Enter', async () => {
    const user = userEvent.setup()
    renderComparison()
    const hide = screen.getByRole('button', { name: '단서 하나 가리기' })
    hide.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('radio', { name: '여전히 분명해요' })).toHaveFocus()
  })

  it('does not render raw IDs and distinguishes malformed clue records from insufficient evidence', () => {
    const pack = WORD_PACKS.find((candidate) => candidate.id === 'nun')!
    const [first, second] = completedAttempts('nun')
    const invalid = { ...first, clueDecision: { kind: 'tokens', tokenIds: ['foreign-scene:t99'] } } as unknown as SceneAttempt
    render(
      <ComparisonScreen
        wordPack={pack}
        completedScenes={[invalid, second]}
        challenge={pack.necessityChallenge}
        onConfirmCueNecessity={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    expect(screen.getByText('선택 단서 기록을 확인할 수 없어요')).toBeInTheDocument()
    expect(screen.queryByText('foreign-scene:t99')).not.toBeInTheDocument()

    cleanup()
    const insufficient = { ...first, clueDecision: { kind: 'insufficient' } } as unknown as SceneAttempt
    render(
      <ComparisonScreen
        wordPack={pack}
        completedScenes={[insufficient, second]}
        challenge={pack.necessityChallenge}
        onConfirmCueNecessity={vi.fn()}
        onClearFeedback={vi.fn()}
      />,
    )
    expect(screen.getByText('결정 단서가 없어요')).toBeInTheDocument()
    expect(screen.queryByText('선택 단서 기록을 확인할 수 없어요')).not.toBeInTheDocument()
  })

  it('submits the exact selected decision once and clears feedback when the choice changes', async () => {
    const user = userEvent.setup()
    const onConfirmCueNecessity = vi.fn()
    const onClearFeedback = vi.fn()
    const pack = renderComparison('nun', { onConfirmCueNecessity, onClearFeedback })
    await user.click(screen.getByRole('button', { name: '단서 하나 가리기' }))
    expect(onClearFeedback).toHaveBeenCalledTimes(1)
    const stillClear = screen.getByRole('radio', { name: '여전히 분명해요' })
    await user.click(stillClear)
    expect(onClearFeedback).toHaveBeenCalledTimes(2)
    const submit = screen.getByRole('button', { name: '판단 확인하기' })
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(onConfirmCueNecessity).toHaveBeenCalledTimes(1)
    expect(onConfirmCueNecessity).toHaveBeenCalledWith(pack.necessityChallenge.expectedClarity)
    expect(stillClear).toHaveFocus()
    expect(submit).toBeDisabled()
    submit.focus()
    await user.keyboard('{Enter}')
    await user.click(submit)
    expect(onConfirmCueNecessity).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('radio', { name: '판단하기 어려워졌어요' }))
    expect(onClearFeedback).toHaveBeenCalledTimes(3)
    expect(submit).toBeEnabled()
  })

  it.each([
    ['nun', 'still-clear'],
    ['bae', 'now-unclear'],
    ['bam', 'now-unclear'],
    ['mal', 'now-unclear'],
    ['chada', 'still-clear'],
    ['dari', 'still-clear'],
    ['sseuda', 'still-clear'],
    ['gamda', 'still-clear'],
  ] as const)('requires the reviewed clarity decision for %s', (wordId, reviewedExpected) => {
    const pack = WORD_PACKS.find((candidate) => candidate.id === wordId)!
    expect(pack.necessityChallenge.expectedClarity).toBe(reviewedExpected)
    const expected = evaluateCueNecessity(pack.necessityChallenge, reviewedExpected)
    const opposite: CueNecessityDecision = reviewedExpected === 'still-clear' ? 'now-unclear' : 'still-clear'
    const wrong = evaluateCueNecessity(pack.necessityChallenge, opposite)
    expect(expected.isCorrect).toBe(true)
    expect(expected.canContinue).toBe(true)
    expect(wrong.isCorrect).toBe(false)
    expect(wrong.canContinue).toBe(false)
  })

  it('enters comparison only after both current-word scenes and then records insufficient context', async () => {
    const user = userEvent.setup()
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
    expect(screen.queryByText('글자는 같아요')).not.toBeInTheDocument()
    await finishScene(/보았습니다\./, /보는 눈/)
    expect(screen.getByText('글자는 같아요')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '단서 하나 가리기' }))
    await user.click(screen.getByRole('radio', { name: '여전히 분명해요' }))
    await user.click(screen.getByRole('button', { name: '판단 확인하기' }))

    await finishScene(/결정 단서가 없어요/, /판단하기 어려움/)
    expect(screen.queryByRole('radiogroup', { name: '문장 속 뜻은 무엇일까요?' })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('단서가 부족하다는 판단도 근거 있는 선택이에요.'))
    expect(screen.queryByText('모르겠다')).not.toBeInTheDocument()
  })

  it('keeps a wrong necessity decision in comparison with one global alert, then advances after changing choice', async () => {
    const user = userEvent.setup()
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
    await user.click(screen.getByRole('radio', { name: '판단하기 어려워졌어요' }))
    await user.click(screen.getByRole('button', { name: '판단 확인하기' }))
    expect(screen.getByText('글자는 같아요')).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '판단 확인하기' })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: '여전히 분명해요' }))
    expect(screen.getByRole('button', { name: '판단 확인하기' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: '판단 확인하기' }))
    expect(screen.getByRole('heading', { name: '문장을 읽고 처음 생각을 적어 보아요' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('눈으로'))
  })

  it.each([
    null,
    [{}],
    [{ wordId: 'nun' }],
    [{ wordId: 'nun', scenes: null }],
    [{ wordId: 'nun', scenes: [{ sceneId: 'nun-snow-01', meaningEvaluation: null }] }],
    [{ wordId: 'nun', scenes: [{ sceneId: 'nun-snow-01', meaningEvaluation: { canContinue: true }, clueEvaluation: { canContinue: true }, clueDecision: null, meaningDecision: 'foreign:meaning' }] }],
    [{ wordId: 'nun', scenes: [{ sceneId: 'nun-snow-01', meaningEvaluation: { canContinue: true }, clueEvaluation: { canContinue: true }, clueDecision: { kind: 'tokens', tokenIds: [] }, meaningDecision: 'nun:snow' }, { sceneId: 'nun-eye-02', meaningEvaluation: { canContinue: true }, clueEvaluation: { canContinue: true }, clueDecision: { kind: 'tokens', tokenIds: ['nun-snow-01:t4', 'nun-snow-01:t4', 'nun-eye-02:t6'] }, meaningDecision: 'nun:eye' }] }],
  ] as const)('falls back to the placeholder for malformed comparison attempts: %s', (malformedAttempts) => {
    const baseState = createInitialSessionState()
    const malformedResult = {
      state: { ...baseState, phase: 'comparison', routeWordIds: ['nun'], currentSceneIndex: 1 },
      currentWordPack: WORD_PACKS.find((pack) => pack.id === 'nun')!,
      currentScene: WORD_PACKS.find((pack) => pack.id === 'nun')!.scenes[1],
      record: null,
      feedback: null,
      dispatch: vi.fn(),
    } as unknown as UseMissionSessionResult
    const hook = vi.spyOn(missionSession, 'useMissionSession').mockReturnValue({
      ...malformedResult,
      state: { ...malformedResult.state, attempts: malformedAttempts } as unknown as UseMissionSessionResult['state'],
    })
    expect(() => render(<App />)).not.toThrow()
    expect(screen.getByText('다음 탐험을 준비하고 있어요')).toBeInTheDocument()
    hook.mockRestore()
    cleanup()
  })

  it('falls back for forged success evaluations that contradict canonical scene decisions', () => {
    const pack = WORD_PACKS.find((candidate) => candidate.id === 'nun')!
    const [first, second] = completedAttempts('nun')
    const forgedMeaning = {
      ...first,
      meaningDecision: 'nun:eye',
      meaningEvaluation: { ...first.meaningEvaluation, isCorrect: true, canContinue: true },
    } as unknown as SceneAttempt
    const forgedClue = {
      ...first,
      clueDecision: { kind: 'tokens', tokenIds: [pack.scenes[0].supportiveCueTokenIds[0]] },
      clueEvaluation: { ...first.clueEvaluation, isCorrect: true, canContinue: true, evidenceKind: 'decisive' },
    } as unknown as SceneAttempt
    const baseState = createInitialSessionState()
    const hook = vi.spyOn(missionSession, 'useMissionSession')
    for (const attempts of [[forgedMeaning, second], [forgedClue, second]] as const) {
      hook.mockReturnValue({
        state: { ...baseState, phase: 'comparison', routeWordIds: ['nun'], currentSceneIndex: 1, attempts },
        currentWordPack: pack,
        currentScene: pack.scenes[1],
        record: null,
        feedback: null,
        dispatch: vi.fn(),
      } as unknown as UseMissionSessionResult)
      expect(() => render(<App />)).not.toThrow()
      expect(screen.getByText('다음 탐험을 준비하고 있어요')).toBeInTheDocument()
      cleanup()
    }
    hook.mockRestore()
  })
})
