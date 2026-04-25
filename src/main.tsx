
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { installGlobalErrorHandlers } from './lib/monitoring/errorLogger'
import { recordPageLoadMetric } from './lib/monitoring/pageMetrics'
import { initAnalyticsOnce } from './lib/firebase/analytics'

// Global error handler for the user to see if something crashes early
const getBootLang = (): 'ru' | 'en' => {
  try {
    const saved = localStorage.getItem('hiralearn-language');
    return saved === 'en' ? 'en' : 'ru';
  } catch {
    return 'ru';
  }
};

const bootStrings = {
  ru: { critical: 'Критическая ошибка запуска', retry: 'Попробовать снова', render: 'Ошибка рендеринга: ' },
  en: { critical: 'Critical startup error', retry: 'Try Again', render: 'Render error: ' },
};

window.onerror = function(message) {
  const root = document.getElementById('root');
  if (root) {
    const s = bootStrings[getBootLang()];
    root.textContent = '';
    const container = document.createElement('div');
    container.style.cssText = 'background:#020617;color:#ef4444;padding:20px;font-family:sans-serif;border-radius:12px;border:1px solid #ef444433;margin:20px;';
    const h1 = document.createElement('h1');
    h1.style.cssText = 'font-size:18px;margin-bottom:10px;';
    h1.textContent = s.critical;
    const p1 = document.createElement('p');
    p1.style.cssText = 'font-size:14px;margin-bottom:15px;';
    p1.textContent = String(message);
    const btn = document.createElement('button');
    btn.style.cssText = 'background:var(--accent-primary,#6366f1);color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:bold;';
    btn.textContent = s.retry;
    btn.onclick = () => window.location.reload();
    container.appendChild(h1);
    container.appendChild(p1);
    container.appendChild(btn);
    root.appendChild(container);
  }
  return false;
};

function initApp() {
  console.log('HiraLearn initializing...');

  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("Root element not found in DOM.");
    // Try again in a moment if the DOM is truly not ready (failsafe)
    setTimeout(initApp, 100);
    return;
  }

  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('HiraLearn mounted successfully.');
  } catch (err: unknown) {
    console.error("Mount error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'color:#ef4444;padding:20px;';
    errDiv.textContent = bootStrings[getBootLang()].render + message;
    rootElement.textContent = '';
    rootElement.appendChild(errDiv);
  }
}

// Ensure the DOM is fully loaded before trying to mount
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Wire up monitoring AFTER the in-page window.onerror fallback above, so our
// logger wraps it (forwards to it after persisting the error) instead of being
// overwritten.
installGlobalErrorHandlers();
recordPageLoadMetric();
initAnalyticsOnce();
