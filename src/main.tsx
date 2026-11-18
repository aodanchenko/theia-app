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
}

const route = ROUTES[location.pathname.replace(/\/+$/, '') || '/'] ?? ROUTES['/']
document.title = route.title
document.documentElement.dataset.theme = route.theme

// Earth and Space are two separate installable apps: own manifest, own offline cache (sw-earth.js / sw-space.js, built by vite.config.ts).
const app = route.theme === 'earth' || route.theme === 'space' ? route.theme : null
if (app) {
  document.querySelector<HTMLLinkElement>('#manifest')!.href = `/${app}.webmanifest`
  document.querySelector<HTMLMetaElement>('#theme-color')!.content = app === 'earth' ? '#f3eee4' : '#000815'
  if (app === 'earth') { // its own icon, so the two apps can be told apart on one home screen
    document.querySelector<HTMLLinkElement>('#icon')!.href = '/icon-earth.svg'
    document.querySelector<HTMLLinkElement>('#apple-icon')!.href = '/apple-touch-icon-earth.png'
  }
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.register(`/sw-${app}.js`, { scope: `/${app}` })
    void navigator.storage?.persist?.() // ask the browser not to clear the offline copy when the phone runs low on space
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <route.Page />
    </Suspense>
  </StrictMode>,
)
