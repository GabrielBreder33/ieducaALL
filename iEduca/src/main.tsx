import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

Sentry.init({
  dsn: "https://ddffa78e68653abc590e125cc0b43837@o4511129766395904.ingest.us.sentry.io/4511129808928768",
  sendDefaultPii: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Ocorreu um erro inesperado.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
