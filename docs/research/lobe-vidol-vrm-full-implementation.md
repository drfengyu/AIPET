# LobeHub lobe-vidol VRM 3D 渲染完整实现分析

> Source: https://github.com/lobehub/lobe-vidol (v0.30.0)
> 本文件包含可直接复用的完整源码分析和架构设计

---

## 1. 核心架构分层

```
┌─────────────────────────────────────────────────────┐
│                  React Component                      │
│           features/AgentViewer/index.tsx              │
│  (canvas ref, 加载流程, ToolBar, Background)          │
├─────────────────────────────────────────────────────┤
│                    Viewer 类                           │
│             libs/vrmViewer/viewer.ts                  │
│  (场景/渲染器/相机/灯光/OrbitControls/动画循环/全屏)  │
├─────────────────────────────────────────────────────┤
│                    Model 类                            │
│              libs/vrmViewer/model.ts                  │
│  (VRM加载/EmoteController/头部碰撞盒/射线检测)        │
├─────────────────────────────────────────────────────┤
│                EmoteController                        │
│         libs/emoteController/emoteController.ts       │
│         ┌───────────────┐  ┌──────────────────┐       │
│         │ ExpressionCtrl│  │  MotionController│       │
│         │ - AutoBlink   │  │ - VMD/FBX/VRMA   │       │
│         │ - AutoLookAt  │  │ - AnimationMixer │       │
│         │ - LipSync     │  │ - IK Handler     │       │
│         └───────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────┘
```

## 2. Viewer 类完整实现 (viewer.ts)

### 2.1 构造函数 - 场景 + 灯光

```typescript
constructor() {
  const scene = new THREE.Scene();
  this._scene = scene;

  // 方向光 (主光源, PI 强度)
  const directionalLight = new THREE.DirectionalLight(0xff_ff_ff, Math.PI);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  // 时钟
  this._clock = new THREE.Clock();
  this._clock.start();
  this._mouse = new THREE.Vector2();
}
```

**光照设计**: 单一方向光 (intensity=PI ≈ 3.14)，位置归一化到 (0.577, 0.577, 0.577)。无环境光/半球光（被注释掉），靠 MToon 材质自发光。

### 2.2 setup() - 渲染器/相机/OrbitControls

```typescript
setup(canvas: HTMLCanvasElement, onBodyTouch?: (area) => void) {
  this._canvas = canvas;
  this._onBodyTouch = onBodyTouch;

  // 渲染器
  this._renderer = new THREE.WebGLRenderer({
    alpha: true,         // 透明背景
    antialias: true,
    preserveDrawingBuffer: true,  // 截图需要
    powerPreference: 'high-performance',
    canvas: canvas,
  });
  this._renderer.setSize(width, height);
  this._renderer.setPixelRatio(window.devicePixelRatio);

  // 相机 (45° FOV)
  this._camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
  this._camera.position.set(0, 1.5, 2.0);

  // OrbitControls (屏幕空间平移, target 抬高到胸部)
  this._cameraControls = new OrbitControls(this._camera, this._renderer.domElement);
  this._cameraControls.screenSpacePanning = true;
  this._cameraControls.target.set(0, 1.0, 0);
  this._cameraControls.update();

  // Audio listener (挂在摄像机上)
  const listener = new THREE.AudioListener();
  this._camera.add(listener);
  this._sound = new THREE.Audio(listener);

  // ResizeObserver
  new ResizeObserver(() => setTimeout(() => this.resize(), 0))
    .observe(parentElement);

  // 点击事件
  canvas.addEventListener('click', this._boundHandleClick, false);

  this.isReady = true;
  this.update();  // 启动动画循环
}
```

### 2.3 动画循环

```typescript
update = () => {
  requestAnimationFrame(this.update);
  const delta = this._clock.getDelta();

  // 1. 更新模型 (EmoteController + LipSync)
  if (this.model) this.model.update(delta);

  // 2. 更新摄像机动画 (舞蹈时)
  if (this._isDancing && this._cameraMixer) {
    this._cameraMixer.update(delta);
    this._camera?.updateMatrixWorld(true);
  }

  // 3. 渲染
  if (this._renderer && this._camera)
    this._renderer.render(this._scene, this._camera);
};
```

### 2.4 loadVrm() - 加载模型

```typescript
async loadVrm(url: string) {
  this.unload();  // 先卸载旧的
  this.model = new Model(this._camera || new THREE.Object3D());
  await this.model.loadVRM(url);
  if (!this.model?.vrm) return;

  // 禁用视锥体裁剪
  this.model.vrm.scene.traverse((obj) => { obj.frustumCulled = false; });
  this._scene.add(this.model.vrm.scene);

  // 加载空闲动画 + 重置相机
  await this.model.loadIdleAnimation();
  requestAnimationFrame(() => this.resetCamera());

  // 绑定点击事件
  if (this._canvas)
    this._canvas.addEventListener('click', this._boundHandleClick, false);
}
```

### 2.5 相机控制

