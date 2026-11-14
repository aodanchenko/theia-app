import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import EarthPage from './pages/EarthPage.jsx'
import HomePage from './pages/HomePage.jsx'
import SpacePage from './pages/SpacePage.jsx'

// shortcut: path lookup instead of a router; add one when pages need in-app navigation or state in the URL.
const ROUTES = {
  '/': { title: 'Theia', theme: 'space', Page: HomePage },
  '/space': { title: 'Theia · Space', theme: 'space', Page: SpacePage },
  '/earth': { title: 'Theia · Earth', theme: 'earth', Page: EarthPage },
}

const route = ROUTES[location.pathname.replace(/\/+$/, '') || '/'] ?? ROUTES['/']
document.title = route.title
document.documentElement.dataset.theme = route.theme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <route.Page />
  </StrictMode>,
)
