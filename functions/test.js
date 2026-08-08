export function onRequest() {
  return new Response('OK from test.js', { status: 200 })
}