import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from './_middleware.js'

const call = (auth, password = 'secret') => onRequest({
  request: new Request('https://x/', { headers: auth ? { Authorization: auth } : {} }),
  env: { APP_PASSWORD: password },
  next: () => new Response('app'),
})
const basic = (s) => 'Basic ' + btoa(s)

test('right password passes, any username', async () => {
  assert.equal((await call(basic('anyone:secret'))).status, 200)
})
test('wrong, missing or malformed password is refused', async () => {
  for (const auth of [basic('x:nope'), undefined, 'Bearer secret', 'Basic']) assert.equal((await call(auth)).status, 401)
})
test('fails closed when the secret is not set', async () => {
  assert.equal((await call(basic('x:'), '')).status, 500)
})
