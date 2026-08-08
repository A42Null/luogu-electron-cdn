export async function onRequest(context) {
  const { request, params } = context
  const segs = params.path || []

  // 自动补 v（防手滑）
  if (segs[0] && !segs[0].startsWith('v')) {
    segs[0] = 'v' + segs[0]
  }

  // 每段单独 encode，保留斜杠
  const encodedPath = segs.map(s => encodeURIComponent(s)).join('/')
  const targetUrl = `https://github.com/A42Null/luogu-electron/releases/download/${encodedPath}`

  // 首次请求：GET，不带 Range，标准 UA，让 GitHub 先 302 到 objects 域
  const upstream = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; luogu-electron-cdn)'
    },
    redirect: 'follow'
  })

  if (!upstream.ok) {
    return new Response(
      `Upstream ${upstream.status} ${upstream.statusText}\n${targetUrl}`,
      { status: upstream.status }
    )
  }

  const headers = new Headers(upstream.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Cache-Control', 'public, max-age=86400')

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  })
}