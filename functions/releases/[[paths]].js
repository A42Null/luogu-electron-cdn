export async function onRequest(context) {
  const { request, params } = context
  const segments = params.path || []
  
  const REPO = 'A42Null/luogu-electron'

  // 拼 GitHub Releases download 原 URL
  // 访问：https://github.com/release/v1.0.2/洛谷 Setup 1.0.2-x64.exe
  // 转发：https://[](@replace=10001)/A42Null/luogu-electron/releases/download/v1.0.2/洛谷 Setup 1.0.2-x64.exe
  const githubUrl = `https://github.com/${REPO}/releases/download/${segments.join('/')}`

  const upstream = await fetch(githubUrl, {
    method: request.method,
    headers: {
      'User-Agent': 'Mozilla/5.0',
      // 透传 Range 支持断点续传（exe 大文件必须）
      'Range': request.headers.get('range') || ''
    }
  })

  // 透传状态码 + 关键响应头
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Cache-Control', upstream.headers.get('Cache-Control') || 'public, max-age=86400')
  if (upstream.headers.get('Content-Type'))
    headers.set('Content-Type', upstream.headers.get('Content-Type'))
  if (upstream.headers.get('Content-Length'))
    headers.set('Content-Length', upstream.headers.get('Content-Length'))
  if (upstream.headers.get('Content-Range'))
    headers.set('Content-Range', upstream.headers.get('Content-Range'))
  if (upstream.headers.get('Accept-Ranges'))
    headers.set('Accept-Ranges', upstream.headers.get('Accept-Ranges'))
  if (upstream.headers.get('ETag'))
    headers.set('ETag', upstream.headers.get('ETag'))

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  })
}
