import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useTheme } from './context/ThemeContext'
import './index.css'

function ThemedToaster() {
  const { theme } = useTheme()
  return (
    <Toaster position="top-right" toastOptions={{
      style: theme === 'dark'
        ? { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }
        : { background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0' }
    }} />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
