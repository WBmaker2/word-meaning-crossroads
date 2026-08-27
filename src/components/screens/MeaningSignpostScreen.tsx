import { useEffect, useRef, useState } from 'react'
import type { ContextScene, MeaningDefinition, MeaningDecisionId } from '../../domain/contentTypes'

export interface MeaningSignpostScreenProps {
  readonly scene: ContextScene
  readonly candidateMeanings: readonly [MeaningDefinition, MeaningDefinition]
  readonly onConfirmMeaning: (decision: MeaningDecisionId) => void
  readonly onClearFeedback: () => void
}

const uncertaintyDecision: MeaningDecisionId = 'insufficient-context'

export function MeaningSignpostScreen({
  scene,
  candidateMeanings,
  onConfirmMeaning,
  onClearFeedback,
}: MeaningSignpostScreenProps) {
  const [selectedDecision, setSelectedDecision] = useState<MeaningDecisionId | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const selectedRadioRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // A new scene starts with a fresh choice and no local comparison panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDecision(null)
    setHasSubmitted(false)
    selectedRadioRef.current = null
  }, [scene.id])

  const handleSelection = (decision: MeaningDecisionId) => {
    if (selectedDecision === decision) return
    onClearFeedback()
    setSelectedDecision(decision)
    setHasSubmitted(false)
  }

  const handleSubmit = () => {
    if (!selectedDecision || hasSubmitted) return
    setHasSubmitted(true)
    onConfirmMeaning(selectedDecision)
    selectedRadioRef.current?.focus()
  }

  const selectedFeedback = selectedDecision ? scene.wrongChoiceFeedback[selectedDecision] : undefined

  return (
    <section className="meaning-signpost-card" aria-labelledby="meaning-signpost-title">
      <p className="scene-kicker">뜻 표지판</p>
      <h2 id="meaning-signpost-title">문장 속 뜻을 골라 보아요</h2>
      <p id="meaning-choice-help">문장 속 단서를 떠올리며 알맞은 뜻을 하나 골라요.</p>

      <fieldset className="meaning-choice-group" role="radiogroup" aria-describedby="meaning-choice-help">
        <legend>뜻 선택</legend>
        {candidateMeanings.map((meaning, index) => (
          <label className={['meaning-choice-card', selectedDecision === meaning.id ? 'meaning-choice-card--selected' : ''].filter(Boolean).join(' ')} key={meaning.id}>
            <input
              ref={(element) => {
                if (selectedDecision === meaning.id) selectedRadioRef.current = element
              }}
              type="radio"
              name="meaning-decision"
              value={meaning.id}
              checked={selectedDecision === meaning.id}
              onChange={() => handleSelection(meaning.id)}
            />
            <span className="meaning-choice-icon" aria-hidden="true">{index === 0 ? '가' : '나'}</span>
            <span className="meaning-choice-copy">
              <strong
                className="meaning-choice-label"
                style={selectedDecision === meaning.id ? { textDecoration: 'underline', textUnderlineOffset: '0.2em' } : undefined}
              >
                {meaning.childFriendlyLabel}
                {selectedDecision === meaning.id ? <span className="selection-status"><span aria-hidden="true">✓</span> 선택됨</span> : null}
              </strong>
              <span>{meaning.childFriendlyDescription}</span>
              <span>비교해 읽기: {meaning.contrastExample}</span>
            </span>
          </label>
        ))}
        <label className={['meaning-choice-card meaning-choice-card--uncertain', selectedDecision === uncertaintyDecision ? 'meaning-choice-card--selected' : ''].filter(Boolean).join(' ')}>
          <input
            ref={(element) => {
              if (selectedDecision === uncertaintyDecision) selectedRadioRef.current = element
            }}
            type="radio"
            name="meaning-decision"
            value={uncertaintyDecision}
            checked={selectedDecision === uncertaintyDecision}
            onChange={() => handleSelection(uncertaintyDecision)}
          />
          <span className="meaning-choice-icon" aria-hidden="true">?</span>
          <span className="meaning-choice-copy">
            <strong
              className="meaning-choice-label"
              style={selectedDecision === uncertaintyDecision ? { textDecoration: 'underline', textUnderlineOffset: '0.2em' } : undefined}
            >
              판단하기 어려움
              {selectedDecision === uncertaintyDecision ? <span className="selection-status"><span aria-hidden="true">✓</span> 선택됨</span> : null}
            </strong>
            <span>문장 속 단서만으로 한 뜻을 정하기 어려워요.</span>
            <span>더 알 수 있는 주변 말이 필요해요.</span>
          </span>
        </label>
      </fieldset>

      <button type="button" disabled={!selectedDecision || hasSubmitted} onClick={handleSubmit}>
        선택한 뜻 결정하기
      </button>

      {hasSubmitted ? (
        <aside className="meaning-comparison-panel" aria-labelledby="meaning-comparison-title">
          <h3 id="meaning-comparison-title">그 뜻이 되려면 주변에 어떤 말이 필요할까요?</h3>
          {selectedFeedback ? <p>{selectedFeedback}</p> : null}
          <ul>
            {candidateMeanings.map((meaning) => (
              <li key={meaning.id}>
                <strong>{meaning.childFriendlyLabel}</strong>
                <span>{meaning.contrastExample}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </section>
  )
}
