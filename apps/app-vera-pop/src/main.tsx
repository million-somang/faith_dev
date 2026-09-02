import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import '@faithportal/mini-app-sdk/src/mini-app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