```typescript
resetCamera() {
  // 获取胸部骨骼世界位置 → 将 camera target 对准胸部
  const chestNode = this.model?.vrm?.humanoid.getNormalizedBoneNode('chest');
  if (chestNode) {
    const chestWPos = chestNode.getWorldPosition(new THREE.Vector3());
    this._camera?.position.set(this._camera.position.x, chestWPos.y, this._camera.position.z);
    this._cameraControls?.target.set(chestWPos.x, chestWPos.y, chestWPos.z);
    this._cameraControls?.update();
  }
}
```

## 3. Model 类完整实现 (model.ts)

### 3.1 VRM 加载 (with VRMLookAtSmootherLoaderPlugin)

```typescript
async loadVRM(url: string): Promise<void> {
  const loader = new GLTFLoader();
  loader.crossOrigin = 'anonymous';

  // 注册 VRM 插件 + 平滑视线插件
  loader.register((parser: GLTFParser) =>
    new VRMLoaderPlugin(parser, {
      lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
      autoUpdateHumanBones: true,
    }),
  );
  const gltf = await loader.loadAsync(url);

  // 性能优化
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.removeUnnecessaryJoints(gltf.scene);
  const vrm = (this.vrm = gltf.userData.vrm);
  vrm.scene.name = 'VRMRoot';
  VRMUtils.rotateVRM0(vrm);  // VRM0 兼容

  // 初始化 EmoteController (表情+动作+自动眨眼+视线)
  this.emoteController = new EmoteController(vrm, this._lookAtTargetParent);
  this.createHeadHitbox();  // 头部碰撞盒 (用于点击检测)
}
```

### 3.2 每帧更新

```typescript
update(delta: number): void {
  // 1. 唇形同步音量检测
  if (this._lipSync) {
    const { volume } = this._lipSync.update();
    this.emoteController?.lipSync('aa', volume);
  }
  // 2. 表情 + 动作更新 (含自动眨眼)
  this.emoteController?.update(delta);
  // 3. 更新头部碰撞盒
  this.updateHeadHitbox();
}
```

### 3.3 语音播放

```typescript
async speak(buffer: ArrayBuffer, screenplay: Screenplay) {
  this.speaking = true;
  this.emoteController?.playEmotion(screenplay.expression);  // 表情
  if (screenplay.motion) this.emoteController?.playMotion(screenplay.motion, true); // 动作
  await new Promise((resolve) => {
    this._lipSync?.playFromArrayBuffer(buffer, () => resolve(true));
  });
  this.speaking = false;
}
```

### 3.4 点击/射线检测

```typescript
handleRaycasterIntersection(mouse: THREE.Vector2, camera: THREE.Camera) {
  this._raycaster.setFromCamera(mouse, camera);
  return this._raycaster.intersectObject(this.vrm.scene, true);
}

handleClick(intersects: THREE.Intersection[]): TouchAreaEnum | null {
  if (!intersects || intersects.length === 0) return null;
  // 检查是否点击了头部 hitbox
  const headHit = intersects.find(i => i.object === this._headHitbox);
  if (headHit) return TouchAreaEnum.Head;
  // 否则找到最近的骨骼 → 映射到触摸区域
  const point = intersects[0].point;
  const closestBone = this.getClosestBone(point);
  return closestBone ? this.mapBoneNameToTouchArea(closestBone) : null;
}
```

## 4. EmoteController 系统

### 4.1 emoteController.ts

```typescript
export class EmoteController {
  private _expressionController: ExpressionController;
  private _motionController: MotionController;

  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._expressionController = new ExpressionController(vrm, camera);
    this._motionController = new MotionController(vrm);
  }

  playEmotion(preset: VRMExpressionPresetName) { this._expressionController.playEmotion(preset); }
  playMotion(preset: MotionPresetName, loop: boolean) { this._motionController.playMotion(preset, loop); }
  lipSync(preset: VRMExpressionPresetName, value: number) { this._expressionController.lipSync(preset, value); }

  update(delta: number) {
    this._expressionController.update(delta);
    this._motionController.update(delta);
  }
}
```

### 4.2 ExpressionController

```typescript
export class ExpressionController {
  private _autoLookAt: AutoLookAt;      // 视线跟踪
  private _autoBlink?: AutoBlink;        // 自动眨眼
  private _expressionManager?: VRMExpressionManager;
  private _currentEmotion: VRMExpressionPresetName = 'neutral';
  private _currentLipSync: { preset: VRMExpressionPresetName; value: number } | null = null;

  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._autoLookAt = new AutoLookAt(vrm, camera);
    if (vrm.expressionManager) {
      this._expressionManager = vrm.expressionManager;
      this._autoBlink = new AutoBlink(vrm.expressionManager);
    }
  }

  playEmotion(preset: VRMExpressionPresetName) {
    // 先清除前一个表情
    if (this._currentEmotion !== 'neutral')
      this._expressionManager?.setValue(this._currentEmotion, 0);

    if (preset === 'neutral') {
      this._autoBlink?.setEnable(true);
      this._currentEmotion = preset;
      return;
    }

    // 如果是新表情，先等待眨眼完成再应用
    const t = this._autoBlink?.setEnable(false) || 0;
    this._currentEmotion = preset;
    setTimeout(() => this._expressionManager?.setValue(preset, 1), t * 1000);
  }

  lipSync(preset: VRMExpressionPresetName, value: number) {
    if (this._currentLipSync)
      this._expressionManager?.setValue(this._currentLipSync.preset, 0);
    this._currentLipSync = { preset, value };
  }

  update(delta: number) {
    this._autoBlink?.update(delta);
    if (this._currentLipSync) {
      const weight = this._currentEmotion === 'neutral'
        ? this._currentLipSync.value * 0.5
        : this._currentLipSync.value * 0.25;
      this._expressionManager?.setValue(this._currentLipSync.preset, weight);
    }
  }
}
```

