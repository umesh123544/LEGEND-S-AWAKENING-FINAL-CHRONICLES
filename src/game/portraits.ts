/**
 * AI-generated 2D character sprites — synced via Supabase.
 *
 * The admin (?admin=1) types a short text description for Hero / Villain / each Enemy
 * type / the Battle Background, and this module calls Pollinations.ai — a free,
 * no-signup, no-API-key image generation service — to create a 2D image, then stores
 * the resulting image URL + prompt in a shared Supabase "characters" table.
 *
 * Every player's game reads from that same table (with a Realtime subscription), so a
 * new generated image shows up for everyone, on every device, without a rebuild/redeploy.
 * A local in-memory + localStorage cache keeps things instant and offline-tolerant.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export type PortraitKey =
  | 'hero'
  | 'aura'
  | 'villain'
  | 'npc'
  | 'enemy_dark_soldier'
  | 'enemy_shadow_archer'
  | 'enemy_aura_hunter'
  | 'enemy_dark_guardian'
  | 'enemy_demon_beast'
  | 'enemy_mini_boss'
  | 'background';

export const PORTRAIT_SLOTS: { key: PortraitKey; label: string; hint: string; defaultPrompt: string }[] = [
  { key: 'hero', label: 'Hero (Aura Vanguard)', hint: 'The player character — used in the 3D battle world, HUD, menu and dialogue.', defaultPrompt: 'chibi style armored warrior hero, blue and gold energy armor, holding a glowing axe, full body, game character concept art, plain background' },
  { key: 'villain', label: 'Villain (The Dread Lord)', hint: 'The final boss — used in the 3D battle world, menu and dialogue.', defaultPrompt: 'dark armored villain, glowing red eyes, spiked black and crimson armor, full body, menacing, game character concept art, plain background' },
  { key: 'enemy_dark_soldier', label: 'Enemy: Dark Soldier', hint: 'Common enemy type in the 3D battle world.', defaultPrompt: 'dark soldier grunt enemy, black armor, full body, game character concept art, plain background' },
  { key: 'enemy_shadow_archer', label: 'Enemy: Shadow Archer', hint: 'Ranged enemy type in the 3D battle world.', defaultPrompt: 'shadow archer enemy, hooded, holding a bow, full body, game character concept art, plain background' },
  { key: 'enemy_aura_hunter', label: 'Enemy: Aura Hunter', hint: 'Enemy type in the 3D battle world.', defaultPrompt: 'aura hunter enemy, sleek cyber armor, full body, game character concept art, plain background' },
  { key: 'enemy_dark_guardian', label: 'Enemy: Dark Guardian', hint: 'Tanky enemy type in the 3D battle world.', defaultPrompt: 'heavy dark guardian enemy, huge shield, bulky armor, full body, game character concept art, plain background' },
  { key: 'enemy_demon_beast', label: 'Enemy: Demon Beast', hint: 'Monster enemy type in the 3D battle world.', defaultPrompt: 'demon beast monster enemy, clawed, menacing, full body, game character concept art, plain background' },
  { key: 'enemy_mini_boss', label: 'Enemy: Mini Boss', hint: 'Mini-boss enemy type in the 3D battle world.', defaultPrompt: 'powerful mini boss enemy, ornate dark armor, full body, game character concept art, plain background' },
  { key: 'aura', label: 'A.U.R.A. (AI Companion)', hint: 'Shown in dialogue when A.U.R.A. speaks.', defaultPrompt: 'friendly holographic AI orb companion, glowing cyan, game concept art' },
  { key: 'npc', label: 'Side Character (NPC)', hint: 'Shown in dialogue for Commander Jax, etc.', defaultPrompt: 'game NPC character portrait, military commander, game concept art' },
  { key: 'background', label: 'Battle Background / Location', hint: 'Backdrop shown behind the 3D battle world.', defaultPrompt: 'dark futuristic ruined city battle arena, dramatic lighting, wide background concept art' },
];

const STORAGE_PREFIX = 'legend-awakening-portrait:';

interface PortraitEntry {
  url: string | null;
  prompt: string | null;
}

const cache: Record<PortraitKey, PortraitEntry> = {} as Record<PortraitKey, PortraitEntry>;
for (const { key } of PORTRAIT_SLOTS) cache[key] = { url: null, prompt: null };

// Seed from localStorage immediately so there's no flash of "no image" on load.
for (const { key } of PORTRAIT_SLOTS) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) cache[key] = JSON.parse(raw);
  } catch {
    // ignore
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((cb) => cb());
}

function writeLocal(key: PortraitKey, entry: PortraitEntry) {
  cache[key] = entry;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // ignore quota errors
  }
}

/** Synchronous read of the generated image URL — safe to call directly during render. */
export function getPortrait(key: PortraitKey): string | null {
  return cache[key]?.url ?? null;
}

