import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from './_middleware.js'

const call = (auth, password = 'secret', url = 'https://x/') => onRequest({
  request: new Request(url, { headers: auth ? { Authorization: auth } : {} }),
  env: { APP_PASSWORD: password },
  next: () => new Response('app'),
})
const basic = (s) => 'Basic ' + btoa(s)

test('right password passes, any username, and is never shared-cached', async () => {
  const res = await call(basic('anyone:secret'))
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('Cache-Control'), 'private, no-cache')
})
test('wrong, missing or malformed password is refused', async () => {
  for (const auth of [basic('x:nope'), undefined, 'Bearer secret', 'Basic']) assert.equal((await call(auth)).status, 401)
})
test('fails closed when the secret is not set', async () => {
  assert.equal((await call(basic('x:'), '')).status, 500)
})

test('trailing slash redirects to the route without it', async () => {
  const res = await call(basic('x:secret'), 'secret', 'https://x/space/?a=1')
  assert.equal(res.status, 308)
  assert.equal(res.headers.get('Location'), 'https://x/space?a=1')
})
