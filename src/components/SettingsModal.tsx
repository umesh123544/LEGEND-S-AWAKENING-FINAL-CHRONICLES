import React, { useState } from 'react';
import { X, Volume2, VolumeX, Keyboard, Smartphone, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isMuted,
  onToggleMute,
  onResetSave,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      id="settings-modal-overlay"
      className="absolute inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani']"
    >
      <div className="max-w-lg w-full glass-panel border border-cyan-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative hero-glow max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl glass-panel border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Orbitron'] tracking-wide mb-1">
          SETTINGS & CONTROLS
        </h2>
        <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em] mb-6">
          CONFIGURATION & PROTOCOLS
        </p>

        {/* Audio Toggle */}
        <div className="glass-panel border-white/10 p-4 rounded-2xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
            <div>
              <div className="text-xs font-bold text-white font-['Orbitron'] tracking-wider">AUDIO SYNTHESIS</div>
              <div className="text-[11px] text-slate-400">Procedural SFX and dynamic background soundtrack</div>
            </div>
          </div>
          <button
            onClick={onToggleMute}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-['Orbitron'] tracking-wider transition-colors ${
              isMuted
                ? 'glass-panel-crimson border-red-500/50 text-red-300'
                : 'bg-cyan-400 text-slate-950 hero-glow'
            }`}
          >
            {isMuted ? 'MUTED' : 'ACTIVE'}
          </button>
        </div>

        {/* Desktop Controls Guide */}
        <div className="glass-panel border-white/10 p-4 rounded-2xl mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-widest mb-2 font-['Orbitron']">
            <Keyboard className="w-4 h-4" /> DESKTOP BATTLE CONTROLS
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
            <div><span className="text-cyan-400 font-bold">W, A, S, D</span> : Move Hero</div>
            <div><span className="text-cyan-400 font-bold">Mouse Drag</span> : Orbit Camera</div>
            <div><span className="text-cyan-400 font-bold">Left Click</span> : Sword Combo</div>
            <div><span className="text-cyan-400 font-bold">Right Click</span> : Hold Shield</div>
            <div><span className="text-cyan-400 font-bold">Spacebar</span> : Aura Dash</div>
            <div><span className="text-cyan-400 font-bold">Shift</span> : Sprint</div>
            <div><span className="text-cyan-400 font-bold">Key [Q]</span> : Energy Slash</div>
            <div><span className="text-cyan-400 font-bold">Key [E]</span> : Ground Breaker</div>
            <div><span className="text-cyan-400 font-bold">Key [R]</span> : Ultimate Nova</div>
            <div><span className="text-cyan-400 font-bold">ESC</span> : Pause / Menu</div>
          </div>
        </div>

        {/* Mobile Controls Guide */}
        <div className="glass-panel border-white/10 p-4 rounded-2xl mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-widest mb-2 font-['Orbitron']">
            <Smartphone className="w-4 h-4" /> MOBILE TOUCH CONTROLS
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Drag virtual joystick on bottom-left to run. Swipe anywhere on screen to freely orbit the camera. Tap action buttons on bottom-right to strike, block, dash, and unleash abilities.
          </p>
        </div>

        {/* Save Reset */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="text-xs text-red-400/80 hover:text-red-300 flex items-center gap-1.5 font-bold uppercase font-['Orbitron'] tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET LOCAL SAVE
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400 font-bold font-['Orbitron']">ARE YOU SURE?</span>
              <button
                onClick={() => {
                  onResetSave();
                  setConfirmReset(false);
                }}
                className="px-2.5 py-1 text-[10px] bg-red-600 text-white rounded-lg font-bold uppercase font-['Orbitron']"
              >
                YES, RESET
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 text-[10px] glass-panel border-white/10 text-slate-400 rounded-lg font-bold uppercase font-['Orbitron']"
              >
                CANCEL
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs uppercase font-['Orbitron'] tracking-wider hero-glow hover:brightness-110 active:scale-95 transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
