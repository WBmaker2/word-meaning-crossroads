import type {
  ContextScene,
  CueNecessityChallenge,
  CueNecessityDecision,
  MeaningDecisionId,
  RepairChallenge,
  RepairSolutionId,
} from './contentTypes'
import type {
  ClueDecision,
  ClueEvaluation,
  CueNecessityEvaluation,
  MeaningEvaluation,
  RepairEvaluation,
} from './sessionTypes'

const hasIntersection = (left: readonly string[], right: readonly string[]): boolean => {
  const rightSet = new Set(right)
  return left.some((value) => rightSet.has(value))
}

const wrongMeaningMessage = (scene: ContextScene, decision: MeaningDecisionId): string => {
  const base = scene.wrongChoiceFeedback[decision] ?? '두 뜻을 주변 단서와 비교해 보세요.'
  const comparisonGuidance = base.includes('비교') ? '' : ' 주변 단서를 비교해 보세요.'
  const uncertaintyGuidance =
    scene.expectedDecision === 'insufficient-context' && !base.includes('판단하기 어려움')
      ? ' 판단하기 어려움도 하나의 답이 될 수 있어요.'
      : ''
  return `${base}${comparisonGuidance}${uncertaintyGuidance}`
}

export function evaluateClueDecision(scene: ContextScene, decision: ClueDecision): ClueEvaluation {
  if (decision.kind === 'tokens') {
    const tokenIds = Array.isArray(decision.tokenIds) ? (decision.tokenIds as readonly string[]) : []
    const availableTokenIds = scene.sentences.flatMap((sentence) => sentence.tokens).map((token) => token.id)
    const availableTokenIdSet = new Set<string>(availableTokenIds)
    const uniqueTokenIds = new Set(tokenIds)
    const hasOnlyCurrentSentenceTokens = tokenIds.every((tokenId) => availableTokenIdSet.has(tokenId))
    if (
      tokenIds.length < 1 ||
      tokenIds.length > 2 ||
      uniqueTokenIds.size !== tokenIds.length ||
      !hasOnlyCurrentSentenceTokens
    ) {
      return {
        isCorrect: false,
        evidenceKind: 'too-many',
        message: '현재 문장에서 서로 다른 단어를 1~2개 골라요. 단서는 두 개까지예요.',
        canContinue: false,
      }
    }

    const hasDecisive = hasIntersection(tokenIds, scene.decisiveCueTokenIds)
    if (scene.expectedDecision === 'insufficient-context') {
      return {
        isCorrect: false,
        evidenceKind: 'insufficient-wrong',
        message: '이 문장만으로는 결정 단서가 없어 한 뜻으로 좁히기 어려워요. 결정하기 어려워요를 골라 보세요.',
        canContinue: false,
      }
    }
    if (hasDecisive) {
      return {
        isCorrect: true,
        evidenceKind: 'decisive',
        message: '뜻을 결정하는 단서를 찾았어요.',
        canContinue: true,
      }
    }
    return {
      isCorrect: false,
      evidenceKind: 'supportive-only',
      message: '도움이 되는 단서예요. 결정 단서가 되는 말을 하나 더 찾아 보세요.',
      canContinue: false,
    }
  }

  if (scene.expectedDecision === 'insufficient-context') {
    return {
      isCorrect: true,
      evidenceKind: 'insufficient-correct',
      message: '결정 단서가 없다는 점을 잘 살폈어요.',
      canContinue: true,
    }
  }
  return {
    isCorrect: false,
    evidenceKind: 'insufficient-wrong',
    message: '이 문장에는 뜻을 정할 수 있는 결정 단서가 있어요.',
    canContinue: false,
  }
}

export function evaluateMeaningDecision(scene: ContextScene, decision: MeaningDecisionId): MeaningEvaluation {
  const decisionKind = decision === 'insufficient-context' ? 'insufficient-context' : 'specific-meaning'
  if (decision === scene.expectedDecision) {
    return {
      isCorrect: true,
      decisionKind,
      message:
        decisionKind === 'insufficient-context'
          ? '단서가 부족하다는 판단도 근거 있는 선택이에요.'
          : '주변 단서를 근거로 뜻을 잘 골랐어요.',
      canContinue: true,
    }
  }
  return {
    isCorrect: false,
    decisionKind,
    message: wrongMeaningMessage(scene, decision),
    canContinue: false,
  }
}

export function evaluateCueNecessity(
  challenge: CueNecessityChallenge,
  decision: CueNecessityDecision,
): CueNecessityEvaluation {
  if (decision === challenge.expectedClarity) {
    return { isCorrect: true, message: challenge.explanation, canContinue: true }
  }
  return {
    isCorrect: false,
    message: '가린 뒤 남은 말만으로 뜻을 정할 수 있는지 다시 비교해 보세요.',
    canContinue: false,
  }
}

export function evaluateRepairSelection(
  challenge: RepairChallenge,
  selectionId: RepairSolutionId,
): RepairEvaluation {
  const selected = challenge.solutions.find((solution) => solution.id === selectionId)
  const alternativeSolutionIds = challenge.solutions
    .filter((solution) => solution.id !== selectionId)
    .map((solution) => solution.id)

  if (!selected) {
    return {
      isCorrect: false,
      message: '이 문장에 맞는 정비 블록을 골라 보세요.',
      alternativeSolutionIds,
    }
  }

  return {
    isCorrect: true,
    message: `${selected.reviewNote} 이제 한 가지 뜻으로 읽을 수 있어요.`,
    completedSentence: selected.completedSentence,
    alternativeSolutionIds,
  }
}
