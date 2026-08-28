import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ExplorationRecord } from '../../domain/sessionTypes'
import { ExplorationRecordScreen } from './ExplorationRecordScreen'

const record: ExplorationRecord = {
  routeId: 'core',
  routeLabel: '기본 길 4개',
  evidence: { meaning: true, evidence: true, uncertainty: true, clarity: true },
  words: [{
    wordId: 'nun',
    lemma: '눈',
    scenes: [
      { sceneId: 'nun-snow-01', initialPrediction: '<img src=x onerror=alert(1)>', clue: { kind: 'tokens', labels: ['내려'] }, meaningDecision: 'nun:snow', meaningLabel: '내리는 눈' },
      { sceneId: 'nun-eye-02', initialPrediction: '보는 것', clue: { kind: 'tokens', labels: ['보았습니다.'] }, meaningDecision: 'nun:eye', meaningLabel: '보는 눈' },
      { sceneId: 'nun-uncertain-03', initialPrediction: '잘 모르겠어요', clue: { kind: 'insufficient', label: '결정 단서가 없어요' }, meaningDecision: 'insufficient-context', meaningLabel: '판단하기 어려움' },
    ],
    cueNecessity: { decision: 'still-clear', explanation: '눈으로가 남아 있어요.' },
    repair: { solutionId: 'nun-snow', completedSentence: '나는 창밖에 내리는 눈을 보았다.' },
  }],
}

describe('ExplorationRecordScreen', () => {
  afterEach(() => cleanup())

  it('shows ordered evidence and responses without score-like fields', () => {
    render(<ExplorationRecordScreen record={record} onRestartRoute={vi.fn()} onReturnToEntrance={vi.fn()} onPrint={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '탐사 기록' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '내가 배운 것' })).toHaveAttribute('id', 'record-takeaway-title')
    expect(screen.getByText('같은 낱말도 문장에 따라 뜻이 달라져요. 주변 낱말을 단서로 살펴보면 더 정확하게 읽을 수 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '내가 해낸 것' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '다음에 해 볼 것' })).toHaveAttribute('id', 'record-next-step-title')
    expect(screen.getByText('다음에는 새 문장에서 단서를 찾아 뜻을 말해 보세요.')).toBeInTheDocument()
    expect(document.getElementById('record-takeaway-title')!.compareDocumentPosition(document.getElementById('record-responses-title')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(document.getElementById('record-next-step-title')!.compareDocumentPosition(document.getElementById('record-responses-title')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('기본 길 4개')).toBeInTheDocument()
    expect(screen.getByText('뜻 구별')).toBeInTheDocument()
    expect(screen.getByText('근거 사용')).toBeInTheDocument()
    expect(screen.getByText('불확실성 판단')).toBeInTheDocument()
    expect(screen.getByText('명확한 표현')).toBeInTheDocument()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(screen.getByText('결정 단서가 없어요')).toBeInTheDocument()
    expect(screen.getByText('판단하기 어려움')).toBeInTheDocument()
    expect(screen.getByText('나는 창밖에 내리는 눈을 보았다.')).toBeInTheDocument()
    expect(document.querySelector('img')).not.toBeInTheDocument()
    expect(document.querySelector('script')).not.toBeInTheDocument()
    expect(screen.queryByText(/점수|정답률|등급|순위|소요 시간|학생 이름/)).not.toBeInTheDocument()
  })

  it('opens a destructive restart confirmation, traps focus, and preserves record on cancel', async () => {
    const user = userEvent.setup()
    const onRestartRoute = vi.fn()
    render(<ExplorationRecordScreen record={record} onRestartRoute={onRestartRoute} onReturnToEntrance={vi.fn()} onPrint={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: '다시 하기' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '응답을 지우고 다시 할까요?' })
    const background = document.querySelector('[data-record-root]') as HTMLElement
    expect(dialog.closest('.restart-dialog-backdrop')?.parentElement).toBe(document.body)
    expect(background).toHaveAttribute('inert', '')
    expect(background).toHaveAttribute('aria-hidden', 'true')
    expect(within(dialog).getByRole('button', { name: '응답 지우기' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: '응답 지우기' })).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus()
    const backgroundReturn = background.querySelector('.record-actions button:nth-child(2)') as HTMLButtonElement
    backgroundReturn.focus()
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(background).not.toHaveAttribute('inert')
    expect(background).not.toHaveAttribute('aria-hidden')
    expect(trigger).toHaveFocus()
    expect(screen.getByText('나는 창밖에 내리는 눈을 보았다.')).toBeInTheDocument()
    expect(onRestartRoute).not.toHaveBeenCalled()
  })

  it('confirms restart once and delegates return and print', async () => {
    const user = userEvent.setup()
    const onRestartRoute = vi.fn()
    const onReturnToEntrance = vi.fn()
    const onPrint = vi.fn()
    render(<ExplorationRecordScreen record={record} onRestartRoute={onRestartRoute} onReturnToEntrance={onReturnToEntrance} onPrint={onPrint} />)
    await user.click(screen.getByRole('button', { name: '다시 하기' }))
    await user.dblClick(screen.getByRole('button', { name: '응답 지우기' }))
    expect(onRestartRoute).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: '입구로 돌아가기' }))
    await user.click(screen.getByRole('button', { name: '인쇄하기' }))
    expect(onReturnToEntrance).toHaveBeenCalledTimes(1)
    expect(onPrint).toHaveBeenCalledTimes(1)
  })

  it('falls back safely for malformed nested scenes and duplicate record ids', () => {
    const malformedScene = { ...record.words[0]!.scenes[0], clue: { kind: 'tokens', labels: [{ unsafe: true }] } }
    const malformed = {
      ...record,
      words: [{ ...record.words[0]!, scenes: [malformedScene, record.words[0]!.scenes[1], record.words[0]!.scenes[2]] }],
    } as unknown as ExplorationRecord
    const { rerender } = render(<ExplorationRecordScreen record={malformed} onRestartRoute={vi.fn()} onReturnToEntrance={vi.fn()} onPrint={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '탐사 기록을 준비하지 못했어요' })).toBeInTheDocument()
    expect(screen.queryByText('unsafe')).not.toBeInTheDocument()

    const duplicateWords = { ...record, words: [...record.words, record.words[0]!] }
    rerender(<ExplorationRecordScreen record={duplicateWords} onRestartRoute={vi.fn()} onReturnToEntrance={vi.fn()} onPrint={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '탐사 기록을 준비하지 못했어요' })).toBeInTheDocument()

    const duplicateScenes = {
      ...record,
      words: [{ ...record.words[0]!, scenes: [record.words[0]!.scenes[0], record.words[0]!.scenes[0], record.words[0]!.scenes[2]] }],
    }
    rerender(<ExplorationRecordScreen record={duplicateScenes} onRestartRoute={vi.fn()} onReturnToEntrance={vi.fn()} onPrint={vi.fn()} />)
    expect(screen.getByRole('heading', { name: '탐사 기록을 준비하지 못했어요' })).toBeInTheDocument()
  })
})
