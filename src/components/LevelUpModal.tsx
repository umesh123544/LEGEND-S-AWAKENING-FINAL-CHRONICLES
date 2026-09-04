import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats } from '../types';
import { soundManager } from '../game/audio';
import { ArrowUpRight, Sparkles, Shield, Swords, Zap, Heart } from 'lucide-react';

interface LevelUpModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ stats, onClose }) => {
  useEffect(() => {
    soundManager.playLevelUp();
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#3b82f6', '#fbbf24', '#ffffff'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div
      id="levelup-modal-overlay"
      className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani'] animate-in fade-in duration-200"
    >
      <div className="max-w-md w-full glass-panel border border-cyan-400/50 rounded-3xl p-6 sm:p-8 text-center hero-glow relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title */}
        <div className="inline-flex items-center justify-center p-3 rounded-2xl glass-panel-cyan border-cyan-400/50 mb-3 hero-glow">
          <Sparkles className="w-8 h-8 text-cyan-300 animate-spin" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-400 font-['Orbitron'] tracking-wider">
          AURA SURGE!
        </h2>
        <p className="text-xs font-bold text-cyan-300 uppercase tracking-[0.3em] mt-1">
          Operative Level {stats.level} Reached
        </p>

        {/* Stat boosts list */}
        <div className="grid grid-cols-2 gap-3 my-6 text-left">
          <div className="glass-panel border-white/10 p-3 rounded-2xl flex items-center gap-3">
            <Heart className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">MAX HP</div>
              <div className="text-sm font-bold text-emerald-300 font-mono flex items-center">
                {stats.maxHp} <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl flex items-center gap-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">ENERGY</div>
              <div className="text-sm font-bold text-cyan-300 font-mono flex items-center">
                {stats.maxEnergy} <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl flex items-center gap-3">
            <Swords className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">ATTACK</div>
              <div className="text-sm font-bold text-amber-300 font-mono flex items-center">
                {stats.attack} <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono">DEFENSE</div>
              <div className="text-sm font-bold text-blue-300 font-mono flex items-center">
                {stats.defense} <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Claim / Continue Button */}
        <button
          id="btn-claim-levelup"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm tracking-widest uppercase font-['Orbitron'] hero-glow hover:brightness-110 active:scale-95 transition-all"
        >
          HARNESS AURA POWER
        </button>
      </div>
    </div>
  );
};
