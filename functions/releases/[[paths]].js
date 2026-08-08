/**
 * Cloudflare Pages Functions
 * 路由：/releases/*
 * 作用：反代 GitHub Releases 下载地址
 */

export async function onRequest(context) {
  const { request, params } = context

  // 双中括号 [[path]] → 路径参数一定是数组
  const pathSegments = params.path || []
  const githubPath = pathSegments.join('/')

  // 防御：防止空路径或非法访问
  if (!githubPath) {
    return new Response('Bad Request: missing path', { status: 400 })
  }

  // GitHub Releases download 原始地址
  const targetUrl = `https://github.com/A42Null/luogu-electron/releases/download/${githubPath}`

  // 请求 GitHub（带 UA，避免被拦）
  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; luogu-electron-cdn)',
      'Range': request.headers.get('range') || ''
    }
  })

  // GitHub 返回非 2xx/3xx 时，直接透传状态码
  if (!upstream.ok) {
    return new Response(
      `Upstream error: ${upstream.status} ${upstream.statusText}\n${targetUrl}`,
      { status: upstream.status }
    )
  }

  // 构造响应头（支持断点续传 + CORS）
  const headers = new Headers(upstream.headers)
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Cache-Control', 'public, max-age=86400')

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  })
}