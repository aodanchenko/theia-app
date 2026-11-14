// Runs on Cloudflare before any file is served: the whole app sits behind one shared password (secret APP_PASSWORD).
export async function onRequest({ request, env, next }) {
  if (!env.APP_PASSWORD) return new Response('APP_PASSWORD is not set', { status: 500 }) // fail closed
  const [scheme, encoded] = (request.headers.get('Authorization') ?? '').split(' ')
  if (scheme === 'Basic' && encoded) {
    const decoded = atob(encoded)
    const password = decoded.slice(decoded.indexOf(':') + 1) // username is ignored
    if (await same(password, env.APP_PASSWORD)) return next()
  }
  return new Response('Password required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Theia", charset="UTF-8"' } })
}

// Compare SHA-256 hashes so the check takes the same time whatever the input.
async function same(a, b) {
  const hash = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))
  const [x, y] = await Promise.all([hash(a), hash(b)])
  return x.every((v, i) => v === y[i])
}
