import { routeAgentRequest } from "agents";
import { ProjectManagerAgent } from "./ProjectManagerAgent";
import { FrontendAgent } from "./FrontendAgent";
import { BackendAgent } from "./BackendAgent";
import { TestAgent } from "./TestAgent";
import { DeployAgent } from "./DeployAgent";

// 环境变量接口
export interface Env {
  ProjectManagerAgent: DurableObjectNamespace;
  FrontendAgent: DurableObjectNamespace;
  BackendAgent: DurableObjectNamespace;
  TestAgent: DurableObjectNamespace;
  DeployAgent: DurableObjectNamespace;
  AI: any;
}

// 导出代理类（供 Durable Objects 使用）
export { ProjectManagerAgent, FrontendAgent, BackendAgent, TestAgent, DeployAgent };

// Worker 入口
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 使用 Agents SDK 的路由功能
    const response = routeAgentRequest(request, env);

    if (response) {
      return response;
    }

    // 如果不是代理请求，返回默认响应
    return new Response(
      JSON.stringify({
        message: "Live2D Chat Agents API",
        version: "1.0.0",
        endpoints: [
          "/agents/project-manager/{instance-id}",
          "/agents/frontend-agent/{instance-id}",
          "/agents/backend-agent/{instance-id}",
          "/agents/test-agent/{instance-id}",
          "/agents/deploy-agent/{instance-id}"
        ]
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  },

  // 定时任务（可选）
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Scheduled task executed at: ${event.cron}`);
    // 可以在这里添加定时任务逻辑
  }
};
