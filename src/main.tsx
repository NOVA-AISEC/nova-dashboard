import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyStrathmoreTheme, getStoredThemeMode } from './theme/strathmore'

applyStrathmoreTheme(getStoredThemeMode())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
