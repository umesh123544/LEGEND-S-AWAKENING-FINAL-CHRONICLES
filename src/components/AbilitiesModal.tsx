import React from 'react';
import { X, Sparkles, Zap, Shield, Flame, Crosshair } from 'lucide-react';

interface AbilitiesModalProps {
  onClose: () => void;
}

export const AbilitiesModal: React.FC<AbilitiesModalProps> = ({ onClose }) => {
  const abilities = [
    {
      name: 'BASIC SWORD COMBO',
      hotkey: 'LEFT CLICK',
      icon: Sparkles,
      color: 'text-cyan-400',
      border: 'border-cyan-500/40',
      desc: 'Rapid 3-strike cybernetic blade combo ending in a 360-degree high-impact cleave. Builds combo multipliers.',
    },
    {
      name: 'ENERGY SHIELD',
      hotkey: 'RIGHT CLICK (HOLD)',
      icon: Shield,
      color: 'text-blue-400',
      border: 'border-blue-500/40',
      desc: 'Projects a high-density hexagonal holographic barrier from the left gauntlet. Absorbs 85% of incoming kinetic and energy damage.',
    },
    {
      name: 'AURA DASH',
      hotkey: 'SPACEBAR',
      icon: Zap,
      color: 'text-cyan-300',
      border: 'border-cyan-400/40',
      desc: 'Flashes forward at supersonic velocity while invulnerable, slicing through enemies in the trajectory.',
    },
    {
      name: 'ENERGY SLASH',
      hotkey: 'KEY [Q]',
      icon: Crosshair,
      color: 'text-cyan-400',
      border: 'border-cyan-500/40',
      desc: 'Releases a piercing crescent arc of condensed AURA plasma across the battlefield, shredding ranks of enemies.',
    },
    {
      name: 'GROUND BREAKER',
      hotkey: 'KEY [E]',
      icon: Flame,
      color: 'text-amber-400',
      border: 'border-amber-500/40',
      desc: 'Hero leaps into the air and hammers the ground, triggering an expanding radial seismic shockwave that staggers targets.',
    },
    {
      name: "LEGEND'S AWAKENING (ULTIMATE)",
      hotkey: 'KEY [R]',
      icon: Sparkles,
      color: 'text-amber-300',
      border: 'border-amber-400/60',
      desc: 'Unchains the core stasis limiter. Enters slow-motion AURA resonance, warping reality and unleashing a catastrophic nova blast across all sectors.',
    },
  ];

  return (
    <div
      id="abilities-modal-overlay"
      className="absolute inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani']"
    >
      <div className="max-w-2xl w-full glass-panel border border-cyan-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hero-glow">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl glass-panel border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl glass-panel-cyan border-cyan-400/50 hero-glow">
            <Zap className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Orbitron'] tracking-wide">
              AURA COMBAT ARSENAL
            </h2>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em]">
              WEAPONRY & HYPER-ENERGY DISCIPLINES
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {abilities.map((ab, i) => {
            const Icon = ab.icon;
            return (
              <div
                key={i}
                className="glass-panel border-white/10 p-4 rounded-2xl flex flex-col justify-between hover:border-cyan-400/40 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${ab.color}`} />
                      <span className="font-bold text-xs sm:text-sm text-white font-['Orbitron']">{ab.name}</span>
                    </div>
                    <span className="text-[9px] font-mono glass-panel border-white/10 text-cyan-300 px-2 py-0.5 rounded">
                      {ab.hotkey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{ab.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs uppercase font-['Orbitron'] tracking-widest hero-glow hover:brightness-110 active:scale-95 transition-all"
          >
            CONFIRM LOADOUT
          </button>
        </div>
      </div>
    </div>
  );
};
