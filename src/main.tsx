import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { reloadForStaleChunk } from './utils/lazyWithReload'

// Vite fires this when a preloaded chunk from an older deploy is gone.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForStaleChunk()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'Poppins', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: '#e83b3b', secondary: '#ffffff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
