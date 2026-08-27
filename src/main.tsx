import React from 'react';
import './styles/tokens.css';
import './styles/base.css';
import './styles/print.css';
import { createRoot } from 'react-dom/client';
import App from './app/App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
