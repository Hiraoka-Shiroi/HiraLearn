
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handler for the user to see if something crashes early
window.onerror = function(message) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #020617; color: #ef4444; padding: 20px; font-family: sans-serif; border-radius: 12px; border: 1px solid #ef444433; margin: 20px;">
        <h1 style="font-size: 18px; margin-bottom: 10px;">Критическая ошибка запуска</h1>
        <p style="font-size: 14px; margin-bottom: 15px;">${message}</p>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
          Вероятная причина: Ваш браузер блокирует выполнение скриптов при открытии файла напрямую через <b>file://</b>.<br><br>
          <b>Как исправить:</b><br>
          1. Используйте локальный сервер (например, расширение Live Server в VS Code).<br>
          2. Попробуйте другой браузер (Firefox обычно более лоялен к локальным файлам).
        </p>
        <button onclick="window.location.reload()" style="background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Попробовать снова</button>
      </div>
    `;
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
  } catch (err: any) {
    console.error("Mount error:", err);
    rootElement.innerHTML = `<div style="color: #ef4444; padding: 20px;">Ошибка рендеринга: ${err.message}</div>`;
  }
}

// Ensure the DOM is fully loaded before trying to mount
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
