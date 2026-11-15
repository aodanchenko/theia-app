import { test } from 'node:test'
import assert from 'node:assert/strict'
import { precacheFor } from './pwa.ts'

const chunk = (fileName: string, imports: string[] = [], facadeModuleId: string | null = null, isEntry = false, css: string[] = []) =>
  ({ type: 'chunk' as const, fileName, isEntry, facadeModuleId, imports, viteMetadata: { importedCss: new Set(css), importedAssets: new Set<string>() } })
const bundle = {
  'index.js': chunk('index.js', [], '/src/main.tsx', true, ['index.css']),
  'shared.js': chunk('shared.js'),
  'Earth.js': chunk('Earth.js', ['shared.js'], '/src/pages/EarthPage.tsx', false, ['Earth.css']),
  'Space.js': chunk('Space.js', ['shared.js'], '/src/pages/SpacePage.tsx', false, ['Space.css']),
}

test('each app precaches its own page and the shared code, never the other app', () => {
  const earth = precacheFor(bundle, 'pages/EarthPage.tsx')
  assert.deepEqual(earth.sort(), ['/Earth.css', '/Earth.js', '/index.css', '/index.js', '/shared.js'])
  assert.ok(!precacheFor(bundle, 'pages/SpacePage.tsx').some((f) => f.includes('Earth')))
})
