import { useEffect, useRef, useState } from 'react'
import { FocusHeading } from '../common/FocusHeading'
import type {
  ContextScene,
  CueNecessityChallenge,
  CueNecessityDecision,
  SentenceToken,
  WordPack,
} from '../../domain/contentTypes'
import type { SceneAttempt } from '../../domain/sessionTypes'

export interface ComparisonScreenProps {
  readonly wordPack: WordPack
  readonly completedScenes: readonly [SceneAttempt, SceneAttempt]
  readonly challenge: CueNecessityChallenge
  readonly onConfirmCueNecessity: (decision: CueNecessityDecision) => void
  readonly onClearFeedback: () => void
}

const CLARITY_CHOICES: readonly { value: CueNecessityDecision; label: string }[] = [
  { value: 'still-clear', label: '여전히 분명해요' },
  { value: 'now-unclear', label: '판단하기 어려워졌어요' },
]

function sceneForAttempt(wordPack: WordPack, attempt: SceneAttempt): ContextScene | undefined {
  return wordPack.scenes.find((scene) => scene.id === attempt.sceneId)
}

function meaningLabel(wordPack: WordPack, decision: SceneAttempt['meaningDecision']): string {
  if (decision === 'insufficient-context') return '판단하기 어려움'
  return wordPack.meanings.find((meaning) => meaning.id === decision)?.childFriendlyLabel ?? '문장에서 고른 뜻'
}

type ClueDisplay =
  | { readonly kind: 'tokens'; readonly tokenIds: readonly string[] }
  | { readonly kind: 'insufficient' }
  | { readonly kind: 'invalid' }

function clueDisplay(attempt: SceneAttempt, scene: ContextScene): ClueDisplay {
  const rawDecision = (attempt as unknown as { readonly clueDecision?: unknown }).clueDecision
  if (!rawDecision || typeof rawDecision !== 'object' || !('kind' in rawDecision)) return { kind: 'invalid' }
  if (rawDecision.kind === 'insufficient') return { kind: 'insufficient' }
  if (rawDecision.kind !== 'tokens' || !('tokenIds' in rawDecision) || !Array.isArray(rawDecision.tokenIds)) return { kind: 'invalid' }
  if (rawDecision.tokenIds.length < 1 || rawDecision.tokenIds.length > 2 || !rawDecision.tokenIds.every((tokenId) => typeof tokenId === 'string')) return { kind: 'invalid' }
  const available = new Map<string, SentenceToken>(scene.sentences.flatMap((sentence) => sentence.tokens).map((token) => [token.id, token]))
  const seen = new Set<string>()
  const tokenIds = rawDecision.tokenIds.filter((tokenId): tokenId is string => {
    if (seen.has(tokenId)) return false
    const token = available.get(tokenId)
    if (!token || token.role === 'target') return false
    seen.add(tokenId)
    return true
  }).slice(0, 2)
  if (tokenIds.length !== rawDecision.tokenIds.length) return { kind: 'invalid' }
  return { kind: 'tokens', tokenIds }
}

function tokenCopy(token: SentenceToken, isSelected: boolean) {
  if (!isSelected) return token.text
  return (
    <u style={{ textDecoration: 'underline', textUnderlineOffset: '0.2em' }}>
      {token.text}
    </u>
  )
}

function OriginalSentence({ sentence, hiddenTokenText }: { readonly sentence: string; readonly hiddenTokenText: string }) {
  const hiddenStart = sentence.indexOf(hiddenTokenText)
  if (hiddenStart < 0 || hiddenTokenText.length === 0) return <>{sentence}</>
  return (
    <>
      {sentence.slice(0, hiddenStart)}
      <u style={{ textDecoration: 'underline', textUnderlineOffset: '0.2em' }}>{hiddenTokenText}</u>
      {sentence.slice(hiddenStart + hiddenTokenText.length)}
    </>
  )
}

