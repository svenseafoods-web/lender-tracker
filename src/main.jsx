import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import PaymentPage from './components/PaymentPage.jsx'
import { GOOGLE_CLIENT_ID } from './config'

const path = window.location.pathname;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {path === '/pay' ? <PaymentPage /> : <App />}
    </GoogleOAuthProvider>
  </StrictMode>,
)
