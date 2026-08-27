import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export interface ConfirmRestartDialogProps {
  readonly open: boolean
  readonly triggerRef: RefObject<HTMLButtonElement>
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

export function ConfirmRestartDialog({ open, triggerRef, onConfirm, onCancel }: ConfirmRestartDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const cancelled = useRef(false)

  useEffect(() => {
    if (!open) return
    const background = triggerRef.current?.closest<HTMLElement>('.app-shell') ??
      triggerRef.current?.closest<HTMLElement>('[data-record-root]')
    if (!background) return
    const originalInert = background.getAttribute('inert')
    const originalAriaHidden = background.getAttribute('aria-hidden')
    background.setAttribute('inert', '')
    background.setAttribute('aria-hidden', 'true')
    return () => {
      if (originalInert === null) background.removeAttribute('inert')
      else background.setAttribute('inert', originalInert)
      if (originalAriaHidden === null) background.removeAttribute('aria-hidden')
      else background.setAttribute('aria-hidden', originalAriaHidden)
    }
  }, [open, triggerRef])

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      cancelled.current = false
      cancelRef.current?.focus()
      return
    }
    if (wasOpen.current && cancelled.current) {
      wasOpen.current = false
      triggerRef.current?.focus()
    }
  }, [open, triggerRef])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelled.current = true
        onCancel()
        return
      }
      if (event.key !== 'Tab') return
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
      ) ?? [])
      if (controls.length === 0) return
      const activeIndex = controls.indexOf(document.activeElement as HTMLElement)
      const nextIndex = event.shiftKey
        ? (activeIndex <= 0 ? controls.length - 1 : activeIndex - 1)
        : (activeIndex < 0 || activeIndex === controls.length - 1 ? 0 : activeIndex + 1)
      if (activeIndex < 0 || controls.length === 1 || nextIndex !== activeIndex) {
        event.preventDefault()
        controls[nextIndex]?.focus()
      }
    }
    const onFocusIn = (event: FocusEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) {
        cancelRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [onCancel, open])

  if (!open) return null

  return createPortal(
    <div className="restart-dialog-backdrop" role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', background: 'rgb(0 0 0 / 45%)' }}>
      <div ref={dialogRef} className="restart-dialog" role="dialog" aria-modal="true" aria-labelledby="restart-dialog-title" aria-describedby="restart-dialog-description" style={{ color: 'var(--ink, #000)', background: 'var(--card, #fff)', padding: '1.5rem', width: 'min(32rem, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h2 id="restart-dialog-title">응답을 지우고 다시 할까요?</h2>
        <p id="restart-dialog-description">이 경로에서 작성한 응답 기록을 모두 지웁니다. 이 작업은 되돌릴 수 없어요.</p>
        <div className="restart-dialog-actions">
          <button ref={cancelRef} type="button" onClick={() => { cancelled.current = true; onCancel() }}>취소</button>
          <button ref={confirmRef} type="button" onClick={onConfirm}>응답 지우기</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