### 4.3 AutoBlink

```typescript
export class AutoBlink {
  private _expressionManager: VRMExpressionManager;
  private _remainingTime: number = 0;
  private _isOpen: boolean = true;
  private _isAutoBlink: boolean = true;

  constructor(expressionManager: VRMExpressionManager) {
    this._expressionManager = expressionManager;
  }

  setEnable(isAuto: boolean): number {
    this._isAutoBlink = isAuto;
    return this._isOpen ? 0 : this._remainingTime; // 如果闭眼中返回剩余时间
  }

  update(delta: number) {
    if (this._remainingTime > 0) { this._remainingTime -= delta; return; }
    if (this._isOpen && this._isAutoBlink) { this.close(); return; }
    this.open();
  }

  private close() {
    this._isOpen = false;
    this._remainingTime = 0.12;  // 闭眼 120ms
    this._expressionManager.setValue('blink', 1);
  }
  private open() {
    this._isOpen = true;
    this._remainingTime = 5;     // 睁眼 5s
    this._expressionManager.setValue('blink', 0);
  }
}
```

### 4.4 AutoLookAt

```typescript
export class AutoLookAt {
  private _lookAtTarget: THREE.Object3D;
  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._lookAtTarget = new THREE.Object3D();
    camera.add(this._lookAtTarget);          // 挂到摄像机上
    if (vrm.lookAt) vrm.lookAt.target = this._lookAtTarget;  // VRM 看向目标
  }
}
```

## 5. AgentViewer React 组件 (features/AgentViewer/index.tsx)

### 5.1 加载流程 (3 步)

```typescript
const preloadAgentResources = async () => {
  setLoading(true);
  setLoadingStep(1);

  // 步骤 1: 下载并加载 VRM 模型
  const modelUrl = await fetchModelUrl(agentId, agent.meta.model);
  await viewer.loadVrm(modelUrl);

  if (!interactive) return;  // 非交互模式加载到这里结束

  setLoadingStep(2);
  // 步骤 2: 预加载所有动作
  await viewer.model.preloadAllMotions((loaded, total) => {
    setMotionLoadingProgress((loaded / total) * 100);
  });

  setLoadingStep(3);
  // 步骤 3: 预加载语音
  // ... (逐个预加载 greeting + touch actions 的 TTS)
};
```

### 5.2 加载完成后自动播放

```typescript
// 加载完成后: 播放 greeting 表情+动作+语音
speakCharacter({
  expression: VRMExpressionPresetName.Happy,
  tts: { message: agent.greeting },
  motion: MotionPresetName.FemaleGreeting,
}, viewer, {
  onComplete: () => viewer.resetToIdle(),
});
```

## 6. AIPET 集成方案

### 6.1 文件结构

```
src/renderer/services/vrm/
  ├── AutoBlink.ts              # 自动眨眼 (完整复制 lobe-vidol)
  ├── AutoLookAt.ts             # 视线跟踪 (完整复制)
  ├── ExpressionController.ts   # 表情管理 (完整复制)
  ├── EmoteController.ts        # 表情+动作控制器 (适配简化)
  └── VrmModel.ts               # Model 类 (适配独立组件模式)

src/renderer/components/
  └── VrmViewer.tsx             # 重写: 内嵌 Viewer 逻辑
```

### 6.2 差异适配

| lobe-vidol | AIPET |
|-----------|-------|
| Viewer 全局单例 (zustand) | Viewer 逻辑内嵌在组件内 (useRef) |
| Model 持有 camera ref | Model 通过 constructor 接收 camera |
| AgentViewer 从 store 读 agentId | VrmViewer 通过 props 接收 modelUrl |
| MotionController 支持 VMD/FBX/VRMA | 初期只实现 idle 动画播放 |

### 6.3 核心变更

Viewer 类改为**组件内直接实现**：
- 所有 Viewer 方法 (`setup`, `loadVrm`, `update`, `resize`, `resetCamera`, `unload`)
- 所有 Model 逻辑 (`loadVRM`, `EmoteController`, `AutoBlink`, `AutoLookAt`)
- 动画循环 (`requestAnimationFrame` via useEffect)
