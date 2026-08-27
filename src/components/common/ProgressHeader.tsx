export interface ProgressHeaderProps {
  readonly currentWordIndex: number
  readonly totalWords: number
}

export function ProgressHeader({ currentWordIndex, totalWords }: ProgressHeaderProps) {
  if (totalWords < 1) return null

  return (
    <p className="progress-header" aria-label={`현재 낱말 ${currentWordIndex}/${totalWords}`}>
      현재 낱말 {currentWordIndex}/{totalWords}
    </p>
  )
}
