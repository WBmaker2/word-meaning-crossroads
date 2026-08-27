import { useEffect, useRef, useState, type FormEvent } from 'react'
import { RequiredActionButton } from '../common/RequiredActionButton'
import { NeutralCrossroadsIllustration } from '../common/NeutralCrossroadsIllustration'
import type { ContextScene, WordPack } from '../../domain/contentTypes'
import type { FeedbackInput } from '../../domain/sessionTypes'

export interface ContextSceneScreenProps {
  readonly wordPack: WordPack
  readonly scene: ContextScene
  readonly initialPrediction: string
  readonly onSavePrediction: (prediction: string) => void
  readonly onFeedback: (feedback: FeedbackInput) => void
  readonly onClearFeedback: () => void
}

export function ContextSceneScreen({
  wordPack,
  scene,
  initialPrediction,
  onSavePrediction,
  onFeedback,
  onClearFeedback,
}: ContextSceneScreenProps) {
  const [prediction, setPrediction] = useState(initialPrediction.slice(0, 60))
  const didClearFeedback = useRef(false)

  useEffect(() => {
    // The parent owns the draft when a new scene starts; mirror that external prop here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrediction(initialPrediction.slice(0, 60))
    didClearFeedback.current = false
  }, [scene.id, initialPrediction])

  const handlePredictionChange = (value: string) => {
    if (!didClearFeedback.current) {
      didClearFeedback.current = true
      onClearFeedback()
    }
    setPrediction(value.slice(0, 60))
  }

  const handleSave = () => {
    const trimmedPrediction = prediction.trim()
    if (trimmedPrediction.length === 0 || trimmedPrediction.length > 60) {
      onFeedback({ tone: 'error', message: '문장에서 가리키는 뜻을 짧게 적어 주세요.' })
      return
    }
    onSavePrediction(trimmedPrediction)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSave()
  }

  return (
    <section className="context-card" aria-labelledby="context-title" data-context-order={scene.order}>
      <p className="scene-kicker">{wordPack.lemma} 낱말 탐험</p>
      <h2 id="context-title">문장을 읽고 처음 생각을 적어 보아요</h2>
      <div className="neutral-illustration-wrap">
        <NeutralCrossroadsIllustration illustrationId={scene.illustrationId} wordId={scene.wordId} />
      </div>
      <div className="context-sentence" data-testid="context-sentence">
        {scene.sentences.map((sentence) => (
          <p key={sentence.id} data-sentence-id={sentence.id}>
            {sentence.tokens.map((token) => {
              const tokenContent = token.role === 'target' ? (
                <mark>
                  <span className="token-label">낱말</span>{' '}
                  {token.text}
                </mark>
              ) : (
                token.text
              )
              return (
                <span data-testid="sentence-token" key={token.id}>
                  {tokenContent}{' '}
                </span>
              )
            })}
          </p>
        ))}
      </div>
      <p data-testid="local-audio-placeholder">
        문장 듣기 준비 중
      </p>
      <aside className="privacy-notice" aria-label="개인정보 안내">
        이름을 쓰지 마세요. 적은 내용은 이 탭 안에만 머물고 외부로 보내지지 않아요.
      </aside>
      <form onSubmit={handleSubmit}>
        <label htmlFor="initial-prediction">
          처음에는 어떤 뜻을 가리키는지 짧게 적어 보아요.
        </label>
        <p id="prediction-help">이름은 쓰지 말고, 문장에서 가리키는 뜻만 짧게 적어요.</p>
        <textarea
          id="initial-prediction"
          name="initial-prediction"
          value={prediction}
          onChange={(event) => handlePredictionChange(event.target.value)}
          maxLength={60}
          aria-describedby="prediction-help prediction-count prediction-judgement"
          rows={3}
        />
        <p id="prediction-count">{prediction.length}/60</p>
        <p id="prediction-judgement">자동으로 맞고 틀림을 판단하지 않아요</p>
        <RequiredActionButton
          label="단서 찾기"
          disabled={prediction.trim().length === 0}
          onClick={handleSave}
        />
      </form>
    </section>
  )
}
