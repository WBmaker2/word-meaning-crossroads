import type { ContextScene, WordId } from '../../domain/contentTypes'

export interface NeutralCrossroadsIllustrationProps {
  readonly illustrationId: ContextScene['illustrationId']
  readonly wordId: WordId
}

interface IllustrationPalette {
  readonly surface: string
  readonly road: string
  readonly roadEdge: string
  readonly marker: string
  readonly step: string
}

const PALETTES: Readonly<Record<WordId, IllustrationPalette>> = {
  nun: { surface: '#e8f1ed', road: '#5d8b7a', roadEdge: '#2e5f50', marker: '#f5c96a', step: '#c95c3d' },
  bae: { surface: '#e9eef5', road: '#6d82a8', roadEdge: '#3e557e', marker: '#f5c96a', step: '#c95c3d' },
  bam: { surface: '#eee9f2', road: '#806d99', roadEdge: '#554267', marker: '#f5c96a', step: '#c95c3d' },
  mal: { surface: '#f3eadf', road: '#b57d51', roadEdge: '#754b2e', marker: '#f5c96a', step: '#c95c3d' },
  chada: { surface: '#e7f0f1', road: '#4e8a91', roadEdge: '#2e5c63', marker: '#f5c96a', step: '#c95c3d' },
  dari: { surface: '#e9edf6', road: '#7289bc', roadEdge: '#455d8d', marker: '#f5c96a', step: '#c95c3d' },
  sseuda: { surface: '#f2ebdf', road: '#a18362', roadEdge: '#694f37', marker: '#f5c96a', step: '#c95c3d' },
  gamda: { surface: '#e9f0e9', road: '#71936f', roadEdge: '#456345', marker: '#f5c96a', step: '#c95c3d' },
}

export function NeutralCrossroadsIllustration({ illustrationId, wordId }: NeutralCrossroadsIllustrationProps) {
  const palette = PALETTES[wordId]

  return (
    <svg
      aria-hidden="true"
      className="neutral-crossroads-illustration"
      data-illustration-id={illustrationId}
      data-testid="neutral-illustration"
      focusable="false"
      viewBox="0 0 200 120"
      width="200"
      height="120"
    >
      <rect x="8" y="8" width="184" height="104" rx="28" fill={palette.surface} />
      <path d="M100 60 30 24M100 60l70-36M100 60l-70 36M100 60l70 36" fill="none" stroke={palette.roadEdge} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100 60 30 24M100 60l70-36M100 60l-70 36M100 60l70 36" fill="none" stroke={palette.road} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy="60" r="12" fill={palette.marker} stroke={palette.roadEdge} strokeWidth="4" />
      <circle cx="100" cy="60" r="3" fill={palette.roadEdge} />
      <g fill={palette.step}>
        <ellipse cx="83" cy="78" rx="4" ry="7" transform="rotate(-26 83 78)" />
        <ellipse cx="73" cy="86" rx="4" ry="7" transform="rotate(-26 73 86)" />
        <ellipse cx="117" cy="42" rx="4" ry="7" transform="rotate(-26 117 42)" />
        <ellipse cx="127" cy="34" rx="4" ry="7" transform="rotate(-26 127 34)" />
      </g>
    </svg>
  )
}
