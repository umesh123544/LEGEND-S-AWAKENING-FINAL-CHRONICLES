import React, { useState, useRef } from 'react';
import { Lock, Upload, X, RotateCcw, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  PORTRAIT_SLOTS,
  PortraitKey,
  getPortrait,
  setPortrait,
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
          Photos you upload here sync live to <span className="font-bold">every player, on every device</span> —
          they're stored in Supabase, not just this browser. They replace the 2D portrait icon shown in dialogue,
          the HUD, the main menu, and the character sheet — the in-game 3D model is separate and isn't changed
          here.
        </p>

        <div className="flex flex-col gap-4">
          {PORTRAIT_SLOTS.map((slot) => (
            <PortraitSlotEditor key={slot.key} slotKey={slot.key} label={slot.label} hint={slot.hint} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PortraitSlotEditor: React.FC<{ slotKey: PortraitKey; label: string; hint: string }> = ({
  slotKey,
  label,
  hint,
}) => {
  const [preview, setPreview] = useState<string | null>(() => getPortrait(slotKey));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await setPortrait(slotKey, file);
      setPreview(getPortrait(slotKey));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not upload that image.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setError('');
    try {
      await resetPortrait(slotKey);
      setPreview(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not remove that photo.');
    }
  };

  return (
    <div className="glass-panel border-white/10 rounded-2xl p-4 flex items-center gap-4">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <Upload className="w-6 h-6 text-slate-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-slate-100">{label}</div>
        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hint}</div>
        {error && <div className="text-[11px] text-red-400 mt-1">{error}</div>}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : preview ? 'Replace Photo' : 'Upload Photo'}
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
          className="w-7 h-7 rounded-lg glass-panel border-white/10 flex items-center justify-center text-slate-500 hover:text-red-400 shrink-0"
          title="Remove photo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
