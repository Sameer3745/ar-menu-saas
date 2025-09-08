 import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ✅ Import for AR/3D models
import '@google/model-viewer'

// ✅ Import service worker registration
import * as serviceWorkerRegistration from './serviceWorkerRegistration'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// ✅ Register the service worker for PWA
serviceWorkerRegistration.register()
