import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './accessibility/a11y.css'
import App from './App.jsx'
import { loadSiteTheme, applySiteThemeToDOM } from './admin/components/SiteThemeStudio.jsx'

// Initialize custom admin site theme, button colors, and typography
applySiteThemeToDOM(loadSiteTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
