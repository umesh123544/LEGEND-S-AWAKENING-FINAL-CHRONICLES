import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Cpu } from 'lucide-react';

export interface LoadingScreenProps {
  progress: number;
  statusText: string;
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  statusText,
}) => {
  return (
    <div
      id="cinematic-loading-screen"
      className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center p-6 select-none font-['Rajdhani']"
    >
      {/* Background ambient cyber grid glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-lg w-full text-center flex flex-col items-center">
        {/* Animated Cyber Core Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl glass-panel border border-cyan-400/40 flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.3)]">
            <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
          <div className="absolute -inset-2 border border-cyan-400/20 rounded-3xl animate-ping pointer-events-none opacity-40" />
        </div>

        {/* Titles */}
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Orbitron'] tracking-[0.25em] uppercase mb-1">
          RAMAYAN
        </h1>
        <h2 className="text-sm font-bold text-cyan-400 tracking-[0.4em] uppercase mb-8 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          RESCUE OF SITA
        </h2>

        {/* World Loading Subtitle */}
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Loading world...
        </div>

        {/* Cinematic Progress Bar */}
        <div className="w-full bg-slate-900/90 border border-cyan-400/30 rounded-full h-3.5 p-0.5 mb-3 overflow-hidden shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.8)]"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ ease: 'easeOut', duration: 0.2 }}
          />
        </div>

        {/* Progress Metrics & Real-time Asset Status */}
        <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-cyan-400/90 truncate max-w-[280px] sm:max-w-none text-left">
            {statusText || 'Initializing A.U.R.A. Core Modules...'}
          </span>
          <span className="text-white font-bold tracking-wider">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Tactical Sub-label */}
        <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-500 uppercase tracking-[0.2em]">
          <Shield className="w-3.5 h-3.5 text-cyan-400/60" />
          <span>ASSET ARCHITECTURE V3.0 // 3D HIGH-FIDELITY MATRIX</span>
        </div>
      </div>
    </div>
  );
};
