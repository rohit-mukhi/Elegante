import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import eruda from 'eruda'

// Initialize Eruda for mobile debugging
// Only enable in development or when URL has ?eruda=true
if (import.meta.env.DEV || window.location.search.includes('eruda=true')) {
  eruda.init()
  console.log('📱 Eruda mobile console initialized')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