function ComparisonCard({ wordPack, attempt, scene }: { readonly wordPack: WordPack; readonly attempt: SceneAttempt; readonly scene: ContextScene }) {
  const clue = clueDisplay(attempt, scene)
  const clueIds = clue.kind === 'tokens' ? clue.tokenIds : []
  const tokenById = new Map<string, SentenceToken>(scene.sentences.flatMap((sentence) => sentence.tokens).map((token) => [token.id, token]))
  const clueLabels = clueIds.flatMap((tokenId) => {
    const text = tokenById.get(tokenId)?.text
    return typeof text === 'string' ? [text] : []
  })
  const targetToken = scene.sentences.flatMap((sentence) => sentence.tokens).find((token) => token.role === 'target')
  const targetSurface = targetToken?.targetSurface ?? targetToken?.text ?? wordPack.lemma

  return (
    <article className="comparison-scene-card" data-testid="comparison-scene-card" aria-labelledby={`comparison-scene-title-${scene.id}`}>
      <h3 id={`comparison-scene-title-${scene.id}`}>{scene.order === 1 ? '첫째 문장' : '둘째 문장'}</h3>
      <p className="comparison-sentence" data-testid={`comparison-sentence-${scene.id}`}>
        {scene.sentences.map((sentence) => (
          <span key={sentence.id}>
            {sentence.tokens.map((token) => {
              const isTarget = token.role === 'target'
              const isSelected = clueIds.includes(token.id)
              const content = tokenCopy(token, isSelected)
              return (
                <span key={token.id}>
                  {isTarget ? <strong>{content}</strong> : content}{' '}
                </span>
              )
            })}
          </span>
        ))}
      </p>
      <p>
        <span className="comparison-word-label">공통 표면형</span>{' '}
        <u style={{ textDecoration: 'underline', textUnderlineOffset: '0.2em' }}>{targetSurface}</u>
      </p>
      <p>
        <strong>이 문장에서 가리킨 뜻</strong>: {meaningLabel(wordPack, attempt.meaningDecision)}
      </p>
      <div>
        <h4>뜻을 가른 단서</h4>
        {clue.kind === 'insufficient' ? (
          <p>결정 단서가 없어요</p>
        ) : clue.kind === 'invalid' || clueLabels.length === 0 ? (
          <p>선택 단서 기록을 확인할 수 없어요</p>
        ) : (
          <>
            <span id={`selected-clue-description-${scene.id}`} hidden>밑줄 친 항목은 학생이 선택한 단서입니다.</span>
            <ul aria-label={`${scene.order === 1 ? '첫째' : '둘째'} 문장의 선택 단서`} aria-describedby={`selected-clue-description-${scene.id}`}>
            {clueLabels.map((label, index) => (
              <li key={`${label}-${index}`}>
                <u data-testid="selected-clue" style={{ textDecoration: 'underline', textUnderlineOffset: '0.2em' }}>{label}</u>
              </li>
            ))}
            </ul>
          </>
        )}
      </div>
    </article>
  )
}

export function ComparisonScreen({ wordPack, completedScenes, challenge, onConfirmCueNecessity, onClearFeedback }: ComparisonScreenProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState<CueNecessityDecision | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const firstRadioRef = useRef<HTMLInputElement>(null)
  const radioRefs = useRef<Partial<Record<CueNecessityDecision, HTMLInputElement | null>>>({})

  useEffect(() => {
    // The challenge owns the content boundary; a new word starts a fresh local choice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHidden(false)
    setSelectedDecision(null)
    setHasSubmitted(false)
    radioRefs.current = {}
  }, [challenge.id])

  useEffect(() => {
    if (isHidden) firstRadioRef.current?.focus()
  }, [isHidden])

  const handleHideCue = () => {
    onClearFeedback()
    setIsHidden(true)
    setSelectedDecision(null)
    setHasSubmitted(false)
  }

  const handleDecisionChange = (decision: CueNecessityDecision) => {
    if (selectedDecision === decision) return
    onClearFeedback()
    setSelectedDecision(decision)
    setHasSubmitted(false)
  }

  const handleSubmit = () => {
    if (!selectedDecision || hasSubmitted) return
    setHasSubmitted(true)
    onConfirmCueNecessity(selectedDecision)
    radioRefs.current[selectedDecision]?.focus()
  }

  return (
    <section className="comparison-card" aria-labelledby="comparison-title">
      <p className="scene-kicker">비교 갈림길</p>
      <FocusHeading level={2} focusKey={challenge.id} focusOnMount id="comparison-title">
        같은 낱말을 두 문장에서 비교해 보아요
      </FocusHeading>
      <div className="comparison-heading" role="group" aria-label="같은 낱말과 다른 뜻의 관계">
        <strong>글자는 같아요</strong>
        <span className="comparison-connector" aria-hidden="true">↔</span>
        <span className="comparison-word-label" data-testid="same-word-badge">같은 낱말</span>
        <strong>문장 속 뜻은 달라요</strong>
      </div>
      <div
        className="comparison-scene-grid"
        data-testid="comparison-scene-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))', gap: '1rem', alignItems: 'start' }}
      >
        {completedScenes.map((attempt) => {
          const scene = sceneForAttempt(wordPack, attempt)
          return scene ? <ComparisonCard key={scene.id} wordPack={wordPack} attempt={attempt} scene={scene} /> : null
        })}
      </div>

      <section className="necessity-challenge" aria-labelledby="necessity-title">
        <h3 id="necessity-title">필요 단서를 찾아 보아요</h3>
        {!isHidden ? (
          <>
            <p data-testid="necessity-original-sentence">
              <OriginalSentence sentence={challenge.originalSentence} hiddenTokenText={challenge.hiddenTokenText} />
            </p>
            <span id={`${challenge.id}-hidden-cue-description`} hidden>밑줄 친 어절이 가려집니다.</span>
            <button type="button" aria-describedby={`${challenge.id}-hidden-cue-description`} onClick={handleHideCue}>단서 하나 가리기</button>
          </>
        ) : (
          <>
            <p data-testid="necessity-hidden-sentence">{challenge.sentenceAfterHide}</p>
            <fieldset className="necessity-choice-group">
              <legend>가린 뒤 문장의 뜻은 어떠한가요?</legend>
              {CLARITY_CHOICES.map(({ value, label }) => (
                <label key={value}>
                  <input
                    ref={(element) => {
                      if (value === 'still-clear') firstRadioRef.current = element
                      radioRefs.current[value] = element
                    }}
                    type="radio"
                    name="cue-necessity"
                    value={value}
                    checked={selectedDecision === value}
                    onChange={() => handleDecisionChange(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <button type="button" disabled={!selectedDecision || hasSubmitted} onClick={handleSubmit}>판단 확인하기</button>
          </>
        )}
      </section>
    </section>
  )
}
