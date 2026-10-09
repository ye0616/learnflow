// LearnFlow AI 代理 - Cloudflare Worker
// 将此文件部署到 Cloudflare Workers，用于绕过浏览器 CORS 限制
// 部署步骤见下方说明

export default {
  async fetch(request) {
    const url = new URL(request.url)

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // 只允许 POST 到 /v1/chat/completions
    if (url.pathname !== '/v1/chat/completions' || request.method !== 'POST') {
      return new Response('Not Found', { status: 404 })
    }

    // 转发请求到 DeepSeek API
    const targetUrl = 'https://api.deepseek.com/chat/completions'
    const newRequest = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: request.body,
    })

    try {
      const response = await fetch(newRequest)

      // 复制响应并添加 CORS 头
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
      newResponse.headers.set('Access-Control-Allow-Origin', '*')
      newResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

      return newResponse
    } catch (err) {
      return new Response(
        JSON.stringify({ error: { message: 'Proxy error: ' + (err.message || 'Unknown') } }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  },
}

/*
=== 部署步骤（5 分钟，免费） ===

1. 打开 https://dash.cloudflare.com 注册/登录 Cloudflare
2. 左侧菜单找到「Workers & Pages」
3. 点击「Create Worker」，起个名字（如 learnflow-proxy），点击「Deploy」
4. 点击「Edit Code」，把本文件的全部内容粘贴进去，替换原有代码
5. 点击「Save and Deploy」
6. 复制你的 Worker URL（类似 https://learnflow-proxy.你的名字.workers.dev）
7. 回到 LearnFlow 设置页，把 URL 填入「代理地址」输入框
8. 保存，测试连接

Worker 免费额度：每天 10 万次请求，完全够用。
API Key 仍然由你的浏览器直接发送，不经过 Cloudflare 存储。
*/
