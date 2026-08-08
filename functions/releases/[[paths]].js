export async function onRequest(context) {
  const { request, params } = context
  const segs = params.path || []

  // 自动补 v（兼容 /releases/1.0.2-hotfix.1 → /releases/v1.0.2-hotfix.1）
  if (segs[0] && !segs[0].startsWith('v')) {
    segs[0] = 'v' + segs[0]
  }

  // 路径分段编码，支持中文/空格（虽然你现在已改成纯英文）
  const encodedPath = segs.map(s => encodeURIComponent(s)).join('/')
  const githubUrl = `https://github.com/A42Null/luogu-electron/releases/download/${encodedPath}`

  // 只保留必要的请求头
  const headers = new Headers()
  headers.set('User-Agent', 'Mozilla/5.0 (compatible; luogu-electron-cdn)')
  headers.set('Accept', '*/*')

  // 透传 Range（electron-updater 断点续传必须）
  const range = request.headers.get('range')
  if (range) {
    headers.set('Range', range)
  }

  // ✅ 关键：让 CF 自动跟随 302，不手动干预
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

  // 构造干净的响应头
  const responseHeaders = new Headers()
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Accept-Ranges', 'bytes')
  responseHeaders.set('Cache-Control', 'public, max-age=86400')

  // 透传关键下载头
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