// AI代理使用示例

import { ProjectManagerAgent, FrontendAgent, BackendAgent, TestAgent, DeployAgent } from "../src/agents";

// 模拟环境变量
const mockEnv = {
  ProjectManagerAgent: { id: "project-manager" },
  FrontendAgent: { id: "frontend-agent" },
  BackendAgent: { id: "backend-agent" },
  TestAgent: { id: "test-agent" },
  DeployAgent: { id: "deploy-agent" },
  AI: {}
};

// 示例1：初始化项目
async function initializeProject() {
  console.log("=== 初始化项目 ===");

  // 创建项目经理代理
  const projectManager = new ProjectManagerAgent(mockEnv.ProjectManagerAgent, "project-manager-1");

  // 注册前端代理
  await projectManager.registerAgent({
    name: "Frontend Agent",
    type: "frontend-agent",
    status: "idle"
  });

  // 注册后端代理
  await projectManager.registerAgent({
    name: "Backend Agent",
    type: "backend-agent",
    status: "idle"
  });

  console.log("✅ 代理注册完成");
}

// 示例2：创建开发任务
async function createDevelopmentTasks() {
  console.log("\n=== 创建开发任务 ===");

  const projectManager = new ProjectManagerAgent(mockEnv.ProjectManagerAgent, "project-manager-1");

  // 创建前端任务
  const frontendTask = await projectManager.createTask({
    type: "frontend",
    name: "创建Live2D展示组件",
    description: "使用React和Pixi.js创建Live2D角色展示组件"
  });
  console.log("✅ 前端任务创建:", frontendTask.taskId);

  // 创建后端任务
  const backendTask = await projectManager.createTask({
    type: "backend",
    name: "创建AI对话API",
    description: "实现AI对话服务的REST API"
  });
  console.log("✅ 后端任务创建:", backendTask.taskId);

  // 创建测试任务
  const testTask = await projectManager.createTask({
    type: "test",
    name: "编写单元测试",
    description: "为所有组件编写单元测试"
  });
  console.log("✅ 测试任务创建:", testTask.taskId);
}

// 示例3：前端开发
async function frontendDevelopment() {
  console.log("\n=== 前端开发 ===");

  const frontendAgent = new FrontendAgent(mockEnv.FrontendAgent, "frontend-1");

  // 集成Live2D模型
  const live2dResult = await frontendAgent.integrateLive2D(
    "https://example.com/models/live2d-model.json",
    { scale: 1.0, x: 100, y: 100 }
  );
  console.log("✅ Live2D集成:", live2dResult.message);

  // 创建聊天界面
  const chatResult = await frontendAgent.createChatInterface();
  console.log("✅ 聊天界面创建:", chatResult.message);

  // 创建Live2D展示组件
  const viewerResult = await frontendAgent.createLive2DViewer();
  console.log("✅ Live2D展示组件创建:", viewerResult.message);
}

// 示例4：后端开发
async function backendDevelopment() {
  console.log("\n=== 后端开发 ===");

  const backendAgent = new BackendAgent(mockEnv.BackendAgent, "backend-1");

  // 创建AI对话服务
  const chatService = await backendAgent.createChatService();
  console.log("✅ AI对话服务创建:", chatService.message);

  // 创建语音合成服务
  const speechService = await backendAgent.createSpeechService();
  console.log("✅ 语音合成服务创建:", speechService.message);

  // 集成AI模型
  const aiModel = await backendAgent.integrateAIModel({
    name: "Cloudflare AI",
    provider: "cloudflare",
    model: "@cf/meta/llama-2-7b-chat-int8",
    config: { max_tokens: 100 }
  });
  console.log("✅ AI模型集成:", aiModel.message);
}

// 示例5：测试
async function testing() {
  console.log("\n=== 测试 ===");

  const testAgent = new TestAgent(mockEnv.TestAgent, "test-1");

  // 添加测试用例
  await testAgent.addTestCase({
    name: "Live2D组件渲染测试",
    type: "unit",
    description: "测试Live2D组件是否正确渲染"
  });

  await testAgent.addTestCase({
    name: "AI对话API测试",
    type: "integration",
    description: "测试AI对话API的响应"
  });

  // 运行单元测试
  const unitResults = await testAgent.runUnitTests();
  console.log("✅ 单元测试完成:", unitResults.length, "个测试");

  // 运行集成测试
  const integrationResults = await testAgent.runIntegrationTests();
  console.log("✅ 集成测试完成:", integrationResults.length, "个测试");

  // 性能测试
  const performance = await testAgent.performanceTest();
  console.log("✅ 性能测试完成:", performance.success ? "通过" : "失败");

  // 生成报告
  const report = await testAgent.generateReport();
  console.log("✅ 测试报告生成:", report.report.summary.coverage, "% 覆盖率");
}

// 示例6：部署
async function deployment() {
  console.log("\n=== 部署 ===");

  const deployAgent = new DeployAgent(mockEnv.DeployAgent, "deploy-1");

  // 构建应用
  const buildResult = await deployAgent.buildApp("windows");
  console.log("✅ 应用构建完成:", buildResult.buildId);

  // 打包应用
  const packageResult = await deployAgent.packageApp();
  console.log("✅ 应用打包完成:", packageResult.packagePath);

  // 部署到生产环境
  const deployResult = await deployAgent.deploy("production");
  console.log("✅ 部署完成:", deployResult.deploymentId);

  // 发布新版本
  const releaseResult = await deployAgent.releaseVersion([
    "新增Live2D角色展示功能",
    "集成AI对话服务",
    "优化性能"
  ]);
  console.log("✅ 版本发布完成:", releaseResult.version);

  // 创建安装程序
  const installerResult = await deployAgent.createInstaller();
  console.log("✅ 安装程序创建完成:", installerResult.installerPath);
}

// 示例7：完整工作流
async function completeWorkflow() {
  console.log("\n=== 完整工作流 ===");

  const projectManager = new ProjectManagerAgent(mockEnv.ProjectManagerAgent, "project-manager-1");

  // 开始工作流
  const workflowResult = await projectManager.startWorkflow("live2d-chat-development", {
    projectName: "Live2D Chat App",
    features: ["live2d-display", "ai-chat", "voice-synthesis"]
  });

  console.log("✅ 工作流开始:", workflowResult.workflowId);
  console.log("工作流步骤:", workflowResult.steps.length, "个");

  // 获取项目状态
  const status = await projectManager.getProjectStatus();
  console.log("项目状态:", status.status);
  console.log("任务数量:", status.tasks.length);
  console.log("代理数量:", status.agents.length);
}

// 运行所有示例
async function runAllExamples() {
  try {
    await initializeProject();
    await createDevelopmentTasks();
    await frontendDevelopment();
    await backendDevelopment();
    await testing();
    await deployment();
    await completeWorkflow();

    console.log("\n=== 所有示例完成 ===");
  } catch (error) {
    console.error("示例运行失败:", error);
  }
}

// 导出示例函数
export {
  initializeProject,
  createDevelopmentTasks,
  frontendDevelopment,
  backendDevelopment,
  testing,
  deployment,
  completeWorkflow,
  runAllExamples
};

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples();
}
