export interface ProgressHeaderProps {
  readonly currentWordIndex: number
  readonly totalWords: number
  readonly currentSceneIndex: number
  readonly totalScenes: number
}

export function ProgressHeader({ currentWordIndex, totalWords, currentSceneIndex, totalScenes }: ProgressHeaderProps) {
  if (totalWords < 1) return null

  const progressLabel = `현재 낱말 ${currentWordIndex}/${totalWords} · 장면 ${currentSceneIndex}/${totalScenes}`

  return (
    <p
      className="progress-header"
      role="group"
      aria-label={progressLabel}
    >
      {progressLabel}
    </p>
  )
}
