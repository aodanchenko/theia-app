import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../design/tokens.css'
import SpacePage from './SpacePage.jsx'

document.documentElement.dataset.theme = 'space'
createRoot(document.getElementById('root')).render(<StrictMode><SpacePage /></StrictMode>)
