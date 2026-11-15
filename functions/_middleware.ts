// Runs on Cloudflare before any file is served. The site is public; this only tidies old URLs.
interface Context {
  request: Request
  next: () => Response | Promise<Response>
}

export async function onRequest({ request, next }: Context): Promise<Response> {
  const url = new URL(request.url)
  // Routes are /space and /earth; old /space/ pages from the multi-page build may linger in Cloudflare's cache.
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) return Response.redirect(`${url.origin}${url.pathname.replace(/\/+$/, '')}${url.search}`, 308)
  return next()
}
