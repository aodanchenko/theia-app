import { lazy, StrictMode, Suspense, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import EarthPage from './pages/EarthPage.tsx'
import HomePage from './pages/HomePage.tsx'
import SpacePage from './pages/SpacePage.tsx'
import type { Theme } from './types.ts'

// shortcut: path lookup instead of a router; add one when pages need in-app navigation or state in the URL.
const ROUTES: Record<string, { title: string; theme: Theme | 'home'; Page: ComponentType }> = {
  '/': { title: 'Theia', theme: 'home', Page: HomePage },
  '/space': { title: 'Theia · Space', theme: 'space', Page: SpacePage },
  '/earth': { title: 'Theia · Earth', theme: 'earth', Page: EarthPage },
  // Throwaway design prototypes, dev server only (never in the production bundle).
  ...(import.meta.env.DEV ? {
    '/proto/sounds': { title: 'Theia · Rep sounds', theme: 'space' as Theme, Page: lazy(() => import('./proto/sounds/SoundsLab.tsx')) },
    '/proto/earth': { title: 'Theia · Earth prototypes', theme: 'earth' as Theme, Page: lazy(() => import('./proto/earth/Harness.tsx')) },
  } : {}),
}

const route = ROUTES[location.pathname.replace(/\/+$/, '') || '/'] ?? ROUTES['/']
document.title = route.title
document.documentElement.dataset.theme = route.theme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <route.Page />
    </Suspense>
  </StrictMode>,
)
