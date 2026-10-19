import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { BUILTIN_DIALOGUES } from './data'
import { checkBuiltins } from './lib/validate'
import './index.css'

if (import.meta.env.DEV) checkBuiltins(BUILTIN_DIALOGUES)
else registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
