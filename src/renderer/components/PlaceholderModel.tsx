import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface PlaceholderModelProps {
  scale?: number;
  onMotion?: (motion: string) => void;
}

const PlaceholderModel: React.FC<PlaceholderModelProps> = ({
  scale = 1.0,
  onMotion
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let app: PIXI.Application | null = null;

    const initModel = async () => {
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

      // 创建角色图形
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
      ambientLight.drawCircle(200, 250, 150);
      ambientLight.endFill();
      app.stage.addChildAt(ambientLight, 0);
    };

    initModel();

    // 清理函数
    return () => {
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
      }
    };
  }, [scale, onMotion]);

  const styles: { [key: string]: React.CSSProperties } = {
    viewer: {
      position: 'relative',
      width: '400px',
      height: '500px',
      background: 'linear-gradient(180deg, #0a0a12 0%, #151525 100%)',
      overflow: 'hidden',
    },
    canvas: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#00ffff',
      fontSize: '12px',
      letterSpacing: '2px',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.viewer}>
      <div ref={containerRef} style={styles.canvas} />
      <div style={styles.placeholder}>
        <p>PLACEHOLDER MODEL</p>
        <p style={{ fontSize: '10px', color: '#888' }}>
          Download real Live2D models to replace this
        </p>
      </div>
    </div>
  );
};

export default PlaceholderModel;
