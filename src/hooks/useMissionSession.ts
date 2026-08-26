import { useMemo, useReducer, type Dispatch } from 'react'
import { WORD_PACKS } from '../content/wordPacks'
import { getCurrentScene, getCurrentWordPack, getExplorationRecord } from '../domain/selectors'
import { createInitialSessionState, sessionReducer } from '../domain/sessionReducer'
import type { SessionAction, UseMissionSessionResult } from '../domain/sessionTypes'

export function useMissionSession(): UseMissionSessionResult {
  const [state, dispatch] = useReducer(sessionReducer, undefined, createInitialSessionState)
  const currentWordPack = useMemo(() => getCurrentWordPack(state, WORD_PACKS), [state])
  const currentScene = useMemo(() => getCurrentScene(state, WORD_PACKS), [state])
  const record = useMemo(() => getExplorationRecord(state, WORD_PACKS), [state])
  return {
    state,
    currentWordPack,
    currentScene,
    record,
    feedback: state.feedback,
    dispatch: dispatch as Dispatch<SessionAction>,
  }
}
