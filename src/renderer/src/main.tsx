import '@fontsource-variable/inter'
import '@fontsource-variable/inter/wght-italic.css'
import '@fontsource/bree-serif'
import '@fontsource-variable/archivo'
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Apply the persisted theme before React renders to avoid a flash of unstyled (white) background.
try {
  const stored = localStorage.getItem('reminders-ui-v3')
  const theme = stored ? (JSON.parse(stored).state?.theme ?? 'dark') : 'dark'
  const themeClasses = ['theme-warm', 'theme-midnight', 'theme-dim', 'theme-nord', 'theme-forest', 'theme-dusk', 'theme-grey']
  document.documentElement.classList.remove('dark', ...themeClasses)
  if (theme !== 'light') document.documentElement.classList.add('dark')
  if (theme !== 'light' && theme !== 'dark') document.documentElement.classList.add(`theme-${theme}`)
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
