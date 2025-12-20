import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 1. Importamos la librería
import ReactGA from "react-ga4";

// 2. Definimos tu ID (Pon tu ID real aquí)
const GA_MEASUREMENT_ID = "G-H0TSGLDXZF";

// 3. Aplicamos el parche de compatibilidad (por si acaso viene oculto)
const GA = (ReactGA as any).default ?? ReactGA;

// 4. Inicializamos (Solo si hay ID)
if (GA_MEASUREMENT_ID) {
    GA.initialize(GA_MEASUREMENT_ID);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)