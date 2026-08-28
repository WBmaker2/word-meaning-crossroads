import type { ReactElement } from 'react';
import { FocusHeading } from '../components/common/FocusHeading';
import { LineSpacingControls } from '../components/common/LineSpacingControls';
import { LiveRegion } from '../components/common/LiveRegion';
import { ProgressHeader } from '../components/common/ProgressHeader';
import { TextScaleControls } from '../components/common/TextScaleControls';
import { UpdateHistoryDialog } from '../components/common/UpdateHistoryDialog';
import { ContextSceneScreen } from '../components/screens/ContextSceneScreen';
import { ClueInvestigationScreen } from '../components/screens/ClueInvestigationScreen';
import { ComparisonScreen } from '../components/screens/ComparisonScreen';
import { EntranceScreen } from '../components/screens/EntranceScreen';
import { ExplorationRecordScreen } from '../components/screens/ExplorationRecordScreen';
import { MeaningSignpostScreen } from '../components/screens/MeaningSignpostScreen';
import { SentenceRepairScreen } from '../components/screens/SentenceRepairScreen';
import { ROUTES } from '../content/routes';
import type { ContextScene, MeaningDefinition, MeaningDecisionId, WordPack } from '../domain/contentTypes';
import { evaluateClueDecision, evaluateMeaningDecision } from '../domain/evaluation';
import type { ClueDecision, SceneAttempt } from '../domain/sessionTypes';
import { useLineSpacing } from '../hooks/useLineSpacing';
import { useMissionSession } from '../hooks/useMissionSession';
import { useTextScale } from '../hooks/useTextScale';

