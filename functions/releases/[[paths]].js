export async function onRequest(context) {
  const { request, params } = context
  const pathSegments = params.path || []
  const githubPath = pathSegments.join('/')

  if (!githubPath) {
    return new Response('Bad Request: missing path', { status: 400 })
  }

  const targetUrl = `https://github.com/A42Null/luogu-electron/releases/download/${githubPath}`

  // 关键：不手动塞 Range 给 GitHub 的 302 签发端点
  // 让 Fetch 自动跟随重定向（Pages Functions 默认就是 follow）
  const upstream = await fetch(targetUrl, {
    method: request.method === 'HEAD' ? 'GET' : request.method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; luogu-electron-cdn)'
      // 注意：不在这里加 'Range'
    }
  })

  if (!upstream.ok) {
    return new Response(
      `Upstream error: ${upstream.status} ${upstream.statusText}\n${targetUrl}`,
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