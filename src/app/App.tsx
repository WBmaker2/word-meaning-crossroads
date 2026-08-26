import type { ReactElement } from 'react';

export default function App(): ReactElement {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="site-header">
        <p className="eyebrow">우리말 탐험 교실</p>
        <h1>낱말 뜻 갈림길</h1>
        <button className="history-button" type="button">
          업데이트 내역
        </button>
      </header>
      <main id="main-content" className="main-content">
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
