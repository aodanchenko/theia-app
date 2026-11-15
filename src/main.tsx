import { lazy, StrictMode, Suspense, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import type { Theme } from './types.ts'

// Each page is its own chunk, so the Earth app never downloads Space code and the other way round.
const HomePage = lazy(() => import('./pages/HomePage.tsx'))
const SpacePage = lazy(() => import('./pages/SpacePage.tsx'))
const EarthPage = lazy(() => import('./pages/EarthPage.tsx'))

// shortcut: path lookup instead of a router; add one when pages need in-app navigation or state in the URL.
const ROUTES: Record<string, { title: string; theme: Theme | 'home'; Page: ComponentType }> = {
  '/': { title: 'Theia', theme: 'home', Page: HomePage },
  '/space': { title: 'Theia · Space', theme: 'space', Page: SpacePage },
  '/earth': { title: 'Theia · Earth', theme: 'earth', Page: EarthPage },
  // Throwaway design prototypes, dev server only (never in the production bundle).
  ...(import.meta.env.DEV ? {
    '/proto/sounds': { title: 'Theia · Rep sounds', theme: 'space' as Theme, Page: lazy(() => import('./proto/sounds/SoundsLab.tsx')) },
    '/proto/demo-shot': { title: 'Theia · Demo shot', theme: 'earth' as Theme, Page: lazy(() => import('./proto/demo-shot/DemoShot.tsx')) },
    '/proto/paused': { title: 'Theia · Paused frame', theme: 'earth' as Theme, Page: lazy(() => import('./proto/paused/PausedLab.tsx')) },
    '/lab/earth-style': { title: 'Theia · Earth style lab', theme: 'earth' as Theme, Page: lazy(() => import('./proto/earth/StyleLab.tsx')) },
  } : {}),
}

const route = ROUTES[location.pathname.replace(/\/+$/, '') || '/'] ?? ROUTES['/']
document.title = route.title
document.documentElement.dataset.theme = route.theme

// Earth and Space are two separate installable apps: own manifest, own offline cache (sw-earth.js / sw-space.js, built by vite.config.ts).
const app = route.theme === 'earth' || route.theme === 'space' ? route.theme : null
if (app) {
  document.querySelector<HTMLLinkElement>('#manifest')!.href = `/${app}.webmanifest`
  document.querySelector<HTMLMetaElement>('#theme-color')!.content = app === 'earth' ? '#f3eee4' : '#000815'
  if (import.meta.env.PROD && 'serviceWorker' in navigator) void navigator.serviceWorker.register(`/sw-${app}.js`, { scope: `/${app}` })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <route.Page />
    </Suspense>
  </StrictMode>,
)
