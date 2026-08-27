export interface ProgressHeaderProps {
  readonly currentWordIndex: number
  readonly totalWords: number
}

export function ProgressHeader({ currentWordIndex, totalWords }: ProgressHeaderProps) {
  if (totalWords < 1) return null

  return (
    <p
      className="progress-header"
      role="group"
      aria-label={`현재 낱말 ${currentWordIndex}번째, 전체 ${totalWords}개`}
    >
      현재 낱말 {currentWordIndex}/{totalWords}
    </p>
  )
}
