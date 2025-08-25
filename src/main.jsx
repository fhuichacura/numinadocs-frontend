import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- Importante
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'; // <-- Importa el provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* <-- Envuelve App con AuthProvider */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);