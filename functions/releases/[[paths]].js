export async function onRequest(context) {
  const { request, params } = context;
  
  // 双中括号 [[path]] 匹配出来的是数组，需要 join
  const pathSegments = params.path || [];
  const githubPath = pathSegments.join('/');
  
  // 拼接 GitHub 源地址
  const targetUrl = `https://github.com/A42Null/luogu-electron/releases/download/${githubPath}`;
  
  console.log(`Proxying request to: ${targetUrl}`);

  const upstream = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; luogu-electron-cdn)'
    }
  });

  if (!upstream.ok) {
    return new Response(`GitHub upstream error: ${upstream.status} for ${targetUrl}`, { 
      status: upstream.status 
    });
  }

  const headers = new Headers(upstream.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Accept-Ranges', 'bytes'); // 保证大文件/断点续传支持

  return new Response(upstream.body, {
    status: upstream.status,
    headers
  });
}
