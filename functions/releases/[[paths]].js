export async function onRequest(context) {
  const { request, params } = context
  const segs = params.path || []

  // 自动补 v
  if (segs[0] && !segs[0].startsWith('v')) {
    segs[0] = 'v' + segs[0]
  }

  const encodedPath = segs.map(s => encodeURIComponent(s)).join('/')
  const githubUrl = `https://github.com/A42Null/luogu-electron/releases/download/${encodedPath}`

  // 第一步：只拿 302，不跟随
  const redirectResp = await fetch(githubUrl, {
    method: 'GET',
    headers: { 'User-Agent': 'curl/8.0' },
    redirect: 'manual'
  })

  if (redirectResp.status !== 302 && redirectResp.status !== 301) {
    // 不是重定向，直接透传（比如 404/200 yml 情况）
    const h = new Headers(redirectResp.headers)
    h.set('Access-Control-Allow-Origin', '*')
    return new Response(redirectResp.body, { status: redirectResp.status, headers: h })
  }

  const location = redirectResp.headers.get('Location')
  if (!location) {
    return new Response('No Location from GitHub', { status: 502 })
  }

  // 第二步：请求真正的对象存储地址，透传客户端原始头（Range 等）
  const finalResp = await fetch(location, {
    method: request.method,
    headers: request.headers,
    redirect: 'follow'
  })

  const outHeaders = new Headers(finalResp.headers)
  outHeaders.set('Access-Control-Allow-Origin', '*')
  outHeaders.set('Accept-Ranges', 'bytes')
  outHeaders.set('Cache-Control', 'public, max-age=86400')

  return new Response(finalResp.body, {
    status: finalResp.status,
    headers: outHeaders
  })
}