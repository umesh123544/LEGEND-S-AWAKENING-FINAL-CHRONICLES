import React from 'react';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSettings,
  onMainMenu,
}) => {
  return (
    <div
      id="pause-modal-overlay"
      className="absolute inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani']"
    >
      <div className="max-w-sm w-full glass-panel border border-cyan-400/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl hero-glow">
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Orbitron'] tracking-wider mb-1">
          TACTICAL PAUSE
        </h2>
        <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em] mb-6">
          COMBAT SIMULATION SUSPENDED
        </p>

        <div className="flex flex-col gap-3">
          <button
            id="btn-pause-resume"
            onClick={onResume}
            className="w-full py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs uppercase font-['Orbitron'] tracking-wider hero-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> RESUME MISSION
          </button>

          <button
            id="btn-pause-restart"
            onClick={onRestart}
            className="w-full py-3 rounded-2xl glass-panel border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase font-['Orbitron'] tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> RESTART CHAPTER
          </button>

          <button
            id="btn-pause-settings"
            onClick={onSettings}
            className="w-full py-3 rounded-2xl glass-panel border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase font-['Orbitron'] tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Settings className="w-4 h-4" /> CONTROLS & AUDIO
          </button>

          <button
            id="btn-pause-menu"
            onClick={onMainMenu}
            className="w-full py-3 rounded-2xl glass-panel-crimson border-red-500/40 text-red-400 hover:text-red-300 font-bold text-xs uppercase font-['Orbitron'] tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" /> ABORT TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
