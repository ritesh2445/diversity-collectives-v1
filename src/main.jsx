import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './accessibility/a11y.css'
import App from './App.jsx'
import { loadSiteTheme, applySiteThemeToDOM } from './admin/components/SiteThemeStudio.jsx'
import { initAutoFitEngine } from './utils/autoFitEngine'
import { fetchAndApplyLiveSiteState } from './services/liveSync'

// Sync authoritative live CMS site state from Cloudflare Worker / Turso backend
fetchAndApplyLiveSiteState().catch(() => {});

// Initialize custom admin site theme, button colors, and typography
applySiteThemeToDOM(loadSiteTheme());

// Initialize site-wide responsive typography & button auto-fit engine
initAutoFitEngine();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
