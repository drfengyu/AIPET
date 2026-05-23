import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';

// 注册 Pixi Ticker (必须在使用 Live2DModel 之前调用)
Live2DModel.registerTicker(PIXI.Ticker);

interface Live2DViewerProps {
  modelUrl?: string;
  scale?: number;
  onMotion?: (motion: string) => void;
  expression?: string;
  // HUD data
  mood?: number;
  energy?: number;
  memory?: number;
  emotion?: string;
}

const Live2DViewer: React.FC<Live2DViewerProps> = ({
  modelUrl = './models/Haru/Haru.model3.json',
  scale = 0.08,
  onMotion,
  expression,
  mood = 78,
  energy = 65,
  memory = 45,
  emotion = 'HAPPY',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<Live2DModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('INITIALIZING...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [characterName, setCharacterName] = useState(() => {
    const modelMap: { [key: string]: string } = {
      './models/Haru/Haru.model3.json': 'Haru',
      '/models/Hiyori/Hiyori.model3.json': 'Hiyori',
      '/models/Mao/Mao.model3.json': 'Mao',
      '/models/Mark/Mark.model3.json': 'Mark',
      '/models/Natori/Natori.model3.json': 'Natori',
    };
    return modelMap[modelUrl] || 'Haru';
  });

  useEffect(() => {
    if (!containerRef.current) return;

    let app: PIXI.Application | null = null;
    let isMounted = true;

    const initCharacter = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      setError(null);
      setLoadingStage('INITIALIZING RENDERER...');
      setLoadingProgress(5);

      // 获取容器尺寸
      const containerWidth = containerRef.current?.clientWidth || 400;
      const containerHeight = containerRef.current?.clientHeight || 500;

      // 创建PIXI应用 - 使用容器尺寸
      setLoadingStage('SETTING UP GRAPHICS...');
      setLoadingProgress(15);
      app = new PIXI.Application({
        width: containerWidth,
        height: containerHeight,
        backgroundColor: 0x0a0a12,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // 添加到DOM
      if (containerRef.current) {
        containerRef.current.appendChild(app.view as unknown as Node);
        // 设置 canvas 样式 - 填充容器
        const canvas = app.view as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        console.log('Canvas created:', canvas.width, 'x', canvas.height);
        console.log('Container:', containerRef.current.clientWidth, 'x', containerRef.current.clientHeight);
        console.log('Canvas style:', canvas.style.cssText);
        console.log('Container style:', containerRef.current.style.cssText);
      } else {
        console.error('Container ref is null!');
      }

      try {

        setLoadingStage('LOADING MODEL DATA...');
        setLoadingProgress(35);
        console.log('Loading Live2D model from:', modelUrl);
        console.log('PIXI app created, stage children:', app.stage.children.length);

        const modelMap: { [key: string]: string } = {
          './models/Haru/Haru.model3.json': 'Haru',
          '/models/Hiyori/Hiyori.model3.json': 'Hiyori',
          '/models/Mao/Mao.model3.json': 'Mao',
          '/models/Mark/Mark.model3.json': 'Mark',
          '/models/Natori/Natori.model3.json': 'Natori',
        };
        setCharacterName(modelMap[modelUrl] || 'Haru');

        setLoadingStage('DECODING TEXTURES...');
        setLoadingProgress(50);
        const model = await Live2DModel.from(modelUrl);

        setLoadingStage('RENDERING CHARACTER...');
        setLoadingProgress(70);
        if (!isMounted) return;

        // 检查模型是否成功加载
        if (!model) {
          throw new Error('Model failed to load');
        }

        // 检查 app 是否存在
        if (!app) {
          throw new Error('App is null');
        }

        // 计算自适应缩放比例
        const screenWidth = app.screen.width;
        const screenHeight = app.screen.height;
        const modelWidth = model.width;
        const modelHeight = model.height;

        console.log('Screen dimensions:', screenWidth, 'x', screenHeight);
        console.log('Model dimensions:', modelWidth, 'x', modelHeight);

        // 保存屏幕尺寸供后续使用
        (app as any)._screenWidth = screenWidth;
        (app as any)._screenHeight = screenHeight;

        // 计算适合容器的缩放比例（留出少量边距）
        const scaleX = (screenWidth * 0.95) / modelWidth;
        const scaleY = (screenHeight * 0.95) / modelHeight;
        const autoScale = Math.min(scaleX, scaleY, scale); // 使用最小值，但不超过指定的最大缩放

        model.scale.set(autoScale, autoScale);

        console.log('Model loaded successfully:', model);
        console.log('Model size:', model.width, 'x', model.height);
        console.log('Auto scale:', autoScale);
        console.log('Stage children after model added:', app.stage.children.length);

        // 居中模型
        model.x = screenWidth / 2;
        model.y = screenHeight / 2;
        model.anchor.set(0.5, 0.5);

        // 添加到舞台
        app.stage.addChild(model);

        setLoadingStage('INITIALIZING ANIMATIONS...');
        setLoadingProgress(85);

        // 保存模型引用
        modelRef.current = model;

        // 添加交互
        model.interactive = true;
        model.on('pointerdown', (event: PIXI.InteractionEvent) => {
          const position = event.data.global;
          const dx = position.x - model.x;
          const dy = position.y - model.y;

          // 检测双击
          const currentTime = Date.now();
          const lastClick = (model as unknown as { _lastClickTime?: number })._lastClickTime || 0;
          (model as unknown as { _lastClickTime: number })._lastClickTime = currentTime;

          if (currentTime - lastClick < 300) {
            // 双击 - 触发 Special 动画
            try {
              model.motion('Special');
            } catch (e) {
              console.log('Special motion not available');
            }
            onMotion?.('Special');
            return;
          }

          if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
            // 点击头部 - 触发 TapHead 动画
            try {
              model.motion('TapHead');
            } catch (e) {
              console.log('TapHead motion not available, trying Idle');
              try {
                model.motion('Idle');
              } catch (e2) {
                console.log('Idle motion not available');
              }
            }
            onMotion?.('TapHead');
          } else if (Math.abs(dx) < 80 && (dy > 50 && dy < 200)) {
            // 点击身体 - 触发 TapBody 动画
            try {
              model.motion('TapBody');
            } catch (e) {
              console.log('TapBody motion not available');
            }
            onMotion?.('TapBody');
          }
        });

        // 添加环境光效
        const ambientLight = new PIXI.Graphics();
        ambientLight.beginFill(0x00ffff, 0.1);
        ambientLight.drawCircle(screenWidth / 2, screenHeight / 2, 150);
        ambientLight.endFill();
        app.stage.addChildAt(ambientLight, 0);

        // 空闲动画循环 - 每8-12秒播放一次随机动作
        const idleMotions = ['Idle', 'TapBody', 'TapHead'];
        idleTimerRef.current = setInterval(() => {
          if (modelRef.current) {
            const randomMotion = idleMotions[Math.floor(Math.random() * idleMotions.length)];
            try { modelRef.current.motion(randomMotion); } catch { /* ignore */ }
          }
        }, 8000 + Math.random() * 4000);

        setLoadingStage('READY');
        setLoadingProgress(100);
        // 短暂延迟让用户看到 100%
        setTimeout(() => setIsLoading(false), 300);

      } catch (err) {
        console.error('Failed to init character:', err);
        console.log('Using placeholder model instead');
        console.log('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

        // 确保 app 存在
        if (!app) {
          console.error('App is null, cannot create placeholder');
          setIsLoading(false);
          setError('无法初始化模型');
          return;
        }

        // 使用占位符模型 - 居中显示
        const screenWidth = (app as any)._screenWidth || app.screen.width;
        const screenHeight = (app as any)._screenHeight || app.screen.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const character = new PIXI.Graphics();

        // 身体 - 深色科技风格
        character.beginFill(0x1a1a2e);
        character.drawEllipse(centerX, centerY + 140, 60, 100);
        character.endFill();
        character.lineStyle(2, 0x00ffff, 0.8);
        character.drawEllipse(centerX, centerY + 140, 60, 100);

        // 头部 - 带有发光效果
        character.beginFill(0x2a2a4e);
        character.drawCircle(centerX, centerY - 20, 65);
        character.endFill();
        character.lineStyle(2, 0xff00ff, 0.6);
        character.drawCircle(centerX, centerY - 20, 65);

        // 眼睛 - 霓虹发光
        character.beginFill(0x00ffff);
        character.drawCircle(centerX - 25, centerY - 30, 12);
        character.drawCircle(centerX + 25, centerY - 30, 12);
        character.endFill();

        // 瞳孔
        character.beginFill(0x000033);
        character.drawCircle(centerX - 25, centerY - 30, 6);
        character.drawCircle(centerX + 25, centerY - 30, 6);
        character.endFill();

        // 眼睛高光
        character.beginFill(0xffffff);
        character.drawCircle(centerX - 27, centerY - 32, 3);
        character.drawCircle(centerX + 23, centerY - 32, 3);
        character.endFill();

        // 嘴巴
        character.beginFill(0xff6699);
        character.drawEllipse(centerX, centerY - 5, 12, 6);
        character.endFill();

        // 头发 - 科技风格
        character.beginFill(0x1a1a3e);
        character.drawEllipse(centerX, centerY - 110, 85, 55);
        character.endFill();
        character.lineStyle(2, 0x00ffff, 0.4);
        character.drawEllipse(centerX, centerY - 110, 85, 55);

        // 发光线条装饰
        character.lineStyle(1, 0xff00ff, 0.5);
        character.moveTo(centerX - 50, centerY - 70);
        character.lineTo(centerX - 70, centerY - 100);
        character.moveTo(centerX + 50, centerY - 70);
        character.lineTo(centerX + 70, centerY - 100);

        // 添加到舞台
        app.stage.addChild(character);

        // 添加发光滤镜效果
        const glowFilter = new PIXI.filters.BlurFilter();
        glowFilter.blur = 2;
        character.filters = [glowFilter];

        // 添加交互
        app.stage.interactive = true;
        app.stage.on('pointerdown', (event: PIXI.InteractionEvent) => {
          const position = event.data.global;
          const dx = position.x - centerX;
          const dy = position.y - (centerY - 20);

          if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
            // 点击头部 - 放大效果
            character.scale.set(1.15);
            setTimeout(() => character.scale.set(1), 150);
            onMotion?.('tap_head');
          } else if (Math.abs(dx) < 80 && (dy > 50 && dy < 200)) {
            // 点击身体 - 旋转效果
            character.rotation = (Math.random() - 0.5) * 0.15;
            setTimeout(() => character.rotation = 0, 200);
            onMotion?.('tap_body');
          }
        });

        // 添加环境光效
        const ambientLight = new PIXI.Graphics();
        ambientLight.beginFill(0x00ffff, 0.1);
        ambientLight.drawCircle(screenWidth / 2, screenHeight / 2, 150);
        ambientLight.endFill();
        app.stage.addChildAt(ambientLight, 0);

        setError('使用占位符模型 - 请检查模型文件');
        setIsLoading(false);
        console.log('Placeholder model added to stage, children:', app.stage.children.length);
      }
    };

    initCharacter();

    // 窗口大小变化时自动缩放
    const handleResize = () => {
      if (!app || !modelRef.current || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      app.renderer.resize(w, h);
      const scaleX = (w * 0.95) / modelRef.current.width;
      const scaleY = (h * 0.95) / modelRef.current.height;
      const newScale = Math.min(scaleX, scaleY, scale);
      modelRef.current.scale.set(newScale, newScale);
      modelRef.current.x = w / 2;
      modelRef.current.y = h / 2;
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      isMounted = false;
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      window.removeEventListener('resize', handleResize);
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, [modelUrl, scale, onMotion]);

  // 处理表情变化
  useEffect(() => {
    if (modelRef.current && expression) {
      try {
        modelRef.current.expression(expression);
        console.log('Expression changed to:', expression);
      } catch (e) {
        console.log('Expression not available:', expression);
      }
    }
  }, [expression]);

  const styles: { [key: string]: React.CSSProperties } = {
    viewer: {
      position: 'relative',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, #0a0a12 0%, #151525 100%)',
      overflow: 'hidden',
      margin: '0',
      padding: '0',
      border: '2px solid #00ff00', // Debug: green border to see if container is visible
    },
    canvas: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10, 10, 20, 0.95)',
      color: '#00ffff',
      zIndex: 100,
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    },
    loadingRing: {
      width: '48px',
      height: '48px',
      border: '2px solid rgba(0, 255, 255, 0.15)',
      borderRadius: '50%',
      position: 'relative',
      animation: 'pulse-ring 2s ease-in-out infinite',
    },
    loadingRingInner: {
      position: 'absolute',
      top: '4px',
      left: '4px',
      right: '4px',
      bottom: '4px',
      border: '2px solid transparent',
      borderTopColor: '#00ffff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    loadingStage: {
      margin: 0,
      fontSize: '11px',
      letterSpacing: '3px',
      color: '#00ffff',
      textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
      fontFamily: '"Share Tech Mono", monospace',
    },
    progressTrack: {
      width: '200px',
      height: '4px',
      background: 'rgba(0, 255, 255, 0.1)',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      borderRadius: '2px',
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
      borderRadius: '2px',
      boxShadow: '0 0 8px rgba(0, 255, 255, 0.6), 0 0 16px rgba(255, 0, 255, 0.3)',
    },
    progressText: {
      margin: 0,
      fontSize: '10px',
      letterSpacing: '2px',
      color: '#888',
      fontFamily: '"Share Tech Mono", monospace',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '2px solid rgba(0, 255, 255, 0.3)',
      borderTopColor: '#00ffff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    characterInfo: {
      position: 'absolute',
      bottom: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.7)',
      border: '1px solid rgba(0, 255, 255, 0.4)',
      color: '#00ffff',
      padding: '6px 16px',
      fontSize: '11px',
      letterSpacing: '3px',
      fontFamily: '"Share Tech Mono", monospace',
    },
    errorOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(20, 0, 20, 0.95)',
      color: '#ff0066',
      padding: '20px',
      textAlign: 'center',
    },
    retryButton: {
      marginTop: '16px',
      padding: '8px 20px',
      background: 'transparent',
      border: '1px solid #ff0066',
      color: '#ff0066',
      fontSize: '11px',
      letterSpacing: '2px',
      cursor: 'pointer',
      fontFamily: '"Share Tech Mono", monospace',
    },
  };

  return (
    <div style={styles.viewer}>
      <div ref={containerRef} style={styles.canvas} />
      {/* HUD: Emotion Badge */}
      {!isLoading && (
        <div style={{
          position: 'absolute', top: '12%', right: '8%',
          padding: '4px 10px',
          border: '1px solid rgba(255,0,255,0.15)',
          background: 'rgba(7,7,15,0.6)',
          backdropFilter: 'blur(6px)',
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: 8, letterSpacing: 2, color: '#ff00ff',
          zIndex: 5,
        }}>
          ◉ {emotion}
        </div>
      )}
      {/* HUD: Status Bars */}
      {!isLoading && (
        <div style={{
          position: 'absolute', bottom: '15%', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 20, zIndex: 5,
        }}>
          {[
            { label: 'MOOD', val: mood, color: '#00ffff' },
            { label: 'ENERGY', val: energy, color: '#ff00ff' },
            { label: 'MEMORY', val: memory, color: '#00ff88' },
          ].map(h => (
            <div key={h.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: 7, letterSpacing: 2,
                color: 'rgba(255,255,255,0.2)', marginBottom: 3,
              }}>{h.label}</div>
              <div style={{
                width: 46, height: 2,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 1, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 1,
                  transition: 'width 0.5s ease',
                  width: h.val + '%',
                  background: h.color,
                  boxShadow: `0 0 6px ${h.color}`,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {isLoading && (
        <div style={styles.overlay}>
          <div style={styles.loadingContainer}>
            {/* 脉冲圆环 */}
            <div style={styles.loadingRing}>
              <div style={styles.loadingRingInner} />
            </div>
            {/* 阶段文字 */}
            <p style={styles.loadingStage}>{loadingStage}</p>
            {/* 进度条 */}
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressBar,
                  width: `${loadingProgress}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <p style={styles.progressText}>{loadingProgress}%</p>
          </div>
        </div>
      )}
      {error && (
        <div style={styles.errorOverlay}>
          <p style={{ fontSize: '12px', letterSpacing: '1px', marginBottom: '8px', color: '#ff0066' }}>
            {error}
          </p>
          <p style={{ fontSize: '10px', color: '#ff00ff', marginBottom: '12px' }}>
            Debug: Check console for details
          </p>
          <button
            style={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            REINITIALIZE
          </button>
        </div>
      )}
      <div style={styles.characterInfo}>
        <span>{characterName}</span>
      </div>
    </div>
  );
};

export default Live2DViewer;
