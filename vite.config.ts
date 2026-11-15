import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import pwa from './scripts/pwa.ts'

export default defineConfig({
  plugins: [react(), pwa()],
})
