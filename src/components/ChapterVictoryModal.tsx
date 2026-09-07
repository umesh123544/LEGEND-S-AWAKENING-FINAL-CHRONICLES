import React from 'react';
import { Trophy, ArrowRight, Home, RefreshCw } from 'lucide-react';
import { CHAPTERS } from '../game/gameState';

interface ChapterVictoryModalProps {
  chapterId: number;
  onNextChapter: () => void;
  onMainMenu: () => void;
}

export const ChapterVictoryModal: React.FC<ChapterVictoryModalProps> = ({
  chapterId,
  onNextChapter,
  onMainMenu,
}) => {
  const currentChapter = CHAPTERS.find((c) => c.id === chapterId);
  const nextChapter = CHAPTERS.find((c) => c.id === chapterId + 1);

  return (
    <div
      id="chapter-victory-modal-overlay"
      className="absolute inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani'] animate-in zoom-in-95 duration-300"
    >
      <div className="max-w-lg w-full glass-panel border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl glass-panel border-emerald-400/40 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Trophy className="w-10 h-10 text-emerald-300" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-400 font-['Orbitron'] tracking-wider">
          SECTOR PURIFIED!
        </h2>
        <p className="text-xs font-bold text-emerald-300 uppercase tracking-[0.3em] mt-1">
          {currentChapter?.title || `CHAPTER ${chapterId}`} COMPLETED
        </p>

        <div className="my-6 p-4 rounded-2xl glass-panel border-white/10 text-left text-sm text-slate-300">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-['Orbitron']">
            MISSION SUMMARY
          </div>
          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
            {chapterId === 6
              ? 'Ravan has fallen, and Sita is free at last! Dharma is restored to the world. Your journey through the Ramayan is complete!'
              : 'The Rakshasa forces here are defeated. The path toward Lanka lies open before you.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="btn-victory-menu"
            onClick={onMainMenu}
            className="flex-1 py-3.5 rounded-2xl glass-panel border-white/10 text-slate-300 hover:text-white hover:border-white/25 font-bold text-xs uppercase font-['Orbitron'] tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>

          {nextChapter && (
            <button
              id="btn-victory-next"
              onClick={onNextChapter}
              className="flex-1 py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs uppercase font-['Orbitron'] tracking-wider hero-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              NEXT CHAPTER <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
