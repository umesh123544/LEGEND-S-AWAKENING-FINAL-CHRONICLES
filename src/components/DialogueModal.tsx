import React, { useState, useEffect } from 'react';
import { DialogueMessage } from '../types';
import { soundManager } from '../game/audio';
import { getPortrait, usePortraitsVersion } from '../game/portraits';
import { Sparkles, Skull, Bot, User } from 'lucide-react';

interface DialogueModalProps {
  dialogues: DialogueMessage[];
  onComplete: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({ dialogues, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  usePortraitsVersion();

  const currentDialogue = dialogues[currentIndex];

  useEffect(() => {
    if (!currentDialogue) return;
    setIsTyping(true);
    setDisplayedText('');

    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx++;
      setDisplayedText(currentDialogue.text.slice(0, charIdx));
      if (charIdx % 3 === 0) {
        soundManager.playDialogueBeep(currentDialogue.voicePitch || 440);
      }

      if (charIdx >= currentDialogue.text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [currentIndex, currentDialogue]);

  const handleNext = () => {
    if (isTyping) {
      // Fast forward text
      setDisplayedText(currentDialogue.text);
      setIsTyping(false);
      return;
    }

    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  if (!currentDialogue) return null;

  const isVillain = currentDialogue.portrait === 'villain';
  const isAura = currentDialogue.portrait === 'aura';
  const uploadedPortrait = getPortrait(currentDialogue.portrait);

  return (
    <div
      id="dialogue-modal-overlay"
      onClick={handleNext}
      className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-between p-6 select-none font-['Rajdhani']"
    >
      {/* Top Cinematic Bar */}
      <div className="h-12 bg-black w-full flex items-center justify-between px-4">
        <span className="text-xs tracking-widest text-cyan-400/80 font-['Orbitron']">
          AURA NEURAL COMM LINK // ACTIVE
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="text-xs text-slate-400 hover:text-white uppercase font-bold tracking-wider px-3 py-1 bg-slate-900 border border-slate-700 rounded"
        >
          SKIP [ESC]
        </button>
      </div>

      {/* Center/Bottom Dialogue Box */}
      <div className={`max-w-3xl w-full mx-auto glass-panel border rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row gap-5 items-center pointer-events-auto transition-colors duration-300 ${
        isVillain ? 'border-red-500/40 boss-glow' : 'border-cyan-400/40 hero-glow'
      }`}>
        {/* Character Portrait */}
        <div
          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border flex items-center justify-center p-2 shrink-0 overflow-hidden ${
            isVillain
              ? 'glass-panel-crimson border-red-500/50 boss-glow'
              : isAura
              ? 'glass-panel-cyan border-cyan-400/50 hero-glow'
              : 'glass-panel-cyan border-cyan-400/50 hero-glow'
          }`}
        >
          {uploadedPortrait ? (
            <img src={uploadedPortrait} alt={currentDialogue.speaker} className="w-full h-full object-cover rounded-xl" />
          ) : isVillain ? (
            <div className="flex flex-col items-center justify-center text-red-500">
              <Skull className="w-10 h-10 animate-pulse drop-shadow-[0_0_8px_#ef4444]" />
              <span className="text-[10px] font-black tracking-[0.2em] mt-1.5 text-red-400 font-['Orbitron']">
                DREAD LORD
              </span>
            </div>
          ) : isAura ? (
            <div className="flex flex-col items-center justify-center text-cyan-300">
              <Bot className="w-10 h-10 animate-pulse drop-shadow-[0_0_8px_#22d3ee]" />
              <span className="text-[10px] font-black tracking-[0.2em] mt-1.5 text-cyan-300 font-['Orbitron']">
                A.U.R.A. AI
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-cyan-200">
              <Sparkles className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_8px_#22d3ee]" />
              <span className="text-[10px] font-black tracking-[0.2em] mt-1.5 text-cyan-200 font-['Orbitron']">
                OPERATIVE
              </span>
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className="flex-1 w-full text-left">
          <div className="flex justify-between items-center mb-1">
            <h3
              className={`text-lg sm:text-xl font-bold tracking-wider font-['Orbitron'] ${
                isVillain ? 'text-red-400' : isAura ? 'text-cyan-300' : 'text-slate-100'
              }`}
            >
              {currentDialogue.speaker}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              [{currentIndex + 1} / {dialogues.length}]
            </span>
          </div>

          <p className="text-base sm:text-lg text-slate-200 min-h-[4rem] leading-relaxed">
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-ping" />}
          </p>

          <div className="mt-3 flex justify-end">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1 font-['Orbitron']">
              Tap anywhere to advance &gt;&gt;
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Cinematic Bar */}
      <div className="h-12 bg-black w-full" />
    </div>
  );
};
