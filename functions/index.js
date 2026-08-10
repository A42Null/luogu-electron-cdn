// functions/index.js

export async function onRequest() {
  const res = await fetch(
    'https://raw.githubusercontent.com/A42Null/luogu-electron/main/README.md',
    { headers: { 'User-Agent': 'luogu-electron-cdn' } }
  )

  if (!res.ok) {
    return new Response('无法加载 README', { status: 502 })
  }

  const md = await res.text()

  // 简单 Markdown → HTML
  const htmlMd = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>洛谷客户端（非官方）</title>
<style>
  body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto; background:#f6f8fa; padding:40px; margin:0 }
  .wrap { max-width:800px; margin:auto; background:#fff; padding:32px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,.05) }
  h1,h2,h3 { color:#24292e }
  a { color:#0366d6; text-decoration:none }
  a:hover { text-decoration:underline }
  code { background:#eaecef; padding:2px 6px; border-radius:4px; font-size:13px }
  .top { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px }
  .top a { font-size:14px; color:#57606a }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <a href="https://github.com/A42Null/luogu-electron" target="_blank" rel="noopener">GitHub 仓库</a>
    <a href="/releases">所有 Releases</a>
  </div>
  ${htmlMd}
</div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=300'
    }
  })
}