import { forwardRef, useEffect, useRef, useState, type CSSProperties } from 'react'
import { RequiredActionButton } from '../common/RequiredActionButton'
import type { ContextScene, SentenceToken, TokenId } from '../../domain/contentTypes'
import type { ClueDecision, FeedbackInput } from '../../domain/sessionTypes'

export interface ClueInvestigationScreenProps {
  readonly scene: ContextScene
  readonly onSubmitClueDecision: (decision: ClueDecision) => void
  readonly onFeedback: (feedback: FeedbackInput) => void
  readonly onClearFeedback: () => void
}

const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

function tokenDecision(tokenIds: readonly TokenId[]): ClueDecision {
  if (tokenIds.length === 1) return { kind: 'tokens', tokenIds: [tokenIds[0]!] }
  return { kind: 'tokens', tokenIds: [tokenIds[0]!, tokenIds[1]!] }
}

export function ClueInvestigationScreen({
  scene,
  onSubmitClueDecision,
  onFeedback,
  onClearFeedback,
}: ClueInvestigationScreenProps) {
  const [selectedTokenIds, setSelectedTokenIds] = useState<readonly TokenId[]>([])
  const [insufficient, setInsufficient] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const firstSelectableRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Reset local choices when the parent advances to a different scene.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedTokenIds([])
    setInsufficient(false)
    setHasSubmitted(false)
  }, [scene.id])

  const clearFeedbackForDecisionChange = () => {
    onClearFeedback()
  }

  const toggleToken = (tokenId: TokenId) => {
    if (selectedTokenIds.includes(tokenId)) {
      clearFeedbackForDecisionChange()
      setHasSubmitted(false)
      setSelectedTokenIds((current) => current.filter((id) => id !== tokenId))
      return
    }
    if (selectedTokenIds.length >= 2) {
      onFeedback({ tone: 'error', message: '단서는 두 개까지 고를 수 있어요' })
      return
    }
    clearFeedbackForDecisionChange()
    setHasSubmitted(false)
    setInsufficient(false)
    setSelectedTokenIds((current) => [...current, tokenId])
  }

  const toggleInsufficient = () => {
    clearFeedbackForDecisionChange()
    setHasSubmitted(false)
    setInsufficient((current) => !current)
    setSelectedTokenIds([])
  }

  const handleSubmit = () => {
    if (!insufficient && selectedTokenIds.length === 0) return
    setHasSubmitted(true)
    onSubmitClueDecision(insufficient ? { kind: 'insufficient' } : tokenDecision(selectedTokenIds))
  }

  const handleRetry = () => {
    setSelectedTokenIds([])
    setInsufficient(false)
    setHasSubmitted(false)
    onClearFeedback()
    firstSelectableRef.current?.focus()
  }

  const selectableTokens = scene.sentences.flatMap((sentence) => sentence.tokens).filter((token) => token.role !== 'target')
  const hasDecision = insufficient || selectedTokenIds.length > 0

  return (
    <section className="clue-card" aria-labelledby="clue-title">
      <p className="scene-kicker">단서 조사</p>
      <h2 id="clue-title">문장에서 뜻을 알려 주는 단서를 골라 보아요</h2>
      <p id="clue-help">목표 낱말을 빼고, 뜻을 결정하는 데 도움이 되는 어절을 최대 두 개 골라요.</p>

      <div className="clue-sentence" data-testid="clue-sentence" aria-describedby="clue-help">
        {scene.sentences.map((sentence) => (
          <p key={sentence.id} data-sentence-id={sentence.id}>
            {sentence.tokens.map((token) => (
              <span data-testid="clue-token" key={token.id}>
                {token.role === 'target' ? (
                  <mark data-testid={`target-token-${token.id}`} aria-label={`${token.text}, 목표 낱말`}>
                    <span className="token-label">낱말</span>{' '}
                    {token.text}
                  </mark>
                ) : (
                  <TokenButton
                    ref={token.id === selectableTokens[0]?.id ? firstSelectableRef : undefined}
                    token={token}
                    selected={selectedTokenIds.includes(token.id)}
                    onToggle={() => toggleToken(token.id)}
                  />
                )}{' '}
              </span>
            ))}
          </p>
        ))}
      </div>

      <div className="clue-decisions">
        <h3>고른 단서</h3>
        <ol data-testid="selected-clues" aria-label="선택한 단서">
          {selectedTokenIds.map((tokenId) => {
            const token = scene.sentences.flatMap((sentence) => sentence.tokens).find((candidate) => candidate.id === tokenId)
            return <li key={tokenId}>{token?.text ?? tokenId}</li>
          })}
        </ol>
        <button
          className={['insufficient-choice', insufficient ? 'insufficient-choice--selected' : ''].filter(Boolean).join(' ')}
          type="button"
          aria-pressed={insufficient}
          onClick={toggleInsufficient}
        >
          <span aria-hidden="true">{insufficient ? '✓' : '○'}</span>{' '}
          결정 단서가 없어요
          <span className="visually-hidden" style={visuallyHiddenStyle}>
            {insufficient ? '선택됨' : '선택 안 됨'}
          </span>
        </button>
      </div>

      <RequiredActionButton label="뜻 확인" disabled={!hasDecision || hasSubmitted} onClick={handleSubmit} />
      {hasSubmitted ? (
        <button className="retry-clue-button" type="button" onClick={handleRetry}>
          다시 단서 고르기
        </button>
      ) : null}
    </section>
  )
}

interface TokenButtonProps {
  readonly token: SentenceToken
  readonly selected: boolean
  readonly onToggle: () => void
}

const TokenButton = forwardRef<HTMLButtonElement, TokenButtonProps>(function TokenButton(
  { token, selected, onToggle },
  ref,
) {
  const stateLabel = selected ? '선택됨' : '선택 안 됨'
  return (
    <button
      ref={ref}
      className={['token-choice', selected ? 'token-choice--selected token-underline' : ''].filter(Boolean).join(' ')}
      type="button"
      aria-pressed={selected}
      aria-label={`${token.text}, ${stateLabel}`}
      style={selected ? { textDecoration: 'underline', textUnderlineOffset: '0.2em' } : undefined}
      onClick={onToggle}
    >
      {selected ? <span aria-hidden="true">✓ </span> : null}
      {token.text}
      <span className="visually-hidden" style={visuallyHiddenStyle}>
        {stateLabel}
      </span>
    </button>
  )
})
