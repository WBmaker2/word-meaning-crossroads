import { createPortal } from 'react-dom'
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
      closeRef.current?.focus({ preventScroll: true })
      return
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false
      triggerRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const background = triggerRef.current?.closest<HTMLElement>('.app-shell')
    if (!background) return
    const originalInert = background.getAttribute('inert')
    const originalAriaHidden = background.getAttribute('aria-hidden')
    const printQuery = typeof window.matchMedia === 'function' ? window.matchMedia('print') : null
    let isPrinting = printQuery?.matches ?? false
    const restoreOriginalBackground = () => {
      if (originalInert === null) background.removeAttribute('inert')
      else background.setAttribute('inert', originalInert)
      if (originalAriaHidden === null) background.removeAttribute('aria-hidden')
      else background.setAttribute('aria-hidden', originalAriaHidden)
    }
    const syncBackground = () => {
      if (isPrinting) {
        restoreOriginalBackground()
        return
      }
      background.setAttribute('inert', '')
      background.setAttribute('aria-hidden', 'true')
    }
    const onPrintMediaChange = (event: MediaQueryListEvent) => {
      isPrinting = event.matches
      syncBackground()
    }
    const onBeforePrint = () => {
      isPrinting = true
      syncBackground()
    }
    const onAfterPrint = () => {
      isPrinting = false
      syncBackground()
    }
    syncBackground()
    printQuery?.addEventListener('change', onPrintMediaChange)
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      printQuery?.removeEventListener('change', onPrintMediaChange)
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
      restoreOriginalBackground()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const controls = Array.from(document.querySelectorAll<HTMLElement>(
        '.history-dialog button:not([disabled]), .history-dialog input:not([disabled]), .history-dialog select:not([disabled]), .history-dialog textarea:not([disabled]), .history-dialog a[href], .history-dialog [tabindex]:not([tabindex="-1"])',
      ))
      if (controls.length === 0) return
      const activeIndex = controls.indexOf(document.activeElement as HTMLElement)
      const nextIndex = event.shiftKey
        ? (activeIndex <= 0 ? controls.length - 1 : activeIndex - 1)
        : (activeIndex < 0 || activeIndex === controls.length - 1 ? 0 : activeIndex + 1)
      event.preventDefault()
      controls[nextIndex]?.focus({ preventScroll: true })
    }
    const handleFocusIn = (event: FocusEvent) => {
      const dialog = document.querySelector<HTMLElement>('.history-dialog')
      if (dialog && !dialog.contains(event.target as Node)) {
        closeRef.current?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
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
          '--update-history-right': 'calc(12px + env(safe-area-inset-right))',
          '--update-history-bottom': 'calc(12px + env(safe-area-inset-bottom))',
        } as CSSProperties}
        onClick={() => setIsOpen(true)}
      >
        업데이트 내역
      </button>
      {isOpen ? (
        createPortal(
          <div className="history-backdrop" role="presentation">
            <div className="history-dialog" role="dialog" aria-modal="true" aria-labelledby="update-history-title">
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
          </div>,
          document.body,
        )
      ) : null}
    </>
  )
}
