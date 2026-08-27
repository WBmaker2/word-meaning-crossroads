import { useEffect, useRef, useState } from 'react'
import type { FeedbackTone } from '../../domain/sessionTypes'

export interface LiveRegionProps {
  readonly tone: FeedbackTone
  readonly message: string
  readonly feedbackSequence: number
}

export function LiveRegion({ tone, message, feedbackSequence }: LiveRegionProps) {
  const [spokenMessage, setSpokenMessage] = useState(message)
  const previousSequence = useRef(feedbackSequence)
  const pendingAnnouncement = useRef(0)

  useEffect(() => {
    const announcementId = pendingAnnouncement.current + 1
    pendingAnnouncement.current = announcementId
    if (previousSequence.current === feedbackSequence) {
      setSpokenMessage(message)
      return
    }

    previousSequence.current = feedbackSequence
    setSpokenMessage('')
    const frame = requestAnimationFrame(() => {
      if (pendingAnnouncement.current === announcementId) setSpokenMessage(message)
    })
    return () => {
      cancelAnimationFrame(frame)
      if (pendingAnnouncement.current === announcementId) pendingAnnouncement.current += 1
    }
  }, [feedbackSequence, message])

  const isError = tone === 'error'
  return (
    <div
      data-feedback-announcer
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {spokenMessage}
    </div>
  )
}
