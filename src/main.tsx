import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to catch unhandled errors
window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });

    // If the app crashed, show recovery UI
    const root = document.getElementById('root');
    if (root && root.innerHTML === '') {
        root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-family:system-ui,sans-serif;padding:20px;text-align:center;">
        <div style="background:white;border-radius:16px;padding:32px;max-width:400px;color:#333;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
          <h1 style="margin:0 0 16px;font-size:24px;">⚠️ App Error</h1>
          <p style="margin:0 0 24px;color:#666;">Something went wrong. Please try refreshing.</p>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload();" style="background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer;width:100%;">
            🔄 Clear Cache & Reload
          </button>
          <p style="margin:16px 0 0;font-size:12px;color:#999;">If this keeps happening, try clearing your browser data.</p>
        </div>
      </div>
    `;
    }
};

// Handle unhandled promise rejections
window.onunhandledrejection = (event) => {
    console.error('Unhandled promise rejection:', event.reason);
};

// Guard service worker against iframe/preview contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.update();
  }).catch(err => {
    console.warn('Service worker ready failed:', err);
  });
}

// Initialize the React app
try {
    const container = document.getElementById('root');

    if (!container) {
        throw new Error('Root element not found');
    }

    const root = createRoot(container);
    root.render(<App />);

} catch (error) {
    console.error('Failed to initialize app:', error);

    // Show fallback UI
    const rootEl = document.getElementById('root');
    if (rootEl) {
        rootEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;font-family:system-ui,sans-serif;padding:20px;text-align:center;">
        <div style="background:white;border-radius:16px;padding:32px;max-width:400px;color:#333;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
          <h1 style="margin:0 0 16px;font-size:24px;">🚫 Failed to Load</h1>
          <p style="margin:0 0 24px;color:#666;">The app couldn't start. This might be a caching issue.</p>
          <button onclick="localStorage.clear();sessionStorage.clear();caches.keys().then(c=>c.forEach(n=>caches.delete(n)));location.reload();" style="background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer;width:100%;">
            🧹 Full Reset & Reload
          </button>
        </div>
      </div>
    `;
    }
}