/** Synchronous read of the prompt last used to generate this slot's image. */
export function getPortraitPrompt(key: PortraitKey): string {
  return cache[key]?.prompt ?? PORTRAIT_SLOTS.find((s) => s.key === key)?.defaultPrompt ?? '';
}

/** React hook: re-renders the calling component whenever any portrait/sprite changes. */
export function usePortraitsVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const cb = () => setVersion((v) => v + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  return version;
}

let initialized = false;

/** Fetch current sprites from Supabase and subscribe to live updates. Call once at app start. */
export function initPortraitSync(): void {
  if (initialized) return;
  initialized = true;

  supabase
    .from('characters')
    .select('slot, photo_url, prompt')
    .then(({ data, error }) => {
      if (error) {
        console.warn('Sprite sync: failed to load from Supabase, using local cache only:', error.message);
        return;
      }
      let changed = false;
      for (const row of data || []) {
        const key = row.slot as PortraitKey;
        if (PORTRAIT_SLOTS.some((s) => s.key === key)) {
          writeLocal(key, { url: row.photo_url ?? null, prompt: row.prompt ?? null });
          changed = true;
        }
      }
      if (changed) notify();
    });

  supabase
    .channel('portraits-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, (payload) => {
      const row = (payload.new || payload.old) as { slot?: string; photo_url?: string | null; prompt?: string | null };
      const key = row.slot as PortraitKey;
      if (!key || !PORTRAIT_SLOTS.some((s) => s.key === key)) return;
      writeLocal(
        key,
        payload.eventType === 'DELETE' ? { url: null, prompt: null } : { url: row.photo_url ?? null, prompt: row.prompt ?? null }
      );
      notify();
    })
    .subscribe();
}

/** Builds a Pollinations.ai (free, no API key) image URL for the given prompt. */
function buildGenerationUrl(prompt: string, width: number, height: number): string {
  const seed = Math.floor(Math.random() * 1_000_000);
  const encoded = encodeURIComponent(prompt.trim());
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

/**
 * Generates a new image for the given slot from a text prompt via Pollinations.ai,
 * waits for it to actually finish rendering, then saves the URL + prompt to Supabase
 * so it syncs to every player.
 */
export async function generatePortrait(
  key: PortraitKey,
  prompt: string,
  opts?: { width?: number; height?: number }
): Promise<string> {
  const width = opts?.width ?? 512;
  const height = opts?.height ?? 768;
  const url = buildGenerationUrl(prompt, width, height);

  // Pollinations generates the image on-the-fly at that URL — make sure it actually
  // loads before we save/broadcast it, so players don't briefly see a broken image.
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image generation failed — try again or simplify the description.'));
    img.src = url;
  });

  const label = PORTRAIT_SLOTS.find((s) => s.key === key)?.label ?? key;
  const { error } = await supabase.from('characters').upsert({
    slot: key,
    name: label,
    photo_url: url,
    prompt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  writeLocal(key, { url, prompt });
  notify();
  return url;
}

export async function resetPortrait(key: PortraitKey): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert({ slot: key, photo_url: null, prompt: null, updated_at: new Date().toISOString() });
  if (error) throw error;
  writeLocal(key, { url: null, prompt: null });
  notify();
}
