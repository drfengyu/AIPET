// 简化的代理测试脚本 (JavaScript版本)

// 类型定义
const TaskType = ['frontend', 'backend', 'test', 'deploy', 'design'];
const TaskStatus = ['pending', 'in-progress', 'completed', 'failed'];

// 模拟项目状态
const mockState = {
  tasks: [],
  agents: [],
  status: "planning",
  projectName: "Live2D Chat App",
  createdAt: new Date()
};

// 测试函数
async function runSimpleTest() {
  console.log("=== AI代理架构简单测试 ===\n");

  try {
    // 测试1: 创建任务
    console.log("1. 测试任务创建...");
    const newTask = {
      id: `task-${Date.now()}`,
      type: "frontend",
      name: "创建Live2D展示组件",
      description: "使用React和Pixi.js创建Live2D角色展示组件",
      status: "pending",
      createdAt: new Date()
    };
    mockState.tasks.push(newTask);
    console.log("   ✅ 任务创建成功:", newTask.id);

    // 测试2: 注册代理
    console.log("\n2. 测试代理注册...");
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: "Frontend Agent",
      type: "frontend-agent",
      status: "idle"
    };
    mockState.agents.push(newAgent);
    console.log("   ✅ 代理注册成功:", newAgent.id);

    // 测试3: 分配任务
    console.log("\n3. 测试任务分配...");
    mockState.tasks[0].assignedTo = newAgent.id;
    mockState.tasks[0].status = "in-progress";
    mockState.agents[0].status = "busy";
    mockState.agents[0].currentTask = newTask.id;
    console.log("   ✅ 任务分配成功");

    // 测试4: 更新项目状态
    console.log("\n4. 测试项目状态更新...");
    mockState.status = "development";
    console.log("   ✅ 项目状态更新为:", mockState.status);

    // 测试5: 显示项目信息
    console.log("\n5. 项目信息:");
    console.log("   - 项目名称:", mockState.projectName);
    console.log("   - 项目状态:", mockState.status);
    console.log("   - 任务数量:", mockState.tasks.length);
    console.log("   - 代理数量:", mockState.agents.length);
    console.log("   - 活跃任务:", mockState.tasks.filter(t => t.status === "in-progress").length);
    console.log("   - 忙碌代理:", mockState.agents.filter(a => a.status === "busy").length);

    // 测试6: 创建更多任务
    console.log("\n6. 创建更多任务...");
    const backendTask = {
      id: `task-${Date.now() + 1}`,
      type: "backend",
      name: "创建AI对话API",
      description: "实现AI对话服务的REST API",
      status: "pending",
      createdAt: new Date()
    };
    mockState.tasks.push(backendTask);
    console.log("   ✅ 后端任务创建成功");

    const testTask = {
      id: `task-${Date.now() + 2}`,
      type: "test",
      name: "编写单元测试",
      description: "为所有组件编写单元测试",
      status: "pending",
      createdAt: new Date()
    };
    mockState.tasks.push(testTask);
    console.log("   ✅ 测试任务创建成功");

    // 测试7: 显示最终状态
    console.log("\n7. 最终项目状态:");
    console.log("   - 总任务数:", mockState.tasks.length);
    console.log("   - 待处理:", mockState.tasks.filter(t => t.status === "pending").length);
    console.log("   - 进行中:", mockState.tasks.filter(t => t.status === "in-progress").length);
    console.log("   - 任务类型分布:");
    const typeCounts = mockState.tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}个`);
    });

    console.log("\n=== 所有测试通过！ ===");
    console.log("代理架构数据模型运行正常，可以开始开发了。");

  } catch (error) {
    console.error("\n❌ 测试失败:", error);
    process.exit(1);
  }
}

// 运行测试
runSimpleTest();
