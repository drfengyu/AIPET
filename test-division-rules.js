// 分工规则测试脚本
const fs = require('fs');
const path = require('path');

// 测试用例
const testCases = [
  {
    name: '前端开发 - 修改React组件',
    type: 'file-edit',
    filePath: 'src/renderer/components/ChatWindow.tsx',
    expectedRole: '前端开发',
    description: '修改聊天窗口组件'
  },
  {
    name: '前端开发 - 修改App组件',
    type: 'file-edit',
    filePath: 'src/renderer/App.tsx',
    expectedRole: '前端开发',
    description: '修改主应用组件'
  },
  {
    name: '后端开发 - 修改主进程',
    type: 'file-edit',
    filePath: 'src/main/index.ts',
    expectedRole: '后端开发',
    description: '修改Electron主进程'
  },
  {
    name: '后端开发 - 修改代理',
    type: 'file-edit',
    filePath: 'src/agents/FrontendAgent.ts',
    expectedRole: '后端开发',
    description: '修改前端代理'
  },
  {
    name: '测试 - 修改测试文件',
    type: 'file-edit',
    filePath: 'src/agents/test-agents.ts',
    expectedRole: '测试',
    description: '修改测试文件'
  },
  {
    name: '部署 - 修改配置文件',
    type: 'file-edit',
    filePath: 'package.json',
    expectedRole: '部署',
    description: '修改项目配置'
  },
  {
    name: '前端开发 - 运行Vite',
    type: 'bash-command',
    command: 'yarn dev:vite',
    expectedRole: '前端开发',
    description: '启动Vite开发服务器'
  },
  {
    name: '后端开发 - 运行Electron',
    type: 'bash-command',
    command: 'yarn dev:electron',
    expectedRole: '后端开发',
    description: '启动Electron应用'
  },
  {
    name: '测试 - 运行测试',
    type: 'bash-command',
    command: 'yarn test',
    expectedRole: '测试',
    description: '运行单元测试'
  },
  {
    name: '部署 - 构建应用',
    type: 'bash-command',
    command: 'yarn build',
    expectedRole: '部署',
    description: '构建应用'
  }
];

// 模拟分工判断逻辑
function judgeDivision(testCase) {
  if (testCase.type === 'file-edit') {
    const filePath = testCase.filePath;

    // 前端开发规则
    if (filePath.startsWith('src/renderer/') || filePath.startsWith('public/')) {
      return '前端开发';
    }

    // 后端开发规则
    if (filePath.startsWith('src/main/') || filePath.startsWith('src/agents/')) {
      // 排除测试文件
      if (filePath.includes('test-')) {
        return '测试';
      }
      return '后端开发';
    }

    // 测试规则
    if (filePath.includes('test-') || filePath.includes('.test.')) {
      return '测试';
    }

    // 部署规则
    if (filePath.includes('package.json') ||
        filePath.includes('vite.config') ||
        filePath.includes('tsconfig') ||
        filePath.includes('wrangler')) {
      return '部署';
    }

    return '未知';
  }

  if (testCase.type === 'bash-command') {
    const command = testCase.command;

    // 前端开发命令
    if (command.includes('dev:vite') || command.includes('vite')) {
      return '前端开发';
    }

    // 后端开发命令
    if (command.includes('dev:electron') || command.includes('electron')) {
      return '后端开发';
    }

    // 测试命令
    if (command.includes('test') || command.includes('jest')) {
      return '测试';
    }

    // 部署命令
    if (command.includes('build') || command.includes('electron-builder')) {
      return '部署';
    }

    return '未知';
  }

  return '未知';
}

// 运行测试
function runTests() {
  console.log('=== 分工规则测试 ===\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const result = judgeDivision(testCase);
    const success = result === testCase.expectedRole;

    if (success) {
      passed++;
      console.log(`✅ 测试 ${index + 1}: ${testCase.name}`);
      console.log(`   文件/命令: ${testCase.filePath || testCase.command}`);
      console.log(`   预期角色: ${testCase.expectedRole}`);
      console.log(`   实际角色: ${result}`);
      console.log(`   状态: 通过\n`);
    } else {
      failed++;
      console.log(`❌ 测试 ${index + 1}: ${testCase.name}`);
      console.log(`   文件/命令: ${testCase.filePath || testCase.command}`);
      console.log(`   预期角色: ${testCase.expectedRole}`);
      console.log(`   实际角色: ${result}`);
      console.log(`   状态: 失败\n`);
    }
  });

  console.log('=== 测试结果 ===');
  console.log(`总测试数: ${testCases.length}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`通过率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  return failed === 0;
}

// 运行测试
const success = runTests();

// 写入测试结果到日志
const logContent = `
=== 分工规则测试结果 ===
时间: ${new Date().toLocaleString()}
总测试数: ${testCases.length}
通过: ${testCases.filter(t => judgeDivision(t) === t.expectedRole).length}
失败: ${testCases.filter(t => judgeDivision(t) !== t.expectedRole).length}

=== 详细结果 ===
${testCases.map((t, i) => {
  const result = judgeDivision(t);
  const status = result === t.expectedRole ? '✅' : '❌';
  return `${status} 测试 ${i + 1}: ${t.name} - 预期: ${t.expectedRole}, 实际: ${result}`;
}).join('\n')}
`;

fs.writeFileSync('.claude/division-test-log.txt', logContent);

console.log(`\n测试结果已保存到: .claude/division-test-log.txt`);

process.exit(success ? 0 : 1);
