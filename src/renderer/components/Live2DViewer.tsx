import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';

// 注册 Pixi Ticker (必须在使用 Live2DModel 之前调用)
Live2DModel.registerTicker(PIXI.Ticker);

interface Live2DViewerProps {
  modelUrl?: string;
  scale?: number;
  onMotion?: (motion: string) => void;
}

const Live2DViewer: React.FC<Live2DViewerProps> = ({
  modelUrl = '/models/live2d-model.json',
  scale = 0.08, // 调整缩放比例以适应大尺寸模型
  onMotion
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState(() => {
    const modelMap: { [key: string]: string } = {
      '/models/live2d-model.json': 'Haru',
      '/models/live2d-model2.json': 'Hiyori',
      '/models/live2d-model3.json': 'Mao',
      '/models/live2d-model4.json': 'Mark',
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

      // 创建PIXI应用
      app = new PIXI.Application({
        width: 400,
        height: 500,
        backgroundColor: 0x0a0a12,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // 添加到DOM
      containerRef.current?.appendChild(app.view as unknown as Node);

      try {

        // 加载真实的Live2D模型
        console.log('Loading Live2D model from:', modelUrl);

        // 更新角色名称
        const modelMap: { [key: string]: string } = {
          '/models/live2d-model.json': 'Haru',
          '/models/live2d-model2.json': 'Hiyori',
          '/models/live2d-model3.json': 'Mao',
          '/models/live2d-model4.json': 'Mark',
        };
        setCharacterName(modelMap[modelUrl] || 'Haru');

        const model = await Live2DModel.from(modelUrl);

        // 检查组件是否仍然挂载
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
        const containerWidth = app.screen.width;
        const containerHeight = app.screen.height;
        const modelWidth = model.width;
        const modelHeight = model.height;

        // 计算适合容器的缩放比例（留出一些边距）
        const scaleX = (containerWidth * 0.8) / modelWidth;
        const scaleY = (containerHeight * 0.8) / modelHeight;
        const autoScale = Math.min(scaleX, scaleY, scale); // 使用最小值，但不超过指定的最大缩放

        model.scale.set(autoScale, autoScale);

        console.log('Model loaded successfully:', model);
        console.log('Model size:', model.width, 'x', model.height);
        console.log('Auto scale:', autoScale);

        // 居中模型
        model.x = containerWidth / 2;
        model.y = containerHeight / 2;
        model.anchor.set(0.5, 0.5);

        // 添加到舞台
        app.stage.addChild(model);

        // 添加交互
        model.interactive = true;
        model.on('pointerdown', (event: PIXI.InteractionEvent) => {
          const position = event.data.global;
          const dx = position.x - model.x;
          const dy = position.y - model.y;

          if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
            // 点击头部 - 触发动画
            try {
              model.motion('Idle');
            } catch (e) {
              console.log('Idle motion not available');
            }
            onMotion?.('Idle');
          } else if (Math.abs(dx) < 80 && (dy > 50 && dy < 200)) {
            // 点击身体 - 触发动画
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
        ambientLight.drawCircle(app.screen.width / 2, app.screen.height / 2, 150);
        ambientLight.endFill();
        app.stage.addChildAt(ambientLight, 0);

        setIsLoading(false);

      } catch (err) {
        console.error('Failed to init character:', err);
        console.log('Using placeholder model instead');

        // 确保 app 存在
        if (!app) {
          console.error('App is null, cannot create placeholder');
          setIsLoading(false);
          setError('无法初始化模型');
          return;
        }

        // 使用占位符模型
        const character = new PIXI.Graphics();

        // 身体 - 深色科技风格
        character.beginFill(0x1a1a2e);
        character.drawEllipse(200, 320, 60, 100);
        character.endFill();
        character.lineStyle(2, 0x00ffff, 0.8);
        character.drawEllipse(200, 320, 60, 100);

        // 头部 - 带有发光效果
        character.beginFill(0x2a2a4e);
        character.drawCircle(200, 180, 65);
        character.endFill();
        character.lineStyle(2, 0xff00ff, 0.6);
        character.drawCircle(200, 180, 65);

        // 眼睛 - 霓虹发光
        character.beginFill(0x00ffff);
        character.drawCircle(175, 170, 12);
        character.drawCircle(225, 170, 12);
        character.endFill();

        // 瞳孔
        character.beginFill(0x000033);
        character.drawCircle(175, 170, 6);
        character.drawCircle(225, 170, 6);
        character.endFill();

        // 眼睛高光
        character.beginFill(0xffffff);
        character.drawCircle(173, 168, 3);
        character.drawCircle(223, 168, 3);
        character.endFill();

        // 嘴巴
        character.beginFill(0xff6699);
        character.drawEllipse(200, 205, 12, 6);
        character.endFill();

        // 头发 - 科技风格
        character.beginFill(0x1a1a3e);
        character.drawEllipse(200, 110, 85, 55);
        character.endFill();
        character.lineStyle(2, 0x00ffff, 0.4);
        character.drawEllipse(200, 110, 85, 55);

        // 发光线条装饰
        character.lineStyle(1, 0xff00ff, 0.5);
        character.moveTo(150, 150);
        character.lineTo(130, 120);
        character.moveTo(250, 150);
        character.lineTo(270, 120);

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
          const dx = position.x - 200;
          const dy = position.y - 180;

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
        ambientLight.drawCircle(app.screen.width / 2, app.screen.height / 2, 150);
        ambientLight.endFill();
        app.stage.addChildAt(ambientLight, 0);

        setError('使用占位符模型 - 请检查模型文件');
        setIsLoading(false);
      }
    };

    initCharacter();

    // 清理函数
    return () => {
      isMounted = false;
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, [modelUrl, scale, onMotion]);

  const styles: { [key: string]: React.CSSProperties } = {
    viewer: {
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '400px',
      background: 'linear-gradient(180deg, #0a0a12 0%, #151525 100%)',
      overflow: 'hidden',
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
      background: 'rgba(10, 10, 20, 0.9)',
      color: '#00ffff',
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
      {isLoading && (
        <div style={styles.overlay}>
          <div style={styles.spinner} />
          <p style={{ marginTop: '12px', fontSize: '11px', letterSpacing: '2px' }}>
            INITIALIZING CHARACTER...
          </p>
        </div>
      )}
      {error && (
        <div style={styles.errorOverlay}>
          <p style={{ fontSize: '12px', letterSpacing: '1px', marginBottom: '8px' }}>
            {error}
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
