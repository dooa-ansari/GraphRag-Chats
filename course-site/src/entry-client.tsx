import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
import './styles.css'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Built pages arrive prerendered and are hydrated; `vite dev` serves an empty root.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
