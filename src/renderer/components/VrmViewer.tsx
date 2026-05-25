/**
 * VRM 3D 模型查看器
 *
 * 完整实现基于 lobe-vidol 架构：
 * - Viewer: Three.js 场景/渲染器/相机/OrbitControls/动画循环
 * - VrmModel: VRM 加载 (VRMLoaderPlugin) + 卸载
 * - EmoteController → ExpressionController → AutoBlink + AutoLookAt
 *
 * 差异: 独立组件模式 (非全局单例)
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VrmModel } from '../services/vrm/VrmModel';

interface VrmViewerProps {
  modelUrl?: string;
  mood?: number;
  energy?: number;
  memory?: number;
  emotion?: string;
  autoRotate?: boolean;
  onLoad?: () => void;
  onError?: (err: string) => void;
}

const VrmViewer: React.FC<VrmViewerProps> = ({
  modelUrl,
  mood = 78,
  energy = 65,
  memory = 45,
  emotion = 'HAPPY',
  autoRotate = true,
  onLoad,
  onError,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('初始化 3D 引擎...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // 使用 ref 持有 Three.js 对象，避免 React 重渲染
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const modelRef = useRef<VrmModel | null>(null);
  const animFrameRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // ===== 场景初始化 (一次) =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const width = parent?.clientWidth || 400;
    const height = parent?.clientHeight || 500;

    // 场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 方向光 (PI 强度, lobe-vidol 一致)
    const directionalLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 渲染器 (alpha + antialias + preserveDrawingBuffer)
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // 相机 (45° FOV, lobe-vidol 一致)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 1.5, 2.0);
    cameraRef.current = camera;

    // OrbitControls (目标点抬高到胸部)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = true;
    controls.target.set(0, 1.0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 5.0;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.update();
    controlsRef.current = controls;

    // 时钟
    const clock = new THREE.Clock();
    clock.start();
    clockRef.current = clock;

    // VrmModel (传入 camera 作为视线追踪的父节点)
    const model = new VrmModel(camera);
    modelRef.current = model;

    // 动画循环
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (model.vrm) {
        model.update(delta);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver (lobe-vidol 模式)
    const ro = new ResizeObserver(() => {
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    ro.observe(parent!);
    resizeObserverRef.current = ro;

    // 清理
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
      model.unload();
      renderer.dispose();
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      clockRef.current = null;
      modelRef.current = null;
    };
  }, [autoRotate]);

  // ===== 模型加载 (随 modelUrl 变化) =====
  useEffect(() => {
    if (!modelUrl || !modelRef.current) return;

    let cancelled = false;

    const loadModel = async () => {
      const model = modelRef.current!;
      const scene = sceneRef.current;
      if (!scene) return;

      // 卸载旧模型
      model.unload();

      setIsLoading(true);
      setError(null);
      setLoadingStage('下载模型数据...');
      setLoadingProgress(10);

      try {
        // 使用 fetch + blob 方式加载 (避免 GLTFLoader 直接跨域问题)
        const resp = await fetch(modelUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        if (cancelled) return;

        setLoadingStage('解析 VRM 模型...');
        setLoadingProgress(35);

        const objectURL = URL.createObjectURL(blob);
        await model.loadVRM(objectURL);
        URL.revokeObjectURL(objectURL);
        if (cancelled) return;

        setLoadingProgress(70);
        setLoadingStage('配置角色...');

        if (!model.vrm) {
          throw new Error('VRM 模型加载失败');
        }

        // 添加到场景
        scene.add(model.vrm.scene);
        model.vrm.scene.traverse((obj) => { obj.frustumCulled = false; });

        // lobe-vidol 风格: 重置相机到胸部位置
        requestAnimationFrame(() => {
          const chestNode = model.vrm?.humanoid.getNormalizedBoneNode('chest');
          if (chestNode && cameraRef.current && controlsRef.current) {
            const pos = chestNode.getWorldPosition(new THREE.Vector3());
            const cam = cameraRef.current;
            cam.position.set(cam.position.x, pos.y, cam.position.z);
            controlsRef.current.target.set(pos.x, pos.y, pos.z);
            controlsRef.current.update();
          }
        });

        setLoadingProgress(100);
        setLoadingStage('就绪');
        setIsLoading(false);
        onLoad?.();
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setIsLoading(false);
        onError?.(msg);
      }
    };

    loadModel();

    return () => { cancelled = true; };
  }, [modelUrl, onLoad, onError]);

  const emotionToExpression: Record<string, string> = {
    HAPPY: '😊', SAD: '😢', ANGRY: '😠',
    SURPRISED: '😮', BLUSH: '🥰', NEUTRAL: '😐',
  };

  return (
    <div style={s.container}>
      <canvas ref={canvasRef} style={s.canvas} />
      <div style={s.glowBackground} />

      {/* Loading */}
      {isLoading && (
        <div style={s.loadingOverlay}>
          <div style={s.loadingSpinner} />
          <div style={s.loadingBar}>
            <div style={{ ...s.loadingFill, width: `${loadingProgress}%` }} />
          </div>
          <span style={s.loadingText}>{loadingStage}</span>
          <span style={s.loadingPercent}>{loadingProgress}%</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={s.errorOverlay}>
          <span style={s.errorIcon}>⚠</span>
          <span style={s.errorText}>3D 模型加载失败</span>
          <span style={s.errorDetail}>{error}</span>
          <span style={s.errorHint}>请检查网络连接或更换模型</span>
        </div>
      )}

      {/* HUD */}
      {!isLoading && !error && (
        <>
          <div style={s.hudTop}>
            <span style={s.emotionBadge}>{emotionToExpression[emotion] || '😐'}</span>
          </div>
          <div style={s.hudBottom}>
            {[
              { label: '心情', val: mood, color: mood > 50 ? 'rgba(0,255,200,0.6)' : 'rgba(255,200,0,0.6)' },
              { label: '精力', val: energy, color: energy > 50 ? 'rgba(0,150,255,0.6)' : 'rgba(255,100,0,0.6)' },
              { label: '记忆', val: memory, color: 'rgba(200,0,255,0.5)' },
            ].map((item) => (
              <div key={item.label} style={s.hudRow}>
                <span style={s.hudLabel}>{item.label}</span>
                <div style={s.hudBarBg}>
                  <div style={{ ...s.hudBarFill, width: `${item.val}%`, background: item.color }} />
                </div>
                <span style={s.hudVal}>{item.val}/100</span>
              </div>
            ))}
          </div>
          <div style={s.hint}>🖱 拖拽旋转 · 滚轮缩放</div>
        </>
      )}
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: {
    width: '100%', height: '100%',
    position: 'relative', overflow: 'hidden',
    background: '#0a0a12', borderRadius: 6,
  },
  canvas: {
    width: '100%', height: '100%',
    display: 'block', position: 'relative', zIndex: 2,
  },
  glowBackground: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: 'radial-gradient(ellipse at 50% 60%, rgba(0,255,255,0.04) 0%, rgba(255,0,255,0.02) 50%, transparent 70%)',
    pointerEvents: 'none',
  },
  // Loading
  loadingOverlay: {
    position: 'absolute', inset: 0, zIndex: 10,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    background: 'rgba(10,10,18,0.85)',
  },
  loadingSpinner: {
    width: 24, height: 24,
    border: '2px solid rgba(0,255,255,0.06)',
    borderTopColor: 'rgba(0,255,255,0.3)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingBar: {
    width: 160, height: 3,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 2, overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    background: 'rgba(0,255,255,0.4)',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  loadingText: {
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
  },
  loadingPercent: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 10, color: 'rgba(0,255,255,0.3)',
  },
  // Error
  errorOverlay: {
    position: 'absolute', inset: 0, zIndex: 10,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    background: 'rgba(10,10,18,0.85)', padding: 20,
  },
  errorIcon: { fontSize: 28, marginBottom: 6 },
  errorText: {
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    fontSize: 13, color: 'rgba(255,100,100,0.6)',
  },
  errorDetail: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, color: 'rgba(255,255,255,0.15)',
    textAlign: 'center' as const, wordBreak: 'break-all' as const,
    maxWidth: '90%',
  },
  errorHint: {
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4,
  },
  // HUD
  hudTop: {
    position: 'absolute', top: 10, right: 10, zIndex: 5,
  },
  emotionBadge: {
    fontSize: 20, filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.2))',
  },
  hudBottom: {
    position: 'absolute', bottom: 10, left: 10, right: 10, zIndex: 5,
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  hudRow: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  hudLabel: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, letterSpacing: 1,
    color: 'rgba(255,255,255,0.15)', width: 24,
  },
  hudBarBg: {
    flex: 1, height: 3,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 2, overflow: 'hidden',
  },
  hudBarFill: {
    height: '100%', borderRadius: 2,
    transition: 'width 0.5s ease',
  },
  hudVal: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, color: 'rgba(255,255,255,0.12)',
    width: 32, textAlign: 'right' as const,
  },
  hint: {
    position: 'absolute', bottom: 80, left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    fontSize: 9, color: 'rgba(255,255,255,0.06)',
    letterSpacing: 1, zIndex: 5, pointerEvents: 'none',
  },
};

export default VrmViewer;
