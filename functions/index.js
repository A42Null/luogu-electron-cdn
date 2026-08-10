export async function onRequestGet() {
  const apiRes = await fetch(
    'https://api.github.com/repos/A42Null/luogu-electron/releases?per_page=50',
    { headers: { 'User-Agent': 'luogu-electron-cdn' } }
  )

  if (!apiRes.ok) {
    return new Response('GitHub API error', {
      status: 502,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    })
  }

  const releases = await apiRes.json()

  const cards = releases.map(release => {
    const tag = release.tag_name
    const version = tag.replace(/^v/, '')
    const badge = release.prerelease
      ? '<span class="badge pre">Pre-release</span>'
      : release.draft
        ? '<span class="badge draft">Draft</span>'
        : '<span class="badge stable">Stable</span>'

    const assetsHtml = release.assets.map(a => {
      const cfUrl = `https://luogu-electron-cdn.pages.dev/releases/${tag}/${encodeURIComponent(a.name)}`
      const size = (a.size / 1024 / 1024).toFixed(2) + ' MB'
      return `<li><a href="${cfUrl}" target="_blank" rel="noopener">${a.name}</a> <span class="size">（${size}）</span></li>`
    }).join('\n')

    const notes = (release.body || '').slice(0, 200).replace(/</g, '&lt;')

    return `
      <div class="card">
        <h2>${version} ${badge}</h2>
        <div class="meta">
          <a href="${release.html_url}" target="_blank" rel="noopener">GitHub Release 页面</a>
          · 发布于 ${new Date(release.published_at).toLocaleString('zh-CN')}
        </div>
        ${notes ? `<pre class="notes">${notes}${release.body.length > 200 ? '\n…' : ''}</pre>` : ''}
        <ul class="assets">${assetsHtml}</ul>
      </div>
    `
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>洛谷客户端 - 所有 Releases</title>
<style>
  body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto; background:#f6f8fa; padding:32px; margin:0 }
  .wrap { max-width:760px; margin:auto }
  h1 { margin-top:0 }
  .card { background:#fff; border-radius:8px; padding:20px 24px; margin:16px 0; box-shadow:0 2px 10px rgba(0,0,0,.05) }
  h2 { margin:0 0 8px }
  .meta { color:#57606a; font-size:14px; margin-bottom:8px }
  .meta a { color:#0366d6; text-decoration:none }
  .assets { padding-left:18px; margin:8px 0 0 }
  .assets li { margin:4px 0 }
  .assets a { color:#0366d6; text-decoration:none }
  .assets a:hover { text-decoration:underline }
  .size { color:#666; font-size:12px }
  .notes { background:#f6f8fa; padding:8px 12px; border-radius:6px; font-size:13px; white-space:pre-wrap; max-height:120px; overflow:auto }
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
  <p style="color:#57606a">共 ${releases.length} 个 Release，下载均走 Cloudflare 镜像</p>
  ${cards}
</div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=120'
    }
  })
}