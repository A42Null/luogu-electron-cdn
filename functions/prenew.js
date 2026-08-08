export async function onRequest() {
  const res = await fetch(
    'https://api.github.com/repos/A42Null/luogu-electron/releases?per_page=10',
    { headers: { 'User-Agent': 'luogu-electron-cdn' } }
  )

  if (!res.ok) {
    return new Response('GitHub upstream error', { status: 502 })
  }

  const releases = await res.json()
  const pre = releases.find(r => r.prerelease)

  if (!pre) {
    return new Response(JSON.stringify({
      message: 'No prerelease available'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    })
  }

  return new Response(JSON.stringify({
    version: pre.tag_name.replace(/^v/, ''),
    notes: pre.body,
    pub_date: pre.published_at,
    url: pre.html_url
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    }
  })
}