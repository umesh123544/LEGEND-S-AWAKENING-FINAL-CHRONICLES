import React, { useState } from 'react';
import { Lock, Sparkles, X, ArrowLeft, ShieldCheck, Upload, ExternalLink, CheckCircle2 } from 'lucide-react';
import {
  PORTRAIT_SLOTS,
  PortraitKey,
  SpriteAction,
  getPortrait,
  getPortraitPrompt,
  getFrames,
  generatePortrait,
  uploadActionFrame,
  resetPortrait,
} from '../game/portraits';

// NOTE: this is a simple client-side gate for a solo-dev admin screen, not real security —
// anyone who reads the deployed JS bundle can find this password. It exists only to stop
// random players from stumbling into the panel, not to protect against a determined user.
const ADMIN_PASSWORD = 'legend2026';
const AUTH_SESSION_KEY = 'legend-awakening-admin-authed';

const ACTIONS: { key: SpriteAction; label: string }[] = [
  { key: 'idle', label: 'Idle' },
  { key: 'walk', label: 'Walk' },
  { key: 'attack', label: 'Attack' },
  { key: 'jump', label: 'Jump' },
];

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

        <a
          href="https://pixler.dev/get-started"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 text-xs sm:text-sm text-cyan-300/90 glass-panel border-cyan-400/30 rounded-xl px-4 py-3 mb-6 leading-relaxed hover:border-cyan-400/60 transition-colors"
        >
          <span>
            For Hero/Villain/Enemies: open <span className="font-bold">pixler.dev</span> (free, no signup),
            generate an <span className="font-bold">idle / walk / attack / jump</span> sprite for the character, then
            upload each image below. Transparent background comes built-in.
          </span>
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>

        <div className="flex flex-col gap-4">
          {PORTRAIT_SLOTS.map((slot) => (
            <PortraitSlotEditor
              key={slot.key}
              slotKey={slot.key}
              label={slot.label}
              hint={slot.hint}
              defaultPrompt={slot.defaultPrompt}
              wide={slot.key === 'background'}
              animated={slot.removeBackground}
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
  animated: boolean;
}> = ({ slotKey, label, hint, defaultPrompt, wide, animated }) => {
  const [preview, setPreview] = useState<string | null>(() => getPortrait(slotKey));
  const [prompt, setPrompt] = useState<string>(() => getPortraitPrompt(slotKey) || defaultPrompt);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingAction, setUploadingAction] = useState<SpriteAction | null>(null);
  const [frames, setFrames] = useState(() => getFrames(slotKey));

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

  const handleActionUpload = async (action: SpriteAction, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setError('');
    setUploadingAction(action);
    try {
      await uploadActionFrame(slotKey, action, file);
      setFrames(getFrames(slotKey));
      setPreview(getPortrait(slotKey));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed — try again.');
    } finally {
      setUploadingAction(null);
    }
  };

  const handleReset = async () => {
    setError('');
    try {
      await resetPortrait(slotKey);
      setPreview(null);
      setFrames(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not remove that image.');
    }
  };

  return (
    <div className="glass-panel border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex gap-4">
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
          {error && <div className="text-[11px] text-red-400 mt-1">{error}</div>}
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

      {animated ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ACTIONS.map(({ key: action, label: actionLabel }) => {
            const hasFrame = !!frames?.[action]?.length;
            const busy = uploadingAction === action;
            return (
              <label
                key={action}
                className={`cursor-pointer rounded-lg border px-2 py-2 flex flex-col items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                  hasFrame
                    ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-300'
                    : 'border-white/10 bg-slate-900 text-slate-400 hover:border-cyan-400/30'
                }`}
              >
                {hasFrame ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                {busy ? 'Uploading…' : actionLabel}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleActionUpload(action, file);
                    e.target.value = '';
                  }}
                />
              </label>
            );
          })}
        </div>
      ) : (
        <>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="Describe this scene..."
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white outline-none focus:border-cyan-400/50 text-xs font-mono resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="self-start px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-[11px] font-black uppercase tracking-wider hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" /> {isGenerating ? 'Generating…' : preview ? 'Regenerate' : 'Generate'}
          </button>
        </>
      )}
    </div>
  );
};
