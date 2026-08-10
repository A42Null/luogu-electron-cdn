export async function onRequest() {
  const apiRes = await fetch(
    'https://api.github.com/repos/A42Null/luogu-electron/releases/latest',
    { headers: { 'User-Agent': 'luogu-electron-cdn' } }
  )

  if (!apiRes.ok) {
    return new Response('GitHub API error', {
      status: 502,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    })
  }

  const release = await apiRes.json()
  const tag = release.tag_name
  const version = tag.replace(/^v/, '')
  const htmlUrl = release.html_url

  const assetsHtml = release.assets.map(a => {
    const cfUrl = `https://luogu-electron-cdn.pages.dev/releases/${tag}/${a.name}`
    const size = (a.size / 1024 / 1024).toFixed(2) + ' MB'
    return `
      <li>
        <a href="${cfUrl}" target="_blank" rel="noopener">${a.name}</a>
        <span style="color:#666">（${size}）</span>
      </li>
    `
  }).join('\n')

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>洛谷非官方客户端 - 最新正式版</title>
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <style>
    body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto; background:#f6f8fa; padding:40px }
    .card { background:#fff; border-radius:8px; padding:24px; max-width:720px; margin:auto; box-shadow:0 2px 10px rgba(0,0,0,.05) }
    h1 { margin-top:0 }
    a { color:#0366d6; text-decoration:none }
    a:hover { text-decoration:underline }
    li { margin:6px 0 }
    .meta { color:#57606a; margin-bottom:12px }
    .badge { background:#2ea44f; color:#fff; padding:2px 8px; border-radius:999px; font-size:12px }
  </style>
</head>
<body>
  <div class="card">
    <h1>最新正式版 <span class="badge">Stable</span></h1>
    <div class="meta">
      <strong>版本：</strong>${version}<br/>
      <strong>GitHub：</strong><a href="${htmlUrl}" target="_blank">${htmlUrl}</a>
    </div>
    <hr/>
    <h3>下载列表（Cloudflare 镜像）</h3>
    <ul>
      ${assetsHtml}
    </ul>
    <p style="margin-top:20px;color:#888;font-size:13px">
      所有下载均通过 Cloudflare 加速，无需 GitHub 直连
    </p>
  </div>
</body>
</html>
  `

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=300'
    }
  })
}