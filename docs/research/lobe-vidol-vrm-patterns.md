# LobeHub lobe-vidol VRM 3D 渲染实现调研

> Source: https://github.com/lobehub/lobe-vidol (v0.30.0)
> Key deps: three@0.164.1, @pixiv/three-vrm@2.1.2, zustand@4.5.5

---

## 1. 架构概览

### 1.1 目录结构

```
src/
├── libs/
│   ├── vrmViewer/           # 核心 Viewer + Model 类
│   │   ├── viewer.ts        # Three.js 场景、渲染器、摄像机、灯光、动画循环
│   │   └── model.ts         # VRM 模型加载、卸载、碰撞检测、交互
│   ├── emoteController/     # 表情 + 动作控制器
│   │   ├── emoteController.ts       # 统一入口（表情+动作）
│   │   ├── expressionController.ts  # 表情管理（自动眨眼+情绪）
│   │   ├── motionController.ts      # 动作管理（VMD/FBX/VRMA 三种格式）
│   │   ├── autoBlink.ts             # 自动眨眼
│   │   ├── autoLookAt.ts            # 自动视线跟踪
│   │   ├── motionPresetMap.ts       # 预设动作列表（URL + 类型）
│   │   └── type.ts                  # MotionFileType 枚举
│   ├── VRMAnimation/        # .vrma 格式加载插件
│   │   ├── loadVRMAnimation.ts
│   │   ├── VRMAnimation.ts
│   │   ├── VRMAnimationLoaderPlugin.ts
│   │   └── VRMCVRMAnimation.ts
│   ├── VRMLookAtSmootherLoaderPlugin/  # 平滑视线插件
│   ├── FBXAnimation/        # Mixamo FBX 动作重新定位
│   ├── VMDAnimation/        # MMD VMD 动画加载
│   ├── PMXAssets/           # MMD PMX 舞台加载
│   ├── lipSync/             # 唇形同步（基于 AudioContext Analyser）
│   └── materials/           # VRMShaderMaterial 自定义材质
├── features/
│   ├── AgentViewer/         # React 组件：3D 场景容器 + ToolBar + Background
│   │   ├── index.tsx        # 主组件：canvas 初始化、模型加载、状态管理
│   │   ├── ToolBar/index.tsx # 工具栏：grid/axes/截图/全屏/重置/交互切换
│   │   ├── Background/index.tsx # 背景图片/渐变光晕
│   │   └── style.ts
│   └── Live2DViewer/        # Live2D 替代实现（同一接口模式）
├── store/
│   └── global/index.ts      # 全局单例 Viewer 实例
└── hooks/
    └── useLoadModel.tsx     # 模型下载 + 缓存（fetchWithProgress + cacheStorage）
```

### 1.2 数据流

```
[AgentViewer Component]
    │
    ├── useGlobalStore(viewer) ──► Viewer 单例（new Viewer()）
    │       │
    │       ├── Viewer.setup(canvas)     ← Three.js 初始化
    │       ├── Viewer.loadVrm(url)      ← 加载 VRM
    │       └── Viewer.update()          ← requestAnimationFrame 循环
    │
    ├── Model (this.model)
    │       ├── loadVRM(url)             ← GLTFLoader + VRMLoaderPlugin
    │       ├── loadIdleAnimation()      ← 空闲动画
    │       ├── speak(buffer, screenplay) ← 语音+表情+唇形同步
    │       ├── update(delta)            ← 每帧更新
    │       └── handleClick(intersects)  ← 点击交互 → TouchAreaEnum
    │
    └── EmoteController
            ├── ExpressionController     ← 表情 + 自动眨眼 + 唇形同步
            └── MotionController          ← 动作（预加载 + 播放 + 循环控制）
```

### 1.3 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Viewer 生命周期 | **全局单例**（zustand store 中 `new Viewer()`） | 整个应用只有一个 3D 场景 |
| 模型状态 | **Model 实例存于 Viewer 内**，可替换 | `loadVrm()` 会卸载旧模型 |
| 动作格式 | 支持 3 种：**VMD / FBX / VRMA** | 兼容 Mixamo + MMD + VRMA 生态 |
| 状态管理 | **React ref callback** + zustand | canvas 引用通过 ref callback 绑定 |

