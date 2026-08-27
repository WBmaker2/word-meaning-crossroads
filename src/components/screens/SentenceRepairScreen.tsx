import { useEffect, useRef, useState } from 'react'
import { FocusHeading } from '../common/FocusHeading'
import type { RepairChallenge, RepairSolution, RepairSolutionId } from '../../domain/contentTypes'
import type { FeedbackInput } from '../../domain/sessionTypes'

export interface SentenceRepairScreenProps {
  readonly challenge: RepairChallenge
  readonly onConfirmRepair: (solutionId: RepairSolutionId) => void
  readonly onFeedback: (feedback: FeedbackInput) => void
  readonly onClearFeedback: () => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRepairSolution(value: unknown): value is RepairSolution {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.meaningId === 'string' &&
    typeof value.blockLabel === 'string' &&
    typeof value.completedSentence === 'string' &&
    typeof value.reviewNote === 'string'
  )
}

function reviewedSolutions(challenge: RepairChallenge): readonly RepairSolution[] {
  if (!isRecord(challenge) || !Array.isArray(challenge.solutions)) return []
  return challenge.solutions.filter(isRepairSolution)
}

export function SentenceRepairScreen({
  challenge,
  onConfirmRepair,
  onFeedback,
  onClearFeedback,
}: SentenceRepairScreenProps) {
  const [selectedSolutionId, setSelectedSolutionId] = useState<RepairSolutionId | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const radioRefs = useRef<Partial<Record<RepairSolutionId, HTMLInputElement | null>>>({})
  const solutions = reviewedSolutions(challenge)
  const selectedSolution = solutions.find((solution) => solution.id === selectedSolutionId)

  useEffect(() => {
    // A changed challenge is a new repair decision, even when the screen stays mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSolutionId(null)
    setHasSubmitted(false)
    radioRefs.current = {}
  }, [challenge.id])

  const handleSelection = (solutionId: RepairSolutionId) => {
    if (hasSubmitted || selectedSolutionId === solutionId) return
    const solution = solutions.find((candidate) => candidate.id === solutionId)
    if (!solution) return
    onClearFeedback()
    setSelectedSolutionId(solutionId)
    setHasSubmitted(false)
    onFeedback({ tone: 'status', message: solution.completedSentence })
  }

  const handleSubmit = () => {
    if (!selectedSolution || hasSubmitted) return
    setHasSubmitted(true)
    onConfirmRepair(selectedSolution.id)
    radioRefs.current[selectedSolution.id]?.focus()
  }

  return (
    <section className="sentence-repair-card" aria-labelledby="sentence-repair-title">
      <p className="scene-kicker">문장 정비소</p>
      <FocusHeading level={2} focusKey={challenge.id} focusOnMount id="sentence-repair-title">
        모호한 문장을 분명하게 고쳐 보아요
      </FocusHeading>
      <p id="sentence-repair-help">원문을 읽고, 뜻을 더 잘 알 수 있게 해 주는 정비 방법을 골라요.</p>

      <div className="sentence-repair-original">
        <h3>고치기 전 문장</h3>
        <p>{isRecord(challenge) && typeof challenge.ambiguousSentence === 'string' ? challenge.ambiguousSentence : '문장을 확인할 수 없어요.'}</p>
      </div>

      <fieldset
        className="sentence-repair-choice-group"
        aria-labelledby="sentence-repair-legend"
        aria-describedby="sentence-repair-help repair-preview"
      >
        <legend id="sentence-repair-legend">문장 정비 방법은 무엇일까요?</legend>
        {solutions.map((solution) => (
          <label className="sentence-repair-choice-card" key={solution.id}>
            <input
              ref={(element) => {
                radioRefs.current[solution.id] = element
              }}
              type="radio"
              name="sentence-repair"
              value={solution.id}
              checked={selectedSolutionId === solution.id}
              disabled={hasSubmitted}
              aria-describedby="repair-preview"
              onChange={() => handleSelection(solution.id)}
            />
            <span className="sentence-repair-choice-copy">
              <strong>{solution.blockLabel}</strong>
              <span>{solution.completedSentence}</span>
              <span>{solution.reviewNote}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <p id="repair-preview" className="sentence-repair-preview">
        {selectedSolution?.completedSentence ?? '아직 정비 방법을 고르지 않았어요.'}
      </p>

      <button type="button" disabled={!selectedSolution || hasSubmitted} onClick={handleSubmit}>
        문장을 분명하게 만들기
      </button>

      {hasSubmitted && selectedSolution ? (
        <section className="sentence-repair-alternatives" aria-labelledby="repair-alternatives-title">
          <h3 id="repair-alternatives-title">다른 방법도 있어요</h3>
          <p>선택하지 않은 방법도 뜻을 분명하게 해 주는 문장이에요.</p>
          <ul>
            {solutions
              .filter((solution) => solution.id !== selectedSolution.id)
              .map((solution) => (
                <li key={solution.id}>
                  <strong>{solution.blockLabel}</strong>
                  <span>{solution.completedSentence}</span>
                  <span>{solution.reviewNote}</span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}
