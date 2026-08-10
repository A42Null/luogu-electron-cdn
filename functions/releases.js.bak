// functions/releases.js

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // 严格匹配 /releases 或 /releases/
  if (url.pathname === '/releases' || url.pathname === '/releases/') {
    // ✅ 直接 301 跳转到首页（首页已经实现了显示所有 Releases）
    return Response.redirect('https://luogu-electron-cdn.pages.dev/', 301);
  }
  
  // 如果不是精确匹配，交给其他路由处理（理论上不会走到这里）
  return context.next();
}