---

## 2. 可复用的关键代码片段

### 2.1 Three.js 场景初始化 (viewer.ts)

```typescript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 场景
const scene = new THREE.Scene();

// 方向光 (主光源)
const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// 渲染器
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  preserveDrawingBuffer: true, // 截图需要
  powerPreference: 'high-performance',
  canvas: canvas,
});
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);

// 摄像机
const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
camera.position.set(0, 1.5, 2.0);

// OrbitControls
const cameraControls = new OrbitControls(camera, renderer.domElement);
cameraControls.screenSpacePanning = true;
cameraControls.target.set(0, 1.0, 0);
cameraControls.update();

// 动画循环
const clock = new THREE.Clock();
clock.start();

function update() {
  requestAnimationFrame(update);
  const delta = clock.getDelta();
  if (model) model.update(delta);
  renderer.render(scene, camera);
}
```

**我们的适配建议**：将这封装为 `useThreeScene` hook，而不是全局单例。

### 2.2 VRM 模型加载 (model.ts + viewer.ts)

```typescript
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLookAtSmootherLoaderPlugin } from '@/libs/VRMLookAtSmootherLoaderPlugin';

export async function loadVRM(url: string): Promise<VRM | null> {
  const loader = new GLTFLoader();
  loader.crossOrigin = 'anonymous';

  // 注册 VRM 加载插件 + 平滑视线插件
  loader.register(
    (parser) =>
      new VRMLoaderPlugin(parser, {
        lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
        autoUpdateHumanBones: true,
      }),
  );

  const gltf = await loader.loadAsync(url);

  // 性能优化：移除无用顶点和关节
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.removeUnnecessaryJoints(gltf.scene);

  const vrm: VRM = gltf.userData.vrm;
  vrm.scene.name = 'VRMRoot';

  // VRM0 兼容：旋转校正
  VRMUtils.rotateVRM0(vrm);

  // 禁用视锥体裁剪
  vrm.scene.traverse((obj) => { obj.frustumCulled = false; });

  return vrm;
}

// 卸载
export function unloadVRM(vrm: VRM) {
  VRMUtils.deepDispose(vrm.scene);
}
```

### 2.3 光照设置 (viewer.ts)

```typescript
// lobe-vidol 使用简洁的光照方案：
const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// 注释掉的备选方案（可参考）：
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
// const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444);
// hemisphereLight.position.set(0, 20, 0);
```

### 2.4 动画循环 (viewer.ts - update 方法)

```typescript
public update = () => {
  requestAnimationFrame(this.update);
  const delta = this._clock.getDelta();

  // 1. 更新模型（表情 + 动作 + 唇形同步）
  if (this.model) {
    this.model.update(delta);
  }

  // 2. 更新摄像机动画（舞蹈时）
  if (this._isDancing && this._cameraMixer) {
    this._cameraMixer.update(delta);
    this._camera?.updateMatrixWorld(true);
  }

  // 3. 渲染
  if (this._renderer && this._camera) {
    this._renderer.render(this._scene, this._camera);
  }
};
```

**Model.update** 内部调用链：
```
Model.update(delta)
  ├── LipSync.update() → volume
  ├── EmoteController.lipSync('aa', volume)
  ├── EmoteController.update(delta)
  │     ├── ExpressionController.update(delta)  ← 眨眼 + 唇形权重
  │     └── MotionController.update(delta)       ← AnimationMixer + IK
  └── updateHeadHitbox()
```

### 2.5 自动眨眼 + 视线 (autoBlink.ts + autoLookAt.ts)

