import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../design/tokens.css'
import EarthPage from './EarthPage.jsx'

document.documentElement.dataset.theme = 'earth'
createRoot(document.getElementById('root')).render(<StrictMode><EarthPage /></StrictMode>)
