import { Agent, callable } from "agents";
import { API, AIModelConfig, DBConfig, TaskResult } from "./types";

interface BackendState {
  apis: API[];
  aiModels: AIModelConfig[];
  databases: DBConfig[];
  services: string[];
}

export class BackendAgent extends Agent<Env, BackendState> {
  initialState: BackendState = {
    apis: [],
    aiModels: [],
    databases: [],
    services: []
  };

  // 创建API端点
  @callable()
  async createAPI(api: Omit<API, "id">): Promise<TaskResult> {
    const newAPI: API = {
      ...api,
      id: `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.setState({
      apis: [...this.state.apis, newAPI]
    });

    const code = this.generateAPICode(newAPI);

    return {
      success: true,
      taskId: newAPI.id,
      message: `API "${api.path}" created`,
      data: { code, api: newAPI }
    };
  }

  // 生成API代码
  private generateAPICode(api: API): string {
    return `
// API: ${api.method} ${api.path}
// Description: ${api.description}

app.${api.method.toLowerCase()}('${api.path}', async (req, res) => {
  try {
    ${api.handler}
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
`;
  }

  // 集成AI模型
  @callable()
  async integrateAIModel(modelConfig: Omit<AIModelConfig, "id">): Promise<TaskResult> {
    const newModel: AIModelConfig = {
      ...modelConfig,
      id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.setState({
      aiModels: [...this.state.aiModels, newModel]
    });

    const code = this.generateAIModelCode(newModel);

    return {
      success: true,
      taskId: newModel.id,
      message: `AI model "${newModel.name}" integrated`,
      data: { code, model: newModel }
    };
  }

  // 生成AI模型代码
  private generateAIModelCode(model: AIModelConfig): string {
    if (model.provider === 'cloudflare') {
      return `
// Cloudflare Workers AI Integration
import { Ai } from '@cloudflare/ai';

export async function generateResponse(prompt: string) {
  const ai = new Ai(env.AI);

  const response = await ai.run('${model.model}', {
    prompt: prompt,
    ...${JSON.stringify(model.config)}
  });

  return response;
};
`;
    } else {
      return `
// ${model.provider} AI Integration
export async function generateResponse(prompt: string) {
  // Implementation for ${model.provider}
  const response = await fetch('${model.provider}-api-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: '${model.model}',
      prompt: prompt,
      ...${JSON.stringify(model.config)}
    })
  });

  return response.json();
};
`;
    }
  }

  // 设置数据库
  @callable()
  async setupDatabase(config: Omit<DBConfig, "id">): Promise<TaskResult> {
    const newDB: DBConfig = {
      ...config,
      id: `db-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.setState({
      databases: [...this.state.databases, newDB]
    });

    const code = this.generateDatabaseCode(newDB);

    return {
      success: true,
      taskId: newDB.id,
      message: `Database "${config.type}" configured`,
      data: { code, database: newDB }
    };
  }

  // 生成数据库代码
  private generateDatabaseCode(db: DBConfig): string {
    if (db.type === 'sqlite') {
      return `
// SQLite Database Setup
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('${db.connection}');

// Create tables
${db.tables.map(table => `
db.run(\`
  CREATE TABLE IF NOT EXISTS ${table} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
\`);
`).join('\n')}

export { db };
`;
    } else {
      return `
// ${db.type} Database Setup
// Connection: ${db.connection}

export async function initializeDatabase() {
  // Initialize ${db.type} connection
  // Create tables: ${db.tables.join(', ')}
}
`;
    }
  }

  // 创建AI对话服务
  @callable()
  async createChatService(): Promise<TaskResult> {
    const chatAPI: API = {
      path: "/api/chat",
      method: "POST",
      handler: `
        const { message, context } = req.body;
        const response = await generateResponse(message, context);
        res.json({ response });
      `,
      description: "AI chat endpoint"
    };

    return await this.createAPI(chatAPI);
  }

  // 创建语音合成服务
  @callable()
  async createSpeechService(): Promise<TaskResult> {
    const speechAPI: API = {
      path: "/api/speech",
      method: "POST",
      handler: `
        const { text } = req.body;
        // Use Web Speech API or TTS service
        res.json({ success: true, text });
      `,
      description: "Text-to-speech endpoint"
    };

    return await this.createAPI(speechAPI);
  }

  // 获取所有API
  @callable()
  async getAPIs(): Promise<API[]> {
    return this.state.apis;
  }

  // 获取所有AI模型
  @callable()
  async getAIModels(): Promise<AIModelConfig[]> {
    return this.state.aiModels;
  }
}
