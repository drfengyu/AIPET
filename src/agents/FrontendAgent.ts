import { Agent, callable } from "agents";
import { Component, Design, TaskResult } from "./types";

interface FrontendState {
  components: Component[];
  designs: Design[];
  live2dModels: string[];
  uiComponents: string[];
}

export class FrontendAgent extends Agent<Env, FrontendState> {
  initialState: FrontendState = {
    components: [],
    designs: [],
    live2dModels: [],
    uiComponents: []
  };

  // 创建React组件
  @callable()
  async createComponent(component: Omit<Component, "id">): Promise<TaskResult> {
    const newComponent: Component = {
      ...component,
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.setState({
      components: [...this.state.components, newComponent]
    });

    const code = this.generateComponentCode(newComponent);

    return {
      success: true,
      taskId: newComponent.id,
      message: `Component "${newComponent.name}" created`,
      data: { code, component: newComponent }
    };
  }

  // 生成React组件代码
  private generateComponentCode(component: Component): string {
    const propsInterface = component.props?.length
      ? `interface ${component.name}Props {\n${component.props.map(p => `  ${p}: any;`).join("\n")}\n}`
      : "";

    const stateDeclaration = component.state?.length
      ? `const [${component.state.join(", ")}] = useState();`
      : "";

    return `
${propsInterface ? propsInterface + "\n" : ""}
export const ${component.name} = (${component.props?.length ? "props" : ""}: ${component.props?.length ? `${component.name}Props` : "any"}) => {
  ${stateDeclaration}

  return (
    <div className="${component.name.toLowerCase()}">
      ${component.content}
    </div>
  );
};
`;
  }

  // 集成Live2D模型
  @callable()
  async integrateLive2D(modelUrl: string, options?: { scale?: number; x?: number; y?: number }): Promise<TaskResult> {
    const modelConfig = {
      url: modelUrl,
      scale: options?.scale || 1,
      x: options?.x || 0,
      y: options?.y || 0,
      addedAt: new Date()
    };

    this.setState({
      live2dModels: [...this.state.live2dModels, modelUrl]
    });

    const code = this.generateLive2DCode(modelConfig);

    return {
      success: true,
      taskId: `live2d-${Date.now()}`,
      message: `Live2D model integrated: ${modelUrl}`,
      data: { code, config: modelConfig }
    };
  }

  // 生成Live2D集成代码
  private generateLive2DCode(config: any): string {
    return `
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

async function loadLive2DModel() {
  const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb
  });

  document.body.appendChild(app.view);

  const model = await Live2DModel.from('${config.url}');
  model.scale.set(${config.scale});
  model.x = ${config.x};
  model.y = ${config.y};

  app.stage.addChild(model);

  // 添加交互
  model.on('hit', (hitAreas: string[]) => {
    if (hitAreas.includes('head')) {
      model.motion('tap_head');
    }
  });

  return model;
}
`;
  }

  // 设计UI界面
  @callable()
  async designUI(design: Omit<Design, "id">): Promise<TaskResult> {
    const newDesign: Design = {
      ...design,
      id: `design-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.setState({
      designs: [...this.state.designs, newDesign]
    });

    return {
      success: true,
      taskId: newDesign.id,
      message: `UI design "${newDesign.name}" created`,
      data: { design: newDesign }
    };
  }

  // 创建聊天界面组件
  @callable()
  async createChatInterface(): Promise<TaskResult> {
    const chatComponent: Component = {
      name: "ChatWindow",
      type: "functional",
      props: ["messages", "onSendMessage"],
      state: ["inputValue"],
      content: `
        <div className="chat-window">
          <div className="messages">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
          </div>
          <div className="input-area">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>发送</button>
          </div>
        </div>
      `
    };

    return await this.createComponent(chatComponent);
  }

  // 创建Live2D展示组件
  @callable()
  async createLive2DViewer(): Promise<TaskResult> {
    const viewerComponent: Component = {
      name: "Live2DViewer",
      type: "functional",
      props: ["modelUrl", "onMotion"],
      state: [],
      content: `
        <div className="live2d-viewer" ref={viewerRef}>
          {/* Live2D canvas will be rendered here */}
        </div>
      `
    };

    return await this.createComponent(viewerComponent);
  }

  // 获取所有组件
  @callable()
  async getComponents(): Promise<Component[]> {
    return this.state.components;
  }

  // 获取所有设计
  @callable()
  async getDesigns(): Promise<Design[]> {
    return this.state.designs;
  }
}
