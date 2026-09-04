import React from 'react';
import { ChapterInfo } from '../types';
import { CHAPTERS } from '../game/gameState';
import { X, Play, Lock, MapPin, CheckCircle } from 'lucide-react';

interface ChapterSelectModalProps {
  unlockedChapters: number[];
  onSelectChapter: (id: number) => void;
  onClose: () => void;
}

export const ChapterSelectModal: React.FC<ChapterSelectModalProps> = ({
  unlockedChapters,
  onSelectChapter,
  onClose,
}) => {
  return (
    <div
      id="chapter-select-modal-overlay"
      className="absolute inset-0 z-50 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 font-['Rajdhani']"
    >
      <div className="max-w-3xl w-full glass-panel border border-cyan-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col hero-glow">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl glass-panel border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Orbitron'] tracking-wide">
            MISSION CHRONICLES
          </h2>
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.3em]">
            SELECT CAMPAIGN SECTOR OR BOSS ENCOUNTER
          </p>
        </div>

        <div className="overflow-y-auto space-y-3 pr-2 flex-1">
          {CHAPTERS.map((chap) => {
            const isUnlocked = unlockedChapters.includes(chap.id) || chap.id === 1 || chap.id === 6;

            return (
              <div
                key={chap.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isUnlocked
                    ? chap.id === 6
                      ? 'glass-panel-crimson border-red-500/40 hover:border-red-500 boss-glow'
                      : 'glass-panel border-white/10 hover:border-cyan-400/50 hero-glow'
                    : 'glass-panel border-white/5 opacity-40'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black font-['Orbitron'] px-2 py-0.5 rounded-full ${
                        chap.id === 6 ? 'bg-red-600 text-white' : 'bg-cyan-400 text-slate-950'
                      }`}
                    >
                      {chap.id === 6 ? 'FINAL BOSS' : `ACT ${chap.id}`}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white font-['Orbitron']">
                      {chap.title}
                    </h3>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1 mb-2 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {chap.location}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    {chap.description}
                  </p>
                </div>

                <div>
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        onSelectChapter(chap.id);
                        onClose();
                      }}
                      className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase font-['Orbitron'] tracking-wider flex items-center gap-2 transition-transform active:scale-95 ${
                        chap.id === 6
                          ? 'bg-red-600 text-white boss-glow hover:brightness-110'
                          : 'bg-cyan-400 text-slate-950 hero-glow hover:brightness-110'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> DEPLOY
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono px-3 py-2 border border-white/5 rounded-xl">
                      <Lock className="w-3.5 h-3.5" /> LOCKED
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
