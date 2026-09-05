import React from 'react';
import { Shield, Zap, Flame, Sparkles, Volume2, VolumeX, Pause, Crosshair, Sword, ArrowUp } from 'lucide-react';
import { DamageNumber, EnemyState, PlayerStats } from '../types';
import { getPortrait, usePortraitsVersion } from '../game/portraits';

interface HUDProps {
  stats: PlayerStats;
  damageNumbers: DamageNumber[];
  bossState: EnemyState | null;
  comboCount: number;
  objectiveText: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onAttack: () => void;
  onJump: () => void;
  onShieldStart: () => void;
  onShieldEnd: () => void;
  onDash: () => void;
  onAbilityQ: () => void;
  onAbilityE: () => void;
  onAbilityR: () => void;
  abilityCooldowns: {
    energySlash: number;
    auraDash: number;
    groundBreaker: number;
    ultimate: number;
  };
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  damageNumbers,
  bossState,
  comboCount,
  objectiveText,
  isMuted,
  onToggleMute,
  onPause,
  onAttack,
  onJump,
  onShieldStart,
  onShieldEnd,
  onDash,
  onAbilityQ,
  onAbilityE,
  onAbilityR,
  abilityCooldowns,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const energyPercent = Math.max(0, Math.min(100, (stats.energy / stats.maxEnergy) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.xp / stats.maxXp) * 100));
  usePortraitsVersion();
  const heroPortrait = getPortrait('hero');

  return (
    <div id="hud-container" className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Rajdhani']">
      {/* Top Bar Header Area */}
      <div
        className="absolute top-0 w-full z-30 px-3 sm:px-8 pt-3 sm:pt-6 flex justify-between items-start gap-2"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
          paddingLeft: 'max(12px, env(safe-area-inset-left, 12px))',
          paddingRight: 'max(12px, env(safe-area-inset-right, 12px))',
        }}
      >
        {/* --- TOP-LEFT: HERO VITAL STATUS (Responsive Glass Panel) --- */}
        <div id="hero-vital-panel" className="glass-panel p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3.5 w-36 sm:w-64 md:w-80 shrink min-w-0 pointer-events-auto shadow-2xl">
          {/* Circular Hero Emblem with Cyan Aura Glow */}
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-cyan-400 overflow-hidden bg-slate-900/90 flex items-center justify-center relative shrink-0 hero-glow">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-cyan-400 rounded-sm rotate-45 hero-glow flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 -rotate-45" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[11px] sm:text-xs font-bold tracking-widest text-cyan-400 uppercase italic truncate">
                Aura Vanguard
              </span>
              <span className="text-[10px] sm:text-[11px] opacity-70 font-mono">
                LVL {stats.level}
              </span>
            </div>

            {/* Health Bar (Sophisticated Gradient) */}
            <div className="w-full h-2 sm:h-3 bg-slate-900 rounded-full overflow-hidden mb-1 p-0">
              <div
                style={{ width: `${hpPercent}%` }}
                className="health-bar h-full rounded-full transition-all duration-200"
              />
            </div>

            {/* Energy Bar (Sophisticated Cyan-Blue Gradient) */}
            <div className="w-full h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden mb-1 p-0">
              <div
                style={{ width: `${energyPercent}%` }}
                className="energy-bar h-full rounded-full transition-all duration-200"
              />
            </div>

            {/* Subtle XP Bar */}
            <div className="w-full h-1 bg-slate-900/80 rounded-full overflow-hidden">
              <div
                style={{ width: `${xpPercent}%` }}
                className="h-full bg-yellow-400/80 rounded-full transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* --- TOP-CENTER: BOSS HEALTH BAR (When Boss Active) --- */}
        {bossState ? (
          <div id="boss-health-bar" className="flex flex-col items-center gap-1.5 pointer-events-none animate-in fade-in duration-300 max-w-[calc(100vw-11rem)] sm:max-w-md w-full min-w-0 px-2">
            <div className="text-[9px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.4em] text-red-500 uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] truncate max-w-full text-center">
              {bossState.name}
            </div>
            <div className="w-full sm:w-[480px] h-3.5 sm:h-4 bg-slate-900/90 rounded-full overflow-hidden border border-red-900/50 relative boss-glow">
              <div
                style={{ width: `${Math.max(0, Math.min(100, (bossState.hp / bossState.maxHp) * 100))}%` }}
                className="boss-health-bar h-full rounded-full transition-all duration-150"
              />
              <div className="absolute inset-0 flex justify-between px-6 pointer-events-none">
                <div className="w-px h-full bg-white/10" />
                <div className="w-px h-full bg-white/10" />
                <div className="w-px h-full bg-white/10" />
                <div className="w-px h-full bg-white/10" />
              </div>
            </div>
            <div className="text-[9px] sm:text-[10px] opacity-60 uppercase tracking-tight sm:tracking-widest text-red-300 font-mono truncate max-w-full text-center">
              Phase {bossState.phase || 1}: Shadow Resonance
            </div>
          </div>
        ) : (
          /* Mission Objective Panel */
          <div id="mission-objective-banner" className="glass-panel p-3 sm:p-4 rounded-2xl w-56 sm:w-64 pointer-events-auto hidden md:block">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1 opacity-75">
              Mission Objective
            </div>
            <div className="text-xs font-medium leading-tight text-slate-100 line-clamp-2">
              {objectiveText}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="text-[10px] opacity-50 uppercase tracking-wider font-mono">
                Tracking: Active Sector
              </div>
            </div>
          </div>
        )}

        {/* --- TOP-RIGHT: UTILITY CONTROLS --- */}
        <div className="flex items-center gap-2 pointer-events-auto shrink-0">
          <button
            id="btn-toggle-audio"
            onClick={onToggleMute}
            className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all shadow-sm"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            id="btn-pause-game"
            onClick={onPause}
            className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all shadow-sm"
            title="Pause Game (ESC)"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- COMBO COUNTER --- */}
      {comboCount > 1 && (
        <div
          id="combo-counter-panel"
          className="absolute right-3 sm:right-6 pointer-events-none animate-bounce text-right max-w-[55vw]"
          style={{ top: 'max(88px, calc(env(safe-area-inset-top, 0px) + 78px))' }}
        >
          <div className="text-xl sm:text-3xl md:text-5xl font-black text-amber-400 italic tracking-tighter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] font-['Orbitron']">
            {comboCount} HITS!
          </div>
          <div className="text-[9px] sm:text-xs font-bold text-cyan-300 tracking-widest uppercase truncate">
            AURA SURGE x{(1 + comboCount * 0.1).toFixed(1)}
          </div>
        </div>
      )}

      {/* --- FLOATING DAMAGE NUMBERS --- */}
      {damageNumbers.map((dmg) => (
        <div
          key={dmg.id}
          style={{
            left: `${dmg.x}px`,
            top: `${dmg.y}px`,
            opacity: dmg.opacity,
          }}
          className={`absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 font-black transition-all duration-500 font-['Orbitron'] ${
            dmg.isBlocked
              ? 'text-cyan-300 text-lg drop-shadow-[0_0_10px_#00f0ff]'
              : dmg.isCrit
              ? 'text-cyan-400 font-bold tracking-tighter text-2xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-125'
              : 'text-white text-lg sm:text-xl drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]'
          }`}
        >
          {dmg.isBlocked ? 'BLOCKED!' : dmg.isCrit ? `-CRIT ${dmg.value}` : `-${dmg.value}`}
        </div>
      ))}

      {/* --- BOTTOM SECTION: CONTROLS & ABILITIES --- */}
      <div
        className="absolute bottom-0 w-full z-30 px-3 sm:px-8 pb-3 sm:pb-6 flex justify-between items-end pointer-events-none"
        style={{
          paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
          paddingRight: 'max(14px, env(safe-area-inset-right, 14px))',
          paddingLeft: 'max(14px, env(safe-area-inset-left, 14px))',
        }}
      >
        {/* --- BOTTOM-LEFT: KEYBOARD MOVEMENT & EXPERIENCE GUIDE (Desktop only) --- */}
        <div className="hidden md:flex gap-4 items-end pointer-events-none">
          {/* Movement Keys Display */}
          <div className="flex flex-col gap-1 mb-1">
            <div className="text-[10px] font-bold opacity-40 uppercase tracking-tighter font-mono">
              Movement
            </div>
            <div className="flex gap-1 justify-center">
              <div className="w-7 h-7 glass-panel flex items-center justify-center rounded border border-white/20 text-xs font-mono text-slate-200">
                W
              </div>
            </div>
            <div className="flex gap-1">
              <div className="w-7 h-7 glass-panel flex items-center justify-center rounded border border-white/20 text-xs font-mono text-slate-200">
                A
              </div>
              <div className="w-7 h-7 glass-panel flex items-center justify-center rounded border border-white/20 text-xs font-mono text-slate-200">
                S
              </div>
              <div className="w-7 h-7 glass-panel flex items-center justify-center rounded border border-white/20 text-xs font-mono text-slate-200">
                D
              </div>
            </div>
          </div>

          {/* Experience Mini Gauge */}
          <div className="glass-panel px-3.5 py-2 rounded-xl flex flex-col">
            <span className="text-[10px] opacity-40 uppercase font-bold font-mono">Experience</span>
            <div className="w-36 h-1.5 bg-slate-900 rounded-full mt-1 overflow-hidden">
              <div
                style={{ width: `${xpPercent}%` }}
                className="h-full bg-yellow-400/80 rounded-full transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* --- BOTTOM-RIGHT: ACTION BAR & COMBAT CLUSTER (Mobile-Optimized & Desktop-Ready) --- */}
        <div
          id="action-buttons-bar"
          className="flex flex-col sm:flex-row items-end gap-1.5 sm:gap-3 ml-auto pointer-events-auto"
        >
          {/* Row 1 on Mobile: Secondary Skills (Dash, Jump, Q, E) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Jump (F) */}
            <button
              id="btn-action-jump"
              onClick={onJump}
              className="w-10 h-10 sm:w-12 sm:h-12 glass-panel rounded-full flex flex-col items-center justify-center border-white/10 hover:border-cyan-400/50 active:scale-95 transition-all text-cyan-300"
              title="Jump [F]"
            >
              <div className="hidden sm:block text-[8px] font-bold text-white/50 mb-0.5 font-mono">F</div>
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-cyan-400/10 rounded flex items-center justify-center border border-cyan-400/40">
                <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              </div>
            </button>

            {/* Dash (Space) */}
            <button
              id="btn-action-dash"
              onClick={onDash}
              disabled={abilityCooldowns.auraDash > 0}
              className="w-10 h-10 sm:w-12 sm:h-12 glass-panel rounded-full flex flex-col items-center justify-center border-white/10 hover:border-cyan-400/50 active:scale-95 transition-all text-cyan-300 disabled:opacity-40"
              title="Aura Dash [Space]"
            >
              <div className="hidden sm:block text-[8px] font-bold text-white/50 mb-0.5 font-mono">SPC</div>
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-cyan-400/10 rounded flex items-center justify-center border border-cyan-400/40">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              </div>
            </button>

            {/* Energy Slash (Q) */}
            <button
              id="btn-ability-q"
              onClick={onAbilityQ}
              disabled={abilityCooldowns.energySlash > 0}
              className="w-10 h-10 sm:w-12 sm:h-12 glass-panel rounded-full flex flex-col items-center justify-center border-white/10 hover:border-cyan-400/50 active:scale-95 transition-all text-cyan-300 disabled:opacity-40"
              title="Energy Slash [Q]"
            >
              <div className="hidden sm:block text-[8px] font-bold text-white/50 mb-0.5 font-mono">Q</div>
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-cyan-400/10 rounded flex items-center justify-center border border-cyan-400/40">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              </div>
            </button>

            {/* Ground Breaker (E) */}
            <button
              id="btn-ability-e"
              onClick={onAbilityE}
              disabled={abilityCooldowns.groundBreaker > 0}
              className="w-10 h-10 sm:w-12 sm:h-12 glass-panel rounded-full flex flex-col items-center justify-center border-white/10 hover:border-cyan-400/50 active:scale-95 transition-all text-cyan-300 disabled:opacity-40"
              title="Ground Breaker [E]"
            >
              <div className="hidden sm:block text-[8px] font-bold text-white/50 mb-0.5 font-mono">E</div>
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-cyan-400/10 rounded flex items-center justify-center border border-cyan-400/40">
                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              </div>
            </button>
          </div>

          {/* Row 2 on Mobile: Core Combat (Shield, Primary Attack, Awaken Ultimate) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Shield (R-Click) */}
            <button
              id="btn-action-shield"
              onMouseDown={onShieldStart}
              onMouseUp={onShieldEnd}
              onTouchStart={onShieldStart}
              onTouchEnd={onShieldEnd}
              className="w-11 h-11 sm:w-12 sm:h-12 glass-panel rounded-xl flex flex-col items-center justify-center border-white/10 hover:border-cyan-400/50 active:scale-95 transition-all text-cyan-300 group"
              title="Hold Shield [Right Click]"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
              <span className="text-[7px] sm:text-[8px] font-bold font-mono opacity-50 mt-0.5">SHIELD</span>
            </button>

            {/* Primary Attack (L-Click) - Large Main Button */}
            <button
              id="btn-action-attack"
              onClick={onAttack}
              className="w-12 h-12 sm:w-14 sm:h-14 glass-panel rounded-2xl flex flex-col items-center justify-center border-2 border-cyan-400/40 hover:border-cyan-400 active:scale-95 transition-all text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)] group"
              title="Blade Combo [Left Click]"
            >
              <Sword className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300 group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold font-mono text-cyan-400 mt-0.5">ATTACK</span>
            </button>

            {/* Awaken Ultimate: LEGEND'S AWAKENING (R) */}
            <div className="relative group">
              <div className="absolute -inset-1 sm:-inset-2 bg-cyan-500/25 blur-lg rounded-full" />
              <button
                id="btn-ability-r"
                onClick={onAbilityR}
                disabled={abilityCooldowns.ultimate > 0 || stats.energy < 75}
                className="w-12 h-12 sm:w-16 sm:h-16 glass-panel rounded-full border-2 border-cyan-400 flex flex-col items-center justify-center relative overflow-hidden active:scale-95 transition-all disabled:opacity-40"
                title="Legend's Awakening Ultimate [R]"
              >
                <div className="absolute inset-0 bg-cyan-500/15 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-black tracking-tighter text-cyan-400 z-10 uppercase italic">
                  Awaken
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-cyan-400/80 z-10 font-mono">
                  ULT
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
