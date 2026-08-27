import type { ReactElement } from 'react';
import { FocusHeading } from '../components/common/FocusHeading';
import { LineSpacingControls } from '../components/common/LineSpacingControls';
import { LiveRegion } from '../components/common/LiveRegion';
import { ProgressHeader } from '../components/common/ProgressHeader';
import { TextScaleControls } from '../components/common/TextScaleControls';
import { UpdateHistoryDialog } from '../components/common/UpdateHistoryDialog';
import { ContextSceneScreen } from '../components/screens/ContextSceneScreen';
import { ClueInvestigationScreen } from '../components/screens/ClueInvestigationScreen';
import { EntranceScreen } from '../components/screens/EntranceScreen';
import { ROUTES } from '../content/routes';
import { useLineSpacing } from '../hooks/useLineSpacing';
import { useMissionSession } from '../hooks/useMissionSession';
import { useTextScale } from '../hooks/useTextScale';

export default function App(): ReactElement {
  const { state, currentWordPack, currentScene, feedback, dispatch } = useMissionSession();
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
        {state.phase === 'entrance' ? (
          <EntranceScreen
            routes={ROUTES}
            onStartRoute={(routeId) => dispatch({ type: 'START_ROUTE', routeId })}
          />
        ) : state.phase === 'prediction' && currentWordPack && currentScene ? (
          <ContextSceneScreen
            wordPack={currentWordPack}
            scene={currentScene}
            initialPrediction={state.draftPrediction}
            onSavePrediction={(prediction) => dispatch({ type: 'SAVE_PREDICTION', prediction })}
            onFeedback={(nextFeedback) => dispatch({ type: 'ANNOUNCE_FEEDBACK', feedback: nextFeedback })}
            onClearFeedback={() => dispatch({ type: 'CLEAR_FEEDBACK' })}
          />
        ) : state.phase === 'clue-investigation' && currentScene ? (
          <ClueInvestigationScreen
            scene={currentScene}
            onSubmitClueDecision={(decision) => dispatch({ type: 'SAVE_CLUE_DECISION', decision })}
            onFeedback={(nextFeedback) => dispatch({ type: 'ANNOUNCE_FEEDBACK', feedback: nextFeedback })}
            onClearFeedback={() => dispatch({ type: 'CLEAR_FEEDBACK' })}
          />
        ) : (
          <section className="welcome-card" aria-labelledby="welcome-title">
            <p className="route-marker" aria-hidden="true">✦</p>
            <h2 id="welcome-title">다음 탐험을 준비하고 있어요</h2>
            <p>현재 단계의 화면을 곧 보여 드릴게요.</p>
          </section>
        )}
      </main>
    </div>
  );
}
