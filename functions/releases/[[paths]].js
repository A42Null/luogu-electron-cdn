// functions/releases/[[path]].js

// ✅ 轻量 Markdown 解析（无依赖）
function parseMarkdown(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^(###)\s+(.+)$/gm, '<h3>$2</h3>')
    .replace(/^(##)\s+(.+)$/gm, '<h2>$2</h2>')
    .replace(/^(#)\s+(.+)$/gm, '<h1>$2</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br>')
  return html.replace(/<br><li>/g, '<li>').replace(/<\/li><br>/g, '</li>')
}

// ✅ Releases 列表页
async function renderReleasesPage() {
  const res = await fetch(
    'https://api.github.com/repos/A42Null/luogu-electron/releases?per_page=50',
    { headers: { 'User-Agent': 'luogu-electron-cdn' } }
  )
  if (!res.ok) return new Response('GitHub API error', { status: 502 })

  const releases = await res.json()
  const cards = releases.map(r => {
    const badge = r.prerelease
      ? '<span class="badge pre">Pre-release</span>'
      : r.draft
        ? '<span class="badge draft">Draft</span>'
        : '<span class="badge stable">Stable</span>'

    const assets = r.assets.map(a =>
      `<li><a href="/releases/${r.tag_name}/${encodeURIComponent(a.name)}">${a.name}</a> <span class="size">（${(a.size/1024/1024).toFixed(2)} MB）</span></li>`
    ).join('')

    return `
      <div class="card">
        <h2>${r.tag_name.replace(/^v/, '')} ${badge}</h2>
        <div class="meta">
          <a href="${r.html_url}" target="_blank">GitHub Release</a>
          · ${new Date(r.published_at).toLocaleString('zh-CN')}
        </div>
        <div class="notes">${parseMarkdown(r.body)}</div>
        <ul class="assets">${assets}</ul>
      </div>
    `
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>洛谷客户端 Releases</title>
<style>
  body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto; background:#f6f8fa; padding:32px; margin:0 }
  .wrap { max-width:760px; margin:auto }
  h1 { margin-top:0 }
  .card { background:#fff; border-radius:8px; padding:20px 24px; margin:16px 0; box-shadow:0 2px 10px rgba(0,0,0,.05) }
  .meta { color:#57606a; font-size:14px; margin-bottom:10px }
  .notes { background:#f6f8fa; padding:12px; border-radius:6px; font-size:14px; line-height:1.6; overflow:auto }
  .notes h1,.notes h2,.notes h3 { margin:8px 0 }
  .notes ul { padding-left:20px }
  .notes code { background:#eaecef; padding:2px 6px; border-radius:4px }
  .notes pre { background:#24292e; color:#fff; padding:10px; border-radius:6px; overflow:auto }
  .assets { padding-left:20px; margin-top:10px }
  .assets li { margin:4px 0 }
  .badge { font-size:12px; color:#fff; padding:2px 8px; border-radius:999px; margin-left:6px }
  .badge.stable { background:#2ea44f }
  .badge.pre { background:#d29922 }
  .badge.draft { background:#888 }
  .top { display:flex; justify-content:space-between; align-items:center }
  .top a { color:#0366d6; text-decoration:none }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <h1>洛谷客户端 Releases</h1>
    <a href="/latest">最新正式版 →</a>
  </div>
  <p style="color:#57606a">共 ${releases.length} 个 Release · 下载走 Cloudflare 镜像</p>
  ${cards}
</div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=120' }
  })
}

// ✅ 主入口
export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const rest = url.pathname.replace(/^\/releases\/?/, '').trim()

  // 情况 1：/releases → Releases 列表页
  if (!rest) {
    return renderReleasesPage()
  }

  // 情况 2：/releases/v1.0.2/xxx.exe → GitHub 反代
  let segs = rest.split('/')
  if (segs[0] && !segs[0].startsWith('v')) segs[0] = 'v' + segs[0]

  const githubUrl = `https://github.com/A42Null/luogu-electron/releases/download/${segs.map(encodeURIComponent).join('/')}`

  const headers = new Headers()
  headers.set('User-Agent', 'Mozilla/5.0 (compatible; luogu-electron-cdn)')
  const range = request.headers.get('range')
  if (range) headers.set('Range', range)

  const upstream = await fetch(githubUrl, {
    method: request.method === 'HEAD' ? 'GET' : request.method,
    headers,
    redirect: 'follow'
  })

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Upstream ${upstream.status}\n${githubUrl}`, { status: upstream.status })
  }

  const h = new Headers(upstream.headers)
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Accept-Ranges', 'bytes')
  h.set('Cache-Control', 'public, max-age=86400')

  return new Response(upstream.body, { status: upstream.status, headers: h })
}