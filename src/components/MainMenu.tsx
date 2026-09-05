import React from 'react';
import { Play, RotateCcw, User, Zap, Settings, Sparkles, Skull } from 'lucide-react';

interface MainMenuProps {
  hasSaveGame: boolean;
  playerLevel: number;
  onPlay: () => void;
  onNewGame: () => void;
  onOpenCharacter: () => void;
  onOpenAbilities: () => void;
  onOpenChapters: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  hasSaveGame,
  playerLevel,
  onPlay,
  onNewGame,
  onOpenCharacter,
  onOpenAbilities,
  onOpenChapters,
  onOpenSettings,
}) => {
  return (
    <div
      id="main-menu-screen"
      className="relative w-full h-full flex flex-col justify-between overflow-y-auto overflow-x-hidden bg-[#050508] text-white font-['Rajdhani'] select-none pb-6 md:pb-0"
    >
      {/* Dynamic Visual Split Background (Hero Cyan Glow vs Villain Red Glow) */}
      <div className="absolute inset-0 flex pointer-events-none">
        {/* Left Side: Hero Domain */}
        <div className="relative w-1/2 h-full bg-gradient-to-br from-[#061826]/70 via-[#050508] to-[#050508] overflow-hidden border-r border-cyan-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(34,211,238,0.14),transparent_70%)]" />
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-pulse" />

          {/* Hero Cyber Emblem */}
          <div className="hidden md:flex absolute bottom-16 left-12 opacity-40 flex-col items-start">
            <div className="w-20 h-20 rounded-2xl glass-panel border-cyan-400/40 flex items-center justify-center hero-glow">
              <Sparkles className="w-10 h-10 text-cyan-400" />
            </div>
            <span className="text-xs font-bold text-cyan-400 mt-2 font-['Orbitron'] tracking-[0.3em] uppercase italic">
              Hero // Aura Vanguard
            </span>
          </div>
        </div>

        {/* Right Side: Villain Domain */}
        <div className="relative w-1/2 h-full bg-gradient-to-bl from-[#22070c]/70 via-[#050508] to-[#050508] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(239,68,68,0.14),transparent_70%)]" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-rose-500/20 to-transparent animate-pulse" />

          {/* Villain Spiked Emblem */}
          <div className="hidden md:flex absolute bottom-16 right-12 opacity-40 flex-col items-end">
            <div className="w-20 h-20 rounded-2xl glass-panel border-red-500/40 flex items-center justify-center boss-glow">
              <Skull className="w-10 h-10 text-red-500" />
            </div>
            <span className="text-xs font-bold text-red-400 mt-2 font-['Orbitron'] tracking-[0.3em] uppercase italic">
              Villain // Dread Lord
            </span>
          </div>
        </div>

        {/* Center VS Clash Badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className="w-11 h-11 rounded-full glass-panel border-white/10 flex items-center justify-center shadow-2xl">
            <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-500 font-['Orbitron']">
              VS
            </span>
          </div>
        </div>
      </div>

      {/* Top Header / Status bar */}
      <div className="relative z-20 px-4 sm:px-10 pt-4 sm:pt-6 flex justify-between items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-cyan-400/90 tracking-wider">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          SYSTEM STABLE
        </div>
        {hasSaveGame && (
          <div className="text-[11px] sm:text-xs font-mono glass-panel border-cyan-400/30 text-cyan-300 px-3 py-1.5 rounded-xl shadow-sm ml-auto">
            LVL {playerLevel}
          </div>
        )}
      </div>

      {/* Center Cinematic Title & Branding */}
      <div className="relative z-20 text-center max-w-4xl mx-auto px-4 my-auto">
        <div className="inline-block px-3 sm:px-4 py-1 rounded-full glass-panel border-cyan-400/30 text-cyan-300 text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.4em] uppercase mb-4 shadow-sm max-w-full">
          3D Action-Adventure RPG
        </div>

        <h1 className="text-3xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 font-['Orbitron'] tracking-tight break-words px-1">
          LEGEND'S AWAKENING
        </h1>

        <h2 className="text-base sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-slate-200 to-red-500 font-['Orbitron'] tracking-[0.08em] sm:tracking-[0.3em] uppercase mt-2 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] break-words px-1">
          FINAL CHRONICLES
        </h2>

        <p className="text-xs sm:text-base text-slate-400 max-w-xl mx-auto mt-4 leading-relaxed font-sans px-2">
          Reclaim the ancient AURA energy. Master high-frequency energy sword combos, holographic shields, and devastating powers to confront The Dread Lord.
        </p>

        {/* Action Buttons Stack */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-xl mx-auto">
          {hasSaveGame ? (
            <button
              id="btn-menu-continue"
              onClick={onPlay}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase font-['Orbitron'] hero-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> CONTINUE MISSION
            </button>
          ) : (
            <button
              id="btn-menu-play"
              onClick={onPlay}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase font-['Orbitron'] hero-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> PLAY CHAPTER 1
            </button>
          )}

          <button
            id="btn-menu-chapters"
            onClick={onOpenChapters}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl glass-panel border-white/10 hover:border-cyan-400/40 text-slate-200 hover:text-cyan-300 font-bold text-xs sm:text-sm tracking-wider uppercase font-['Orbitron'] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            CHAPTER SELECT
          </button>

          <button
            id="btn-menu-newgame"
            onClick={onNewGame}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl glass-panel border-white/10 text-slate-400 hover:text-white hover:border-white/20 font-bold text-xs sm:text-sm tracking-wider uppercase font-['Orbitron'] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> NEW GAME
          </button>
        </div>

        {/* Secondary Utility Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 px-2">
          <button
            id="btn-menu-character"
            onClick={onOpenCharacter}
            className="px-3 sm:px-4 py-2 rounded-xl glass-panel border-white/10 hover:border-cyan-400/40 text-[11px] sm:text-xs font-bold text-slate-300 hover:text-cyan-300 font-['Orbitron'] tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 shrink-0" /> CHARACTER
          </button>

          <button
            id="btn-menu-abilities"
            onClick={onOpenAbilities}
            className="px-3 sm:px-4 py-2 rounded-xl glass-panel border-white/10 hover:border-cyan-400/40 text-[11px] sm:text-xs font-bold text-slate-300 hover:text-cyan-300 font-['Orbitron'] tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" /> ABILITIES
          </button>

          <button
            id="btn-menu-settings"
            onClick={onOpenSettings}
            className="px-3 sm:px-4 py-2 rounded-xl glass-panel border-white/10 hover:border-cyan-400/40 text-[11px] sm:text-xs font-bold text-slate-300 hover:text-cyan-300 font-['Orbitron'] tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" /> SETTINGS
          </button>
        </div>
      </div>

      {/* Footer Info (desktop only — kept off mobile to avoid clutter/overlap) */}
      <div className="hidden md:flex relative z-20 px-6 sm:px-10 pb-6 flex-row justify-between items-center gap-2 text-xs text-slate-500 font-mono">
        <div>3D WebGL Action Combat System // Three.js & Web Audio</div>
        <div className="text-cyan-400/60">Controls: WASD + Mouse | Full Mobile Touch Support</div>
      </div>
    </div>
  );
};
