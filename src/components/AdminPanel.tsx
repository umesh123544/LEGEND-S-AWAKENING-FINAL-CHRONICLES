import React, { useState } from 'react';
import { Lock, Sparkles, X, RotateCcw, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  PORTRAIT_SLOTS,
  PortraitKey,
  getPortrait,
  getPortraitPrompt,
  generatePortrait,
  resetPortrait,
} from '../game/portraits';

// NOTE: this is a simple client-side gate for a solo-dev admin screen, not real security —
// anyone who reads the deployed JS bundle can find this password. It exists only to stop
// random players from stumbling into the panel, not to protect against a determined user.
const ADMIN_PASSWORD = 'legend2026';
const AUTH_SESSION_KEY = 'legend-awakening-admin-authed';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [authed, setAuthed] = useState<boolean>(() => sessionStorage.getItem(AUTH_SESSION_KEY) === '1');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_SESSION_KEY, '1');
      setAuthed(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password.');
    }
  };

  if (!authed) {
    return (
      <div className="absolute inset-0 z-50 bg-[#050508] flex items-center justify-center p-4 font-['Rajdhani']">
        <form
          onSubmit={handleLogin}
          className="max-w-sm w-full glass-panel border border-cyan-400/40 rounded-3xl p-6 shadow-2xl hero-glow"
        >
          <div className="flex items-center gap-2 mb-4 text-cyan-300">
            <Lock className="w-5 h-5" />
            <h2 className="text-lg font-black font-['Orbitron'] tracking-wide">ADMIN ACCESS</h2>
          </div>
          <input
            type="password"
            autoFocus
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white outline-none focus:border-cyan-400/50 font-mono text-sm"
          />
          {authError && <p className="text-red-400 text-xs mt-2">{authError}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl glass-panel border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#050508] overflow-y-auto font-['Rajdhani'] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl glass-panel border-white/10 flex items-center justify-center text-slate-300 hover:text-cyan-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl sm:text-2xl font-black font-['Orbitron'] tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" /> Character Admin
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-cyan-300/90 glass-panel border-cyan-400/30 rounded-xl px-4 py-3 mb-6 leading-relaxed">
          Describe a character or scene in a few words and tap <span className="font-bold">Generate</span> — a free
          AI image service creates it and it syncs live to <span className="font-bold">every player, on every
          device</span> (via Supabase). No photo upload, no cost. Hero/Villain/Enemies render as 2D sprites in the
          3D battle world; the Background replaces the arena backdrop.
        </p>

        <div className="flex flex-col gap-4">
          {PORTRAIT_SLOTS.map((slot) => (
            <PortraitSlotEditor
              key={slot.key}
              slotKey={slot.key}
              label={slot.label}
              hint={slot.hint}
              defaultPrompt={slot.defaultPrompt}
              wide={slot.key === 'background'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const PortraitSlotEditor: React.FC<{
  slotKey: PortraitKey;
  label: string;
  hint: string;
  defaultPrompt: string;
  wide: boolean;
}> = ({ slotKey, label, hint, defaultPrompt, wide }) => {
  const [preview, setPreview] = useState<string | null>(() => getPortrait(slotKey));
  const [prompt, setPrompt] = useState<string>(() => getPortraitPrompt(slotKey) || defaultPrompt);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Type a short description first.');
      return;
    }
    setError('');
    setIsGenerating(true);
    try {
      const url = await generatePortrait(slotKey, prompt, wide ? { width: 1024, height: 576 } : undefined);
      setPreview(url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Generation failed — try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = async () => {
    setError('');
    try {
      await resetPortrait(slotKey);
      setPreview(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not remove that image.');
    }
  };

  return (
    <div className="glass-panel border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
      <div
        className={`rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center ${
          wide ? 'w-full sm:w-32 h-20' : 'w-20 h-20'
        }`}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <Sparkles className="w-6 h-6 text-slate-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-slate-100">{label}</div>
        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hint}</div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="Describe this character or scene..."
          className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:border-cyan-400/50 text-xs font-mono resize-none"
        />

        {error && <div className="text-[11px] text-red-400 mt-1">{error}</div>}

        <div className="flex gap-2 mt-2.5">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-wider hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" /> {isGenerating ? 'Generating…' : preview ? 'Regenerate' : 'Generate'}
          </button>
          {preview && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg glass-panel border-white/10 text-slate-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {preview && (
        <button
          onClick={handleReset}
          className="w-7 h-7 rounded-lg glass-panel border-white/10 flex items-center justify-center text-slate-500 hover:text-red-400 shrink-0 self-start"
          title="Remove image"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
