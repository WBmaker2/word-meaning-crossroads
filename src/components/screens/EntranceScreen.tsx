import { FocusHeading } from '../common/FocusHeading'
import type { RouteDefinition, RouteId, WordId } from '../../domain/contentTypes'

export interface EntranceScreenProps {
  readonly routes: readonly RouteDefinition[]
  readonly onStartRoute: (routeId: RouteId) => void
}

const WORD_LABELS: Readonly<Record<WordId, string>> = {
  nun: '눈',
  bae: '배',
  bam: '밤',
  mal: '말',
  chada: '차다',
  dari: '다리',
  sseuda: '쓰다',
  gamda: '감다',
}

export function EntranceScreen({ routes, onStartRoute }: EntranceScreenProps) {
  return (
    <section className="entrance-card" aria-labelledby="entrance-title">
      <div className="entrance-goal" data-testid="entrance-goal">
        <FocusHeading level={2} focusKey="entrance" id="entrance-title">
          오늘의 학습 목표
        </FocusHeading>
        <p>같은 모양의 낱말도 문장 속 단서에 따라 뜻이 달라질 수 있어요.</p>
        <p>주변 낱말을 살펴보고, 알맞은 뜻이나 판단하기 어려움을 골라 보아요.</p>
      </div>
      <aside className="privacy-notice" aria-label="응답과 개인정보 안내">
        <p>응답은 새로고침하면 사라져요.</p>
        <p>이름을 쓰지 않으며 응답은 외부로 보내지지 않아요.</p>
        <p>이 탭을 닫으면 학습 기록도 남지 않아요.</p>
      </aside>
      <section className="entrance-routes" data-testid="entrance-routes" aria-labelledby="route-title">
        <h3 id="route-title">학습 경로를 골라요</h3>
        <div className="route-list">
          {routes.map((route, routeIndex) => (
            <article
              className={['route-card', routeIndex === 0 ? 'route-card--recommended' : ''].filter(Boolean).join(' ')}
              data-route-card
              data-route-priority={routeIndex === 0 ? 'recommended' : undefined}
              key={route.id}
            >
              {routeIndex === 0 ? <span className="route-card-badge">처음이라면 여기부터</span> : null}
              <h4>{route.label}</h4>
              <ul aria-label={`${route.label} 낱말 목록`}>
                {route.wordIds.map((wordId) => (
                  <li key={wordId}>{WORD_LABELS[wordId]}</li>
                ))}
              </ul>
              <p>권장 시간: {route.recommendedMinutes}</p>
              <button type="button" onClick={() => onStartRoute(route.id)}>
                {route.label}
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
