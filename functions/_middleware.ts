// Runs on Cloudflare before any file is served: the whole app sits behind one shared password (secret APP_PASSWORD).
interface Context {
  request: Request
  env: { APP_PASSWORD?: string }
  next: () => Response | Promise<Response>
}

export async function onRequest({ request, env, next }: Context): Promise<Response> {
  if (!env.APP_PASSWORD) return new Response('APP_PASSWORD is not set', { status: 500 }) // fail closed
  const [scheme, encoded] = (request.headers.get('Authorization') ?? '').split(' ')
  if (scheme === 'Basic' && encoded) {
    const decoded = atob(encoded)
    const password = decoded.slice(decoded.indexOf(':') + 1) // username is ignored
    if (await same(password, env.APP_PASSWORD)) {
      const url = new URL(request.url)
      // Routes are /space and /earth; old /space/ pages from the multi-page build may linger in Cloudflare's cache.
      if (url.pathname.length > 1 && url.pathname.endsWith('/')) return Response.redirect(`${url.origin}${url.pathname.replace(/\/+$/, '')}${url.search}`, 308)
      return privateCache(await next(), url.pathname)
    }
  }
  return new Response('Password required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Theia", charset="UTF-8"' } })
}

// Content is behind a password: never let a shared cache keep it. Hashed /assets/ may stay in the browser.
function privateCache(response: Response, path: string): Response {
  const res = new Response(response.body, response)
  res.headers.set('Cache-Control', path.startsWith('/assets/') ? 'private, max-age=31536000, immutable' : 'private, no-cache')
  return res
}

// Compare SHA-256 hashes so the check takes the same time whatever the input.
async function same(a: string, b: string): Promise<boolean> {
  const hash = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))
  const [x, y] = await Promise.all([hash(a), hash(b)])
  return x.every((v, i) => v === y[i])
}
