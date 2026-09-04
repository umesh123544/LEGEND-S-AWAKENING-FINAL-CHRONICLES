import React, { useRef, useState, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  const radius = 46;

  const handlePointer = useCallback((clientX: number, clientY: number) => {
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
  }, [onMove]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsInteracting(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isInteracting) return;
    e.preventDefault();
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsInteracting(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      id="virtual-joystick-container"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full glass-panel border-2 border-cyan-400/40 flex items-center justify-center touch-none select-none shadow-[0_0_20px_rgba(0,240,255,0.25)] cursor-grab active:cursor-grabbing"
    >
      {/* Inner guide ring */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-cyan-400/30 pointer-events-none" />

      {/* Axis crosshairs */}
      <div className="absolute w-full h-[1px] bg-cyan-400/15 pointer-events-none" />
      <div className="absolute h-full w-[1px] bg-cyan-400/15 pointer-events-none" />

      {/* Thumb knob */}
      <div
        id="virtual-joystick-knob"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
        className="absolute w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_15px_rgba(34,211,238,0.9)] pointer-events-none flex items-center justify-center transition-transform duration-75"
      >
        <div className="w-3 h-3 rounded-full bg-slate-950/80 shadow-[0_0_6px_#22d3ee]" />
      </div>
    </div>
  );
};
