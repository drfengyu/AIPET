import { Agent, Workflow, callable } from "agents";
import { ProjectState, Task, TaskResult, WorkflowResult, AgentInfo } from "./types";

export class ProjectManagerAgent extends Agent<Env, ProjectState> {
  initialState: ProjectState = {
    tasks: [],
    agents: [],
    status: "planning",
    projectName: "Live2D Chat App",
    createdAt: new Date()
  };

  // 验证状态变更
  validateStateChange(nextState: ProjectState, source: any) {
    if (!nextState.projectName) {
      throw new Error("Project name is required");
    }
    if (nextState.tasks.length > 1000) {
      throw new Error("Too many tasks");
    }
  }

  // 状态更新时的回调
  onStateUpdate(state: ProjectState, source: any) {
    console.log("Project status updated:", state.status);
    console.log("Active tasks:", state.tasks.filter(t => t.status === "in-progress").length);
  }

  // 创建新任务
  @callable()
  async createTask(task: Omit<Task, "id" | "status" | "createdAt">): Promise<TaskResult> {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: new Date()
    };

    this.setState({
      tasks: [...this.state.tasks, newTask]
    });

    // 自动分配任务给合适的代理
    await this.assignTask(newTask);

    return {
      success: true,
      taskId: newTask.id,
      message: `Task "${newTask.name}" created and assigned`
    };
  }

  // 分配任务给代理
  @callable()
  async assignTask(task: Task): Promise<TaskResult> {
    const agentType = this.getAgentForTaskType(task.type);
    const agent = this.state.agents.find(a => a.type === agentType);

    if (!agent) {
      return {
        success: false,
        taskId: task.id,
        message: `No agent found for task type: ${task.type}`
      };
    }

    // 更新任务分配
    const updatedTasks = this.state.tasks.map(t =>
      t.id === task.id ? { ...t, assignedTo: agent.id, status: "in-progress" } : t
    );

    this.setState({
      tasks: updatedTasks,
      agents: this.state.agents.map(a =>
        a.id === agent.id ? { ...a, status: "busy", currentTask: task.id } : a
      )
    });

    return {
      success: true,
      taskId: task.id,
      message: `Task assigned to ${agent.name}`
    };
  }

  // 根据任务类型获取对应的代理
  private getAgentForTaskType(type: string): string {
    const mapping: Record<string, string> = {
      frontend: "frontend-agent",
      backend: "backend-agent",
      test: "test-agent",
      deploy: "deploy-agent",
      design: "frontend-agent"
    };
    return mapping[type] || "default-agent";
  }

  // 开始工作流
  @callable()
  async startWorkflow(workflowName: string, params: any): Promise<WorkflowResult> {
    const workflow = this.createWorkflow(workflowName, params);

    this.setState({
      status: "development"
    });

    return {
      success: true,
      workflowId: workflow.id,
      steps: workflow.steps
    };
  }

  // 创建工作流
  private createWorkflow(name: string, params: any): Workflow {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: name,
      steps: [
        {
          id: "step-1",
          name: "规划阶段",
          agent: "project-manager",
          action: "plan",
          params: params,
          status: "pending"
        },
        {
          id: "step-2",
          name: "前端开发",
          agent: "frontend-agent",
          action: "develop-frontend",
          params: params,
          status: "pending"
        },
        {
          id: "step-3",
          name: "后端开发",
          agent: "backend-agent",
          action: "develop-backend",
          params: params,
          status: "pending"
        },
        {
          id: "step-4",
          name: "测试",
          agent: "test-agent",
          action: "test",
          params: params,
          status: "pending"
        },
        {
          id: "step-5",
          name: "部署",
          agent: "deploy-agent",
          action: "deploy",
          params: params,
          status: "pending"
        }
      ],
      status: "pending"
    };

    return workflow;
  }

  // 获取项目状态
  @callable()
  async getProjectStatus(): Promise<ProjectState> {
    return this.state;
  }

  // 注册代理
  @callable()
  async registerAgent(agentInfo: Omit<AgentInfo, "id">): Promise<{ success: boolean; agentId: string }> {
    const newAgent: AgentInfo = {
      ...agentInfo,
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.setState({
      agents: [...this.state.agents, newAgent]
    });

    return {
      success: true,
      agentId: newAgent.id
    };
  }

  // 更新任务状态
  @callable()
  async updateTaskStatus(taskId: string, status: Task["status"], message?: string): Promise<TaskResult> {
    const updatedTasks = this.state.tasks.map(t =>
      t.id === taskId ? { ...t, status, completedAt: status === "completed" ? new Date() : t.completedAt } : t
    );

    this.setState({
      tasks: updatedTasks
    });

    return {
      success: true,
      taskId,
      message: message || `Task status updated to ${status}`
    };
  }
}
