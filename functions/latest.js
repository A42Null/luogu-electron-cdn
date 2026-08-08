export async function onRequest() {
  const res = await fetch(
    'https://api.github.com/repos/A42Null/luogu-electron/releases/latest',
    { headers: { 'User-Agent': 'luogu-electron-cdn' } }
  )

  if (!res.ok) {
    return new Response('GitHub upstream error', { status: 502 })
  }

  const data = await res.json()

  return new Response(JSON.stringify({
    version: data.tag_name.replace(/^v/, ''),
    notes: data.body,
    pub_date: data.published_at,
    url: data.html_url
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    }
  })
}