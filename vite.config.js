import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const PAGES = ['earth', 'space']

// Dev server: /earth → /earth/ (Cloudflare Pages already does this in production).
const pageSlash = {
  name: 'page-slash',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const [path, query] = req.url.split('?')
      if (!PAGES.includes(path.slice(1))) return next()
      res.writeHead(301, { Location: `${path}/${query ? `?${query}` : ''}` })
      res.end()
    })
  },
}

export default defineConfig({
  plugins: [react(), pageSlash],
  build: {
    rollupOptions: {
      input: { main: 'index.html', ...Object.fromEntries(PAGES.map((p) => [p, `${p}/index.html`])) },
    },
  },
})
