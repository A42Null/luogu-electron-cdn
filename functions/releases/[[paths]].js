export async function onRequest(context) {
  const { request } = context

  const url = new URL(request.url)

  let rest = url.pathname.replace(/^\/releases\/?/, '')

  if (!rest) {
    return context.next()
  }

  // 兼容 /releases/1.0.2-hotfix.1/xxx.exe -> 自动补 v
  const segs = rest.split('/')
  if (segs[0] && !segs[0].startsWith('v')) {
    segs[0] = 'v' + segs[0]
  }

  const encodedPath = segs.map(s => encodeURIComponent(s)).join('/')
  const githubUrl = `https://github.com/A42Null/luogu-electron/releases/download/${encodedPath}`

  const headers = new Headers()
  headers.set('User-Agent', 'Mozilla/5.0 (compatible; luogu-electron-cdn)')
  headers.set('Accept', '*/*')

  const range = request.headers.get('range')
  if (range) {
    headers.set('Range', range)
  }

  const upstream = await fetch(githubUrl, {
    method: request.method === 'HEAD' ? 'GET' : request.method,
    headers,
    redirect: 'follow'
  })

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(
      `Upstream ${upstream.status} ${upstream.statusText}\n${githubUrl}`,
      { status: upstream.status }
    )
  }

  const responseHeaders = new Headers()
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Accept-Ranges', 'bytes')
  responseHeaders.set('Cache-Control', 'public, max-age=86400')

  const contentType = upstream.headers.get('Content-Type')
  if (contentType) responseHeaders.set('Content-Type', contentType)

  const contentLength = upstream.headers.get('Content-Length')
  if (contentLength) responseHeaders.set('Content-Length', contentLength)

  const contentRange = upstream.headers.get('Content-Range')
  if (contentRange) responseHeaders.set('Content-Range', contentRange)

  const etag = upstream.headers.get('ETag')
  if (etag) responseHeaders.set('ETag', etag)

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  })
}