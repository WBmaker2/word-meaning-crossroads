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

  useEffect(() => {
    if (previousSequence.current === feedbackSequence) {
      setSpokenMessage(message)
      return
    }

    previousSequence.current = feedbackSequence
    setSpokenMessage('')
    const frame = requestAnimationFrame(() => setSpokenMessage(message))
    return () => cancelAnimationFrame(frame)
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
