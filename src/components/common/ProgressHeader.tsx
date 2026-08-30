export interface ProgressHeaderProps {
  readonly currentWordIndex: number
  readonly totalWords: number
  readonly currentSceneIndex: number
  readonly totalScenes: number
}

export function ProgressHeader({ currentWordIndex, totalWords, currentSceneIndex, totalScenes }: ProgressHeaderProps) {
  if (totalWords < 1) return null

  const progressLabel = `현재 낱말 ${currentWordIndex}/${totalWords} · 장면 ${currentSceneIndex}/${totalScenes}`
  const sceneProgress = totalScenes > 1
    ? Math.min(100, Math.max(0, ((currentSceneIndex - 1) / (totalScenes - 1)) * 100))
    : 100

  return (
    <p
      className="progress-header"
      role="group"
      aria-label={progressLabel}
    >
      <span className="progress-header__label">{progressLabel}</span>
      <span className="progress-header__rail" aria-hidden="true">
        <span className="progress-header__fill" style={{ width: `${sceneProgress}%` }} />
      </span>
    </p>
  )
}
