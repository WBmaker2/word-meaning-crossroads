import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { UPDATE_HISTORY, type UpdateHistoryEntry } from '../../content/updateHistory'

export interface UpdateHistoryDialogProps {
  readonly entries?: readonly UpdateHistoryEntry[]
}

export function UpdateHistoryDialog({ entries = UPDATE_HISTORY }: UpdateHistoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true
      closeRef.current?.focus()
      return
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false
      triggerRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        className="update-history-trigger"
        type="button"
        style={{
          position: 'fixed',
          right: 'var(--update-history-right)',
          bottom: 'var(--update-history-bottom)',
          zIndex: 10,
          '--update-history-right': 'max(1rem, env(safe-area-inset-right))',
          '--update-history-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        } as CSSProperties}
        onClick={() => setIsOpen(true)}
      >
        업데이트 내역
      </button>
      {isOpen ? (
        <div className="history-backdrop" role="presentation">
          <div
            className="history-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-history-title"
            onKeyDown={(event) => {
              if (event.key === 'Tab') {
                event.preventDefault()
                closeRef.current?.focus()
              }
            }}
          >
            <h2 id="update-history-title">업데이트 내역</h2>
            <ul>
              {entries.map((entry) => (
                <li key={`${entry.date}-${entry.category}-${entry.detail}`}>
                  <time dateTime={entry.date}>{entry.date}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{entry.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{entry.detail}</span>
                </li>
              ))}
            </ul>
            <button ref={closeRef} type="button" onClick={() => setIsOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
