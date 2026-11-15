import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from './_middleware.ts'

const call = (url: string) => onRequest({ request: new Request(url), next: () => new Response('app') })

test('no password: every page is served', async () => {
  const res = await call('https://x/earth')
  assert.equal(res.status, 200)
  assert.equal(await res.text(), 'app')
})

test('trailing slash redirects to the route without it', async () => {
  const res = await call('https://x/space/?a=1')
  assert.equal(res.status, 308)
  assert.equal(res.headers.get('Location'), 'https://x/space?a=1')
})
