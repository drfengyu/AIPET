import React, { useRef, useEffect, useState } from 'react';

interface AudioVisualizerProps {
  isSpeaking?: boolean;
  barCount?: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isSpeaking = false,
  barCount = 7,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 4 + Math.random() * 8)
  );
  const rafRef = useRef<number>(0);
  const animRef = useRef({ time: 0, phase: 0 });

  useEffect(() => {
    const animate = () => {
      animRef.current.time += 0.02;
      animRef.current.phase += isSpeaking ? 0.15 : 0.035;

      const newHeights = Array.from({ length: barCount }, (_, i) => {
        const base = isSpeaking
          ? 3 + Math.abs(Math.sin(animRef.current.phase + i * 1.8)) * 14
          : 3 + (Math.sin(animRef.current.phase + i * 0.9) + 1) * 3;
        return Math.max(2, Math.min(18, base));
      });

      setHeights(newHeights);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isSpeaking, barCount]);

  return (
    <div ref={containerRef} style={{
      display: 'flex', gap: 2, alignItems: 'center', height: 14,
    }}>
      {heights.map((h, i) => (
        <span key={i} style={{
          width: 2,
          height: h,
          background: isSpeaking
            ? `linear-gradient(180deg, #00ffff, #ff00ff)`
            : '#00ffff',
          borderRadius: 1,
          opacity: isSpeaking ? 0.8 : 0.25,
          transition: 'opacity 0.3s ease',
          boxShadow: isSpeaking ? '0 0 4px #00ffff' : 'none',
        }} />
      ))}
    </div>
  );
};

export default AudioVisualizer;
