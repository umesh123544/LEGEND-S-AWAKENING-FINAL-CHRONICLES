import React from 'react';
import { PlayerStats } from '../types';
import { Sparkles, Shield, Swords, Zap, Heart, Footprints, Target, X } from 'lucide-react';

interface CharacterModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({ stats, onClose }) => {
  return (
    <div
      id="character-modal-overlay"
      className="absolute inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani']"
    >
      <div className="max-w-xl w-full glass-panel border border-cyan-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative hero-glow max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl glass-panel border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl glass-panel-cyan border-cyan-400/50 hero-glow">
            <Sparkles className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Orbitron'] tracking-wide">
              OPERATIVE LOADOUT
            </h2>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em]">
              AURA-POWERED EXOSUIT SPECIFICATIONS
            </p>
          </div>
        </div>

        {/* Armor Lore & Visual Summary */}
        <div className="glass-panel border-white/10 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-950 to-slate-900 border border-cyan-400/50 flex items-center justify-center hero-glow shrink-0">
            <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>
          <div className="text-sm text-slate-300">
            <div className="font-bold text-cyan-300 font-['Orbitron'] text-xs sm:text-sm uppercase tracking-wider">Mark VII Kinetic Exoskeleton</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Forged with ancient AURA-conductive alloys. Channels hyper-condensed plasma through the right gauntlet blade and projects holographic hexagonal deflector barriers.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass-panel border-white/10 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Heart className="w-4 h-4 text-emerald-400" /> VITAL HP
            </div>
            <div className="text-xl font-bold text-white font-mono">{stats.hp} / {stats.maxHp}</div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Zap className="w-4 h-4 text-cyan-400" /> AURA ENERGY
            </div>
            <div className="text-xl font-bold text-white font-mono">{stats.energy} / {stats.maxEnergy}</div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Swords className="w-4 h-4 text-amber-400" /> ATTACK POWER
            </div>
            <div className="text-xl font-bold text-white font-mono">{stats.attack}</div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Shield className="w-4 h-4 text-blue-400" /> ARMOR DEFENSE
            </div>
            <div className="text-xl font-bold text-white font-mono">{stats.defense}</div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Target className="w-4 h-4 text-rose-400" /> CRIT CHANCE
            </div>
            <div className="text-xl font-bold text-white font-mono">{Math.round(stats.critChance * 100)}%</div>
          </div>

          <div className="glass-panel border-white/10 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Footprints className="w-4 h-4 text-purple-400" /> MOVE VELOCITY
            </div>
            <div className="text-xl font-bold text-white font-mono">{stats.moveSpeed} m/s</div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs uppercase font-['Orbitron'] tracking-widest hero-glow hover:brightness-110 active:scale-95 transition-all"
          >
            RETURN TO BATTLE
          </button>
        </div>
      </div>
    </div>
  );
};
