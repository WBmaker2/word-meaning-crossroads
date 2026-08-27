import type { ReactElement } from 'react';
import { FocusHeading } from '../components/common/FocusHeading';
import { LineSpacingControls } from '../components/common/LineSpacingControls';
import { LiveRegion } from '../components/common/LiveRegion';
import { ProgressHeader } from '../components/common/ProgressHeader';
import { TextScaleControls } from '../components/common/TextScaleControls';
import { UpdateHistoryDialog } from '../components/common/UpdateHistoryDialog';
import { useLineSpacing } from '../hooks/useLineSpacing';
import { useMissionSession } from '../hooks/useMissionSession';
import { useTextScale } from '../hooks/useTextScale';

export default function App(): ReactElement {
  const { state, feedback } = useMissionSession();
  const textScale = useTextScale();
  const lineSpacing = useLineSpacing();

  return (
    <div
      className="app-shell"
      data-text-scale={textScale.textScale}
      data-line-spacing={lineSpacing.lineSpacing}
      style={{ ...textScale.textScaleStyle, ...lineSpacing.lineSpacingStyle }}
    >
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="site-header">
        <p className="eyebrow">우리말 탐험 교실</p>
        <FocusHeading focusKey={state.phase}>낱말 뜻 갈림길</FocusHeading>
        <UpdateHistoryDialog />
      </header>
      <main id="main-content" className="main-content">
        <div className="shared-controls" aria-label="읽기 설정">
          <TextScaleControls value={textScale.textScale} onChange={textScale.setTextScale} />
          <LineSpacingControls value={lineSpacing.lineSpacing} onChange={lineSpacing.setLineSpacing} />
        </div>
        <ProgressHeader
          currentWordIndex={state.currentWordIndex + 1}
          totalWords={state.routeWordIds.length}
        />
        <LiveRegion
          tone={feedback?.tone ?? 'status'}
          message={feedback?.message ?? ''}
          feedbackSequence={state.feedbackSequence}
        />
        <section className="welcome-card" aria-labelledby="welcome-title">
          <p className="route-marker" aria-hidden="true">
            ✦
          </p>
          <h2 id="welcome-title">낱말의 뜻을 찾아 떠나요</h2>
          <p>곧 단어의 여러 뜻을 비교하고 알맞은 길을 골라 볼 수 있어요.</p>
        </section>
      </main>
    </div>
  );
}
