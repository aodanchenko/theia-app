// Vite plugin: one HTML file per route (index.html, space.html, earth.html) with its own title, description, canonical
// and link-preview tags, so crawlers and chat apps that do not run JS see the right page. Pages serves /space from space.html.
import type { Plugin } from 'vite'

export const SITE = 'https://theia-app.pages.dev'

export const PAGES = {
  '': {
    title: 'Theia: a camera coach for astronauts and rehab',
    description: 'Theia watches a squat or a walk through a phone camera, compares each rep with your own normal and flags the compensation that should have faded. Video stays on your device.',
    image: '/icon-512.png',
  },
  space: {
    title: 'Theia · Space: squat workbench for astronauts',
    description: 'Squat workbench for astronauts on ARED: each rep against the astronaut’s own baseline, with the next step: continue, change the load or change the technique.',
    image: '/icon-512.png',
  },
  earth: {
    title: 'Theia · Earth: rehab coach on your phone',
    description: 'Rehab coach for squats and walking at home: your phone camera checks each rep and gives one plain tip at a time. In English and Ukrainian. Video stays on your phone.',
    image: '/icon-earth-512.png',
  },
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function headFor(path: keyof typeof PAGES): string {
  const { title, description, image } = PAGES[path]
  const url = `${SITE}/${path}`
  return `<title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Theia" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE}${image}" />
    <meta name="twitter:card" content="summary" />`
}

export default function seo(): Plugin {
  return {
    name: 'theia-seo',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const index = bundle['index.html']
      if (index?.type !== 'asset' || !String(index.source).includes('<title>Theia</title>')) throw new Error('seo: index.html has no <title>Theia</title>')
      const html = String(index.source)
      index.source = html.replace('<title>Theia</title>', headFor(''))
      for (const path of ['space', 'earth'] as const) this.emitFile({ type: 'asset', fileName: `${path}.html`, source: html.replace('<title>Theia</title>', headFor(path)) })
    },
  }
}
