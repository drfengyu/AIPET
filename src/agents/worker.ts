// Cloudflare Workers Agent Worker
// 部署 Superpowers 和 Hermes 技能到 Cloudflare

export default {
  async fetch(request: Request, _env: Record<string, unknown>): Promise<Response> {
    const url = new URL(request.url);

    // 健康检查端点
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', agents: ['ProjectManager', 'Frontend', 'Backend', 'Test', 'Deploy'] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API 端点
    if (url.pathname === '/api/agents') {
      return new Response(JSON.stringify({
        agents: [
          { name: 'ProjectManagerAgent', class: 'ProjectManagerAgent' },
          { name: 'FrontendAgent', class: 'FrontendAgent' },
          { name: 'BackendAgent', class: 'BackendAgent' },
          { name: 'TestAgent', class: 'TestAgent' },
          { name: 'DeployAgent', class: 'DeployAgent' }
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('AIPET Agents System - Cloudflare Workers', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
