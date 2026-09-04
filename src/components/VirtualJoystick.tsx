import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  const radius = 50;

  const handlePointer = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove(dx / radius, -dy / radius); // normalized -1 to 1
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsInteracting(true);
    const touch = e.touches[0];
    handlePointer(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isInteracting) return;
    const touch = e.touches[0];
    handlePointer(touch.clientX, touch.clientY);
  };

  const onTouchEnd = () => {
    setIsInteracting(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      id="virtual-joystick-container"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative w-32 h-32 rounded-full glass-panel border border-cyan-400/30 flex items-center justify-center touch-none select-none hero-glow"
    >
      {/* Inner guide ring */}
      <div className="w-16 h-16 rounded-full border border-cyan-400/20 pointer-events-none" />

      {/* Thumb knob */}
      <div
        id="virtual-joystick-knob"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
        className="absolute w-12 h-12 rounded-full bg-cyan-400 border border-white/40 shadow-[0_0_15px_rgba(34,211,238,0.8)] pointer-events-none flex items-center justify-center transition-transform duration-75"
      >
        <div className="w-3.5 h-3.5 rounded-full bg-slate-950/80 shadow-[0_0_6px_#22d3ee]" />
      </div>
    </div>
  );
};