```typescript
// autoBlink.ts — 周期眨眼
export class AutoBlink {
  private _remainingTime: number;
  private _isOpen: boolean;
  private _isAutoBlink: boolean;

  constructor(private _expressionManager: VRMExpressionManager) {
    this._remainingTime = 0;
    this._isAutoBlink = true;
    this._isOpen = true;
  }

  // 设置表情前调用：如果正在闭眼，返回等待时间
  setEnable(isAuto: boolean): number {
    this._isAutoBlink = isAuto;
    return this._isOpen ? 0 : this._remainingTime;
  }

  update(delta: number) {
    if (this._remainingTime > 0) {
      this._remainingTime -= delta;
      return;
    }
    if (this._isOpen && this._isAutoBlink) { this.close(); return; }
    this.open();
  }

  private close() {
    this._isOpen = false;
    this._remainingTime = BLINK_CLOSE_MAX; // 0.12s
    this._expressionManager.setValue('blink', 1);
  }
  private open() {
    this._isOpen = true;
    this._remainingTime = BLINK_OPEN_MAX;  // 5s
    this._expressionManager.setValue('blink', 0);
  }
}

// autoLookAt.ts — 视线追踪摄像机
export class AutoLookAt {
  private _lookAtTarget: THREE.Object3D;
  constructor(vrm: VRM, camera: THREE.Object3D) {
    this._lookAtTarget = new THREE.Object3D();
    camera.add(this._lookAtTarget);          // 挂到摄像机上
    if (vrm.lookAt) vrm.lookAt.target = this._lookAtTarget; // VRM看向目标
  }
}
```

### 2.6 模型下载 + 缓存 (useLoadModel.ts)

```typescript
// 从 URL 下载模型并缓存到 IndexedDB
export const useLoadModel = () => {
  const [percent, setPercent] = useState(0);

  const fetchModelUrl = async (agentId: string, remoteModelUrl: string) => {
    const cacheKey = getModelPathByAgentId(agentId);
    let blob = await cacheStorage.getItem(cacheKey);

    if (!blob) {
      blob = await fetchWithProgress(remoteModelUrl, {
        onProgress: (loaded, total) => {
          setPercent(Math.ceil((loaded / total) * 100));
        },
      });
      await cacheStorage.setItem(cacheKey, blob);
    }

    return URL.createObjectURL(blob); // 转为可加载的 blob URL
  };

  return { percent, fetchModelUrl };
};
```

---

## 3. 差异点分析：改为独立组件模式

lobe-vidol 的架构与我们的需求有本质差异：

| 方面 | lobe-vidol 做法 | 我们的需求 |
|------|----------------|-----------|
| Viewer 生命周期 | **全局单例**（`store/global/index.ts` 中 `const viewer = new Viewer()`） | **组件级实例**（每个页面/弹窗独立） |
| 状态管理 | zustand store + `useGlobalStore` 读取 | React state / ref 即可 |
| 场景复用 | 始终同一个 canvas，`loadVrm` 替换模型 | 每个组件独立 canvas 和场景 |
| 舞台/背景 | PMX 3D 舞台 + 2D 背景叠加 | 初期只需纯色/渐变背景 |

**改造策略**：

1. **`Viewer` 类改为组件内创建**：用 `useRef<Viewer>()` + `useEffect` 管理生命周期
2. **`useLoadModel` 改为 `useVrmLoader`**：返回 `{ loading, percent, loadAndCreateViewer }`
3. **不依赖 zustand store**：所有状态通过 React 状态/回调传递

```typescript
// 推荐的独立组件模式
function VrmViewer({ modelUrl }: { modelUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewer = new Viewer();
    viewer.setup(canvas);
    viewer.loadVrm(modelUrl);
    viewerRef.current = viewer;

    return () => {
      viewer.unload();
      viewerRef.current = null;
    };
  }, [modelUrl]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
```

---

## 4. 可直接参考的 UI 设计模式

### 4.1 AgentViewer React 组件模式

`src/features/AgentViewer/index.tsx` 提供了一个完整的参考实现：

- **Props 接口**：
  ```typescript
  interface Props {
    agentId: string;
    className?: string;
    height?: number | string;
    interactive?: boolean;   // 是否启用交互
    style?: React.CSSProperties;
    toolbar?: boolean;       // 是否显示工具栏
    width?: number | string;
  }
  ```

