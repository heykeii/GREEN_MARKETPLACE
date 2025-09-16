import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// Inactivity auto-logout: 48 hours
const INACTIVITY_LIMIT_MS = 48 * 60 * 60 * 1000;
const STORAGE_KEY = 'lastActivityAt';

const setActivity = () => {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
};

const checkInactivity = () => {
  try {
    const last = Number(localStorage.getItem(STORAGE_KEY) || '0');
    if (last && Date.now() - last > INACTIVITY_LIMIT_MS) {
      localStorage.removeItem('token');
      localStorage.removeItem('admin_token');
      // Soft redirect to login
      if (location.pathname !== '/login' && location.pathname !== '/admin/login') {
        location.href = '/login';
      }
    }
  } catch {}
};

['click','keydown','mousemove','scroll','touchstart','visibilitychange'].forEach(evt => {
  window.addEventListener(evt, setActivity, { passive: true });
});

// Initialize on load and check periodically
setActivity();
setInterval(checkInactivity, 60 * 1000);

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>,
)
