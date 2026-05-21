// AIPET Agents Worker - Cloudflare Workers entry point
// Routes HTTP requests to the appropriate Durable Object agent

import { routeAgentRequest } from '@cloudflare/agents';
import { ProjectManagerAgent } from './project-manager';
import { FrontendAgent } from './frontend-agent';
import { BackendAgent } from './backend-agent';
import { TestAgent } from './test-agent';
import { DeployAgent } from './deploy-agent';

// Export all agent classes for Durable Object bindings
export { ProjectManagerAgent };
export { FrontendAgent };
export { BackendAgent };
export { TestAgent };
export { DeployAgent };

// Cloudflare Workers types (declared for local compilation)
declare global {
  interface DurableObjectNamespace<T extends RpcTarget = RpcTarget> {
    new: { (): T };
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub<T>;
    jurisdiction(jurisdiction: DurableObjectJurisdiction): DurableObjectNamespace<T>;
  }
  interface DurableObjectId { name?: string; }
  interface DurableObjectStub<T extends RpcTarget = RpcTarget> extends RpcTarget {
    id: DurableObjectId;
    fetch(request: Request): Promise<Response>;
  }
  interface DurableObjectJurisdiction { jurisdiction: string; }
  interface RpcTarget { }
}

export interface AgentEnv {
  ProjectManagerAgent: DurableObjectNamespace<ProjectManagerAgent>;
  FrontendAgent: DurableObjectNamespace<FrontendAgent>;
  BackendAgent: DurableObjectNamespace<BackendAgent>;
  TestAgent: DurableObjectNamespace<TestAgent>;
  DeployAgent: DurableObjectNamespace<DeployAgent>;
  AI: { run: (model: string, input: any) => Promise<any> };
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: AgentEnv): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        agents: ['ProjectManager', 'Frontend', 'Backend', 'Test', 'Deploy'],
        environment: env.ENVIRONMENT || 'development',
      });
    }

    // Route to appropriate agent via @cloudflare/agents
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    return new Response('AIPET Agents - Cloudflare Workers', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

async function handleAPI(request: Request, env: AgentEnv, url: URL): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pathParts = url.pathname.split('/').filter(Boolean);
    // /api/agents/<agent-name>/<action>
    if (pathParts.length >= 3 && pathParts[0] === 'api' && pathParts[1] === 'agents') {
      const agentName = pathParts[2];
      const action = pathParts.slice(3).join('/') || 'status';
      const namespaceMap: Record<string, DurableObjectNamespace<any>> = {
        project: env.ProjectManagerAgent,
        frontend: env.FrontendAgent,
        backend: env.BackendAgent,
        test: env.TestAgent,
        deploy: env.DeployAgent,
      };

      const ns = namespaceMap[agentName];
      if (!ns) {
        return Response.json({ error: `unknown agent: ${agentName}` }, { status: 404, headers: corsHeaders });
      }

      const id = ns.idFromName('default');
      const stub = ns.get(id);

      // Handle POST with action
      if (request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const result = await (stub as any)[action]?.(body);
        return Response.json(result || { ok: true }, { headers: corsHeaders });
      }

      // GET: return agent status
      const status = await (stub as any).getStatus?.();
      return Response.json(status || { ok: true }, { headers: corsHeaders });
    }

    // /api/agents - list available agents
    if (pathParts.length === 2 && pathParts[0] === 'api' && pathParts[1] === 'agents') {
      return Response.json({
        agents: [
          { name: 'project', class: 'ProjectManagerAgent', description: 'Project management and orchestration' },
          { name: 'frontend', class: 'FrontendAgent', description: 'Frontend development (React, Live2D, Vite)' },
          { name: 'backend', class: 'BackendAgent', description: 'Backend development (Electron, Express, AI)' },
          { name: 'test', class: 'TestAgent', description: 'Automated testing and quality assurance' },
          { name: 'deploy', class: 'DeployAgent', description: 'Build, package, and deployment' },
        ],
      }, { headers: corsHeaders });
    }

    return Response.json({ error: 'not found' }, { status: 404, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders });
  }
}