- **加载流程** (3 步，带进度显示)：
  1. `step=1` — 下载/加载 VRM 模型（显示模型下载进度 `modelPercent`）
  2. `step=2` — 预加载动作（显示 `motionLoadingProgress`）
  3. `step=3` — 预加载语音（显示 `voiceLoadingProgress`）

- **加载完成后**：如果 `interactive=true`，自动播放打招呼动画+语音

- **拖放支持**：canvas 上监听 `dragover` / `drop` 事件，支持 `.vrm` / `.fbx` / `.pmx` / `.vmd` / `.vrma` 文件拖放替换

### 4.2 ToolBar 工具栏

`src/features/AgentViewer/ToolBar/index.tsx` — 使用 `@lobehub/ui` 的 `ActionIconGroup`：

```
┌─────────────┐
│   ↺ Reset   │  ← 重置空闲动画
│   □ FullScr │  ← 全屏
│   ☝ Interact│  ← 切换交互模式
│   📷 Screen │  ← 截图
│   ▦ Grid    │  ← 网格开关
│   ▼ More    │  ← 下拉：轴线/重置相机/相机助手/轨道控制
└─────────────┘
```

**UI 图标库**：`lucide-react`（`RotateCcw`, `Fullscreen`, `Pointer`, `Aperture`, `Grid3x3` 等）

### 4.3 Background 背景层

`src/features/AgentViewer/Background/index.tsx` — 两层背景：

1. **图片背景**（高优先级）：`backgroundImage: url(${backgroundUrl})`，`z-index: -1`
2. **渐变光晕**（fallback）：CSS `linear-gradient` 动画 + `filter: blur(69px)`

```css
/* 渐变光晕背景 */
background: linear-gradient(
  135deg,
  purple 0%, blue 30%, red 70%, cyan 100%
);
background-size: 200% 200%;
filter: blur(69px);
animation: glow 10s ease infinite;
```

### 4.4 交互触摸系统

- 点击模型不同部位 → 映射到 `TouchAreaEnum`（Head / Arm / Leg / Chest / Belly / Buttocks）
- 每个触摸区域绑定剧本（`Screenplay`）：包含 `expression` + `motion` + `tts` 文本
- 触发时调用 `speakCharacter()` → TTS 语音 + 表情 + 动作 + 唇形同步

### 4.5 全屏模式

```typescript
// 进入全屏
ref.current.requestFullscreen();
// 退出全屏
document.exitFullscreen();
// 全屏时 canvas 背景变黑
canvas.style.backgroundColor = 'black';
// 退出时恢复透明
canvas.style.backgroundColor = 'transparent';
```

---

## 5. 关键技术依赖

```json
{
  "three": "^0.164.1",
  "@pixiv/three-vrm": "^2.1.2",
  "@pixiv/three-vrm-core": "^2.1.2",
  "mmd-parser": "^1.0.4",
  "zustand": "^4.5.5"
}
```

我们只需要：`three` + `@pixiv/three-vrm`（核心库。`VRMLookAtSmootherLoaderPlugin` 在 three-vrm 中已内置）。

---

## 6. 推荐的最小化实现路径

### Phase 1 — 基础渲染
```
src/components/VrmViewer/
├── viewer.ts        # 精简版：scene + camera + renderer + animation loop
├── model.ts         # 精简版：loadVRM(url) + unload + update
└── index.tsx        # React 组件：canvas ref + useEffect
```
依赖：`three` + `@pixiv/three-vrm`

### Phase 2 — 动画
```
src/libs/
├── emoteController/     # 复制并精简（去掉 FBX/VMD 支持，只保留 VRMA）
└── VRMAnimation/        # 复制完整（vrma 加载插件）
```

### Phase 3 — UI
```
src/components/VrmViewer/
├── ToolBar.tsx           # 工具栏（截图/全屏/重置）
├── LoadingOverlay.tsx    # 加载进度
└── Background.tsx        # 背景
```

---

*调研时间: 2026-05-25*
*仓库版本: lobe-vidol v0.30.0*