function findCandidateMeanings(
  wordPack: WordPack,
  scene: ContextScene,
): readonly [MeaningDefinition, MeaningDefinition] | null {
  if (scene.candidateMeaningIds.length !== 2) return null;
  const [firstId, secondId] = scene.candidateMeaningIds;
  if (!firstId || !secondId || firstId === secondId) return null;
  const first = wordPack.meanings.find((meaning) => meaning.id === firstId);
  const second = wordPack.meanings.find((meaning) => meaning.id === secondId);
  if (!first || !second) return null;
  return [first, second];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sceneTokens(scene: ContextScene): readonly { readonly id: string; readonly role: string }[] | null {
  if (!Array.isArray(scene.sentences)) return null;
  const tokens: { readonly id: string; readonly role: string }[] = [];
  for (const sentence of scene.sentences) {
    if (!isRecord(sentence) || !Array.isArray(sentence.tokens)) return null;
    for (const token of sentence.tokens) {
      if (!isRecord(token) || typeof token.id !== 'string' || typeof token.role !== 'string') return null;
      tokens.push({ id: token.id, role: token.role });
    }
  }
  return tokens;
}

function validCompletedSceneAttempt(
  wordPack: WordPack,
  scene: ContextScene,
  value: unknown,
): SceneAttempt | null {
  if (!isRecord(value) || value.sceneId !== scene.id) return null;
  const meaningEvaluation = value.meaningEvaluation;
  const clueEvaluation = value.clueEvaluation;
  if (
    !isRecord(meaningEvaluation) ||
    meaningEvaluation.isCorrect !== true ||
    meaningEvaluation.canContinue !== true ||
    !['specific-meaning', 'insufficient-context'].includes(String(meaningEvaluation.decisionKind)) ||
    typeof meaningEvaluation.message !== 'string'
  ) return null;
  if (
    !isRecord(clueEvaluation) ||
    clueEvaluation.isCorrect !== true ||
    clueEvaluation.canContinue !== true ||
    !['decisive', 'supportive-only', 'insufficient-correct', 'insufficient-wrong', 'too-many'].includes(String(clueEvaluation.evidenceKind)) ||
    typeof clueEvaluation.message !== 'string'
  ) return null;
  if (typeof value.initialPrediction !== 'string') return null;
  if (typeof value.meaningDecision !== 'string' || value.meaningDecision === 'insufficient-context') return null;
  if (!Array.isArray(wordPack.meanings) || !wordPack.meanings.some((meaning) => meaning.id === value.meaningDecision)) return null;

  const clueDecision = value.clueDecision;
  if (!isRecord(clueDecision) || clueDecision.kind !== 'tokens' || !Array.isArray(clueDecision.tokenIds)) return null;
  if (clueDecision.tokenIds.length < 1 || clueDecision.tokenIds.length > 2) return null;
  if (!clueDecision.tokenIds.every((tokenId): tokenId is string => typeof tokenId === 'string')) return null;
  if (new Set(clueDecision.tokenIds).size !== clueDecision.tokenIds.length) return null;
  const tokens = sceneTokens(scene);
  if (!tokens) return null;
  const available = new Map(tokens.map((token) => [token.id, token]));
  if (!clueDecision.tokenIds.every((tokenId) => available.has(tokenId) && available.get(tokenId)?.role !== 'target')) return null;
  const canonicalClue = evaluateClueDecision(scene, clueDecision as unknown as ClueDecision);
  const canonicalMeaning = evaluateMeaningDecision(scene, value.meaningDecision as MeaningDecisionId);
  if (!canonicalClue.isCorrect || !canonicalClue.canContinue || !canonicalMeaning.isCorrect || !canonicalMeaning.canContinue) return null;
  if (
    meaningEvaluation.isCorrect !== canonicalMeaning.isCorrect ||
    meaningEvaluation.canContinue !== canonicalMeaning.canContinue ||
    meaningEvaluation.decisionKind !== canonicalMeaning.decisionKind ||
    clueEvaluation.isCorrect !== canonicalClue.isCorrect ||
    clueEvaluation.canContinue !== canonicalClue.canContinue ||
    clueEvaluation.evidenceKind !== canonicalClue.evidenceKind
  ) return null;
  return value as unknown as SceneAttempt;
}

function findCompletedComparisonScenes(
  wordPack: WordPack,
  attempts: unknown,
): readonly [SceneAttempt, SceneAttempt] | null {
  if (!Array.isArray(attempts) || !Array.isArray(wordPack.scenes)) return null;
  const wordAttempt = attempts.find((attempt) => isRecord(attempt) && attempt.wordId === wordPack.id);
  if (!isRecord(wordAttempt) || !Array.isArray(wordAttempt.scenes)) return null;
  const firstScene = wordPack.scenes.find((scene) => isRecord(scene) && scene.order === 1);
  const secondScene = wordPack.scenes.find((scene) => isRecord(scene) && scene.order === 2);
  if (!firstScene || !secondScene) return null;
  const firstValue = wordAttempt.scenes.find((attempt) => isRecord(attempt) && attempt.sceneId === firstScene.id);
  const secondValue = wordAttempt.scenes.find((attempt) => isRecord(attempt) && attempt.sceneId === secondScene.id);
  const firstAttempt = validCompletedSceneAttempt(wordPack, firstScene, firstValue);
  const secondAttempt = validCompletedSceneAttempt(wordPack, secondScene, secondValue);
  if (!firstAttempt || !secondAttempt) return null;
  return [firstAttempt, secondAttempt];
}

export default function App(): ReactElement {
  const { state, currentWordPack, currentScene, record, feedback, dispatch } = useMissionSession();
  const textScale = useTextScale();
  const lineSpacing = useLineSpacing();
  const candidateMeanings = currentWordPack && currentScene
    ? findCandidateMeanings(currentWordPack, currentScene)
    : null;
  const completedComparisonScenes = currentWordPack
    ? findCompletedComparisonScenes(currentWordPack, state.attempts)
    : null;

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
        <div className="site-heading">
          <p className="eyebrow">우리말 탐험 교실</p>
          <h1>낱말 뜻 갈림길</h1>
        </div>
        <UpdateHistoryDialog />
      </header>
      <main id="main-content" className="main-content" tabIndex={-1}>
        <div className="shared-controls" aria-label="읽기 설정">
          <TextScaleControls value={textScale.textScale} onChange={textScale.setTextScale} />
          <LineSpacingControls value={lineSpacing.lineSpacing} onChange={lineSpacing.setLineSpacing} />
        </div>
        <ProgressHeader
          currentWordIndex={state.currentWordIndex + 1}
          totalWords={state.routeWordIds.length}
          currentSceneIndex={state.currentSceneIndex + 1}
          totalScenes={3}
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
        ) : state.phase === 'meaning-signpost' && currentScene && candidateMeanings ? (
          <MeaningSignpostScreen
            scene={currentScene}
            candidateMeanings={candidateMeanings}
            onConfirmMeaning={(decision) => dispatch({ type: 'CONFIRM_MEANING', decision })}
            onClearFeedback={() => dispatch({ type: 'CLEAR_FEEDBACK' })}
          />
        ) : state.phase === 'comparison' && currentWordPack && completedComparisonScenes ? (
          <ComparisonScreen
            wordPack={currentWordPack}
            completedScenes={completedComparisonScenes}
            challenge={currentWordPack.necessityChallenge}
            onConfirmCueNecessity={(decision) => dispatch({ type: 'CONFIRM_CUE_NECESSITY', decision })}
            onClearFeedback={() => dispatch({ type: 'CLEAR_FEEDBACK' })}
          />
        ) : state.phase === 'sentence-repair' && currentWordPack ? (
          <SentenceRepairScreen
            challenge={currentWordPack.repair}
            onConfirmRepair={(solutionId) => dispatch({ type: 'CONFIRM_REPAIR', solutionId })}
            onFeedback={(nextFeedback) => dispatch({ type: 'ANNOUNCE_FEEDBACK', feedback: nextFeedback })}
            onClearFeedback={() => dispatch({ type: 'CLEAR_FEEDBACK' })}
          />
        ) : state.phase === 'record' && record ? (
          <ExplorationRecordScreen
            record={record}
            onRestartRoute={() => dispatch({ type: 'RESTART_ROUTE' })}
            onReturnToEntrance={() => dispatch({ type: 'RETURN_TO_ENTRANCE' })}
            onPrint={() => window.print()}
          />
        ) : state.phase === 'record' ? (
          <section className="record-card record-card--placeholder" data-record-root aria-labelledby="record-placeholder-title">
            <FocusHeading level={2} focusKey="record-placeholder" focusOnMount id="record-placeholder-title">
              탐사 기록을 준비하지 못했어요
            </FocusHeading>
            <p>응답 기록이 온전하지 않아 내용을 안전하게 표시할 수 없어요. 입구로 돌아가 다시 시작해 주세요.</p>
            <button type="button" onClick={() => dispatch({ type: 'RETURN_TO_ENTRANCE' })}>입구로 돌아가기</button>
          </section>
        ) : (
          <section className="welcome-card" aria-labelledby="welcome-title">
            <p className="route-marker" aria-hidden="true">✦</p>
            <FocusHeading level={2} focusKey="welcome" focusOnMount id="welcome-title">
              다음 탐험을 준비하고 있어요
            </FocusHeading>
            <p>현재 단계의 화면을 곧 보여 드릴게요.</p>
          </section>
        )}
      </main>
    </div>
  );
}
