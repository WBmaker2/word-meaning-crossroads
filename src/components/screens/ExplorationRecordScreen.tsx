import { useRef, useState } from 'react'
import type { ExplorationRecord, WordExplorationRecord } from '../../domain/sessionTypes'
import { ConfirmRestartDialog } from '../common/ConfirmRestartDialog'
import { FocusHeading } from '../common/FocusHeading'

export interface ExplorationRecordScreenProps {
  readonly record: ExplorationRecord
  readonly onRestartRoute: () => void
  readonly onReturnToEntrance: () => void
  readonly onPrint: () => void
}

const EVIDENCE = [
  ['meaning', '뜻 구별'],
  ['evidence', '근거 사용'],
  ['uncertainty', '불확실성 판단'],
  ['clarity', '명확한 표현'],
] as const

const ROUTE_IDS = new Set(['core', 'extension', 'all'])
const ROUTE_LABELS = new Set(['기본 길 4개', '확장 길 4개', '전체 길 8개'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidScene(value: unknown, wordId: string): boolean {
  if (!isRecord(value) || typeof value.sceneId !== 'string' || typeof value.initialPrediction !== 'string' ||
    value.initialPrediction.length > 60 || (!String(value.sceneId).startsWith(`${wordId}-`)) ||
    (value.meaningDecision !== 'insufficient-context' && !String(value.meaningDecision).startsWith(`${wordId}:`)) ||
    typeof value.meaningLabel !== 'string' || value.meaningLabel.length === 0 || !isRecord(value.clue)) return false
  if (value.clue.kind === 'insufficient') return value.clue.label === '결정 단서가 없어요'
  return value.clue.kind === 'tokens' && Array.isArray(value.clue.labels) && value.clue.labels.length >= 1 && value.clue.labels.length <= 2 &&
    value.clue.labels.every((label) => typeof label === 'string' && label.length > 0)
}

function isValidWord(value: unknown): value is WordExplorationRecord {
  return isRecord(value) && typeof value.wordId === 'string' && typeof value.lemma === 'string' &&
    value.wordId.length > 0 && value.lemma.length > 0 && Array.isArray(value.scenes) && value.scenes.length === 3 && value.scenes.every((scene) => isValidScene(scene, value.wordId as string)) &&
    isRecord(value.cueNecessity) && ['still-clear', 'now-unclear'].includes(String(value.cueNecessity.decision)) &&
    typeof value.cueNecessity.explanation === 'string' && value.cueNecessity.explanation.length > 0 && isRecord(value.repair) &&
    typeof value.repair.solutionId === 'string' && value.repair.solutionId.startsWith(`${value.wordId}-`) &&
    typeof value.repair.completedSentence === 'string' && value.repair.completedSentence.length > 0
}

function validRecord(value: unknown): value is ExplorationRecord {
  if (!isRecord(value) || !ROUTE_IDS.has(String(value.routeId)) || !ROUTE_LABELS.has(String(value.routeLabel)) ||
    !Array.isArray(value.words) || value.words.length === 0 || !value.words.every(isValidWord) || !isRecord(value.evidence)) return false
  const evidence = value.evidence
  if (!EVIDENCE.every(([key]) => typeof evidence[key] === 'boolean')) return false
  const wordIds = value.words.map((word) => (word as WordExplorationRecord).wordId)
  const sceneIds = value.words.flatMap((word) => (word as WordExplorationRecord).scenes.map((scene) => scene.sceneId))
  return new Set(wordIds).size === wordIds.length && new Set(sceneIds).size === sceneIds.length
}

function clueText(scene: WordExplorationRecord['scenes'][number]): string {
  return scene.clue.kind === 'insufficient' ? scene.clue.label : scene.clue.labels.join(', ')
}

function necessityText(decision: WordExplorationRecord['cueNecessity']['decision']): string {
  return decision === 'still-clear' ? '여전히 분명해요' : '판단하기 어려워졌어요'
}

function safeEvidence(value: unknown, key: (typeof EVIDENCE)[number][0]): boolean {
  return isRecord(value) && value[key] === true
}

export function ExplorationRecordScreen({ record, onRestartRoute, onReturnToEntrance, onPrint }: ExplorationRecordScreenProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const restartTriggerRef = useRef<HTMLButtonElement>(null!)

  if (!validRecord(record)) {
    return (
      <section className="record-card record-card--placeholder" data-record-root aria-labelledby="record-placeholder-title">
        <FocusHeading level={2} focusKey="record-placeholder" focusOnMount id="record-placeholder-title">
          탐사 기록을 준비하지 못했어요
        </FocusHeading>
        <p>응답 기록이 온전하지 않아 내용을 안전하게 표시할 수 없어요. 입구로 돌아가 다시 시작해 주세요.</p>
        <button type="button" onClick={onReturnToEntrance}>입구로 돌아가기</button>
      </section>
    )
  }

  return (
    <section className="record-card" data-record-root aria-labelledby="record-title">
      <p className="scene-kicker">탐험을 돌아보는 시간</p>
      <FocusHeading level={2} focusKey={`record-${record.routeId}-${record.words.length}`} focusOnMount id="record-title">
        탐사 기록
      </FocusHeading>
      <p className="record-route-label">경로: <span>{record.routeLabel}</span></p>
      <aside className="privacy-notice record-privacy-notice" aria-label="개인정보 안내">
        응답은 새로고침하거나 탭을 닫으면 사라져요. 이 기록은 이 탭 안에만 머뭅니다.
      </aside>

      <section className="record-learning-goal" aria-labelledby="record-goal-title">
        <h3 id="record-goal-title">학습목표</h3>
        <p>같은 형태의 낱말이 문맥에 따라 다른 뜻을 나타낼 수 있음을 알고, 문장 속 단서로 뜻을 구별해요.</p>
      </section>

      <section className="record-summary" aria-label="배움 정리">
        <div className="record-takeaway">
          <h3 id="record-takeaway-title">내가 배운 것</h3>
          <p>같은 낱말도 문장에 따라 뜻이 달라져요. 주변 낱말을 단서로 살펴보면 더 정확하게 읽을 수 있어요.</p>
        </div>
        <div className="record-next-step">
          <h3 id="record-next-step-title">다음에 해 볼 것</h3>
          <p>다음에는 새 문장에서 단서를 찾아 뜻을 말해 보세요.</p>
        </div>
      </section>

      <div className="record-actions" aria-label="기록 조작">
        <button ref={restartTriggerRef} type="button" disabled={dialogOpen} onClick={() => setDialogOpen(true)}>다시 하기</button>
        <button type="button" disabled={dialogOpen} onClick={onReturnToEntrance}>입구로 돌아가기</button>
        <button type="button" disabled={dialogOpen} onClick={onPrint}>인쇄하기</button>
      </div>

      <section className="record-evidence" aria-labelledby="record-evidence-title">
        <h3 id="record-evidence-title">내가 해낸 것</h3>
        <ul>
          {EVIDENCE.map(([key, label]) => (
            <li key={key} data-evidence={key}>
              <strong>{label}</strong>
              <span>{safeEvidence(record.evidence, key) ? '기록됨' : '아직 기록되지 않음'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="record-responses" aria-labelledby="record-responses-title">
        <h3 id="record-responses-title">응답 기록</h3>
        {record.words.map((word, wordIndex) => (
          <article className="record-word" key={word.wordId}>
            <h4>{wordIndex + 1}. {word.lemma}</h4>
            <ol className="record-scenes">
              {word.scenes.map((scene, sceneIndex) => (
                <li key={scene.sceneId}>
                  <h5>{sceneIndex + 1}번째 장면</h5>
                  <dl>
                    <div><dt>최초 예상</dt><dd>{scene.initialPrediction}</dd></div>
                    <div><dt>선택 단서</dt><dd>{clueText(scene)}</dd></div>
                    <div><dt>최종 뜻</dt><dd>{scene.meaningLabel}</dd></div>
                  </dl>
                </li>
              ))}
            </ol>
            <div className="record-necessity">
              <h5>단서 가리기 판단</h5>
              <p><strong>{necessityText(word.cueNecessity.decision)}</strong></p>
              <p>{word.cueNecessity.explanation}</p>
            </div>
            <div className="record-repair">
              <h5>선택한 완성 문장</h5>
              <p>{word.repair.completedSentence}</p>
            </div>
          </article>
        ))}
      </section>

      <ConfirmRestartDialog
        open={dialogOpen}
        triggerRef={restartTriggerRef}
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false)
          onRestartRoute()
        }}
      />
    </section>
  )
}
