import React from 'react';
import { Skull, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  onRetry: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRetry, onMainMenu }) => {
  return (
    <div
      id="gameover-modal-overlay"
      className="absolute inset-0 z-50 bg-[#050508]/90 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani'] animate-in zoom-in-95 duration-300"
    >
      <div className="max-w-md w-full glass-panel border border-red-500/40 rounded-3xl p-6 sm:p-8 text-center boss-glow">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl glass-panel-crimson border-red-500/50 mb-4 boss-glow">
          <Skull className="w-10 h-10 text-red-500 animate-pulse" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-red-500 font-['Orbitron'] tracking-wider">
          NEURAL LINK SEVERED
        </h2>
        <p className="text-xs font-bold text-red-400/80 uppercase tracking-[0.3em] mt-1">
          AURA SUIT CRITICAL FAILURE
        </p>

        <p className="my-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
          Your armor absorbed lethal kinetic feedback. The Dread Lord’s dark forces continue their advance.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="btn-retry-mission"
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-black text-xs uppercase font-['Orbitron'] tracking-wider boss-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> REBOOT & RETRY
          </button>

          <button
            id="btn-gameover-menu"
            onClick={onMainMenu}
            className="py-3.5 px-6 rounded-2xl glass-panel border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase font-['Orbitron'] tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" /> BASE
          </button>
        </div>
      </div>
    </div>
  );
};
