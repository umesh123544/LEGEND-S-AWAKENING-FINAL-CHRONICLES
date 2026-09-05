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
import { supabase, CHARACTER_PHOTOS_BUCKET } from '../lib/supabaseClient';

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

export const PORTRAIT_SLOTS: { key: PortraitKey; label: string; hint: string; defaultPrompt: string; removeBackground: boolean }[] = [
  { key: 'hero', label: 'Hero (Aura Vanguard)', hint: 'The player character — used in the 3D battle world, HUD, menu and dialogue.', defaultPrompt: 'chibi style armored warrior hero, blue and gold energy armor, holding a glowing axe, full body, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'villain', label: 'Villain (The Dread Lord)', hint: 'The final boss — used in the 3D battle world, menu and dialogue.', defaultPrompt: 'dark armored villain, glowing red eyes, spiked black and crimson armor, full body, menacing, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'enemy_dark_soldier', label: 'Enemy: Dark Soldier', hint: 'Common enemy type in the 3D battle world.', defaultPrompt: 'dark soldier grunt enemy, black armor, full body, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'enemy_shadow_archer', label: 'Enemy: Shadow Archer', hint: 'Ranged enemy type in the 3D battle world.', defaultPrompt: 'shadow archer enemy, hooded, holding a bow, full body, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'enemy_aura_hunter', label: 'Enemy: Aura Hunter', hint: 'Enemy type in the 3D battle world.', defaultPrompt: 'aura hunter enemy, sleek cyber armor, full body, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'enemy_dark_guardian', label: 'Enemy: Dark Guardian', hint: 'Tanky enemy type in the 3D battle world.', defaultPrompt: 'heavy dark guardian enemy, huge shield, bulky armor, full body, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'enemy_demon_beast', label: 'Enemy: Demon Beast', hint: 'Monster enemy type in the 3D battle world.', defaultPrompt: 'demon beast monster enemy, clawed, menacing, full body, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'enemy_mini_boss', label: 'Enemy: Mini Boss', hint: 'Mini-boss enemy type in the 3D battle world.', defaultPrompt: 'powerful mini boss enemy, ornate dark armor, full body, game character concept art, solid bright green screen background, chroma key green', removeBackground: true },
  { key: 'aura', label: 'A.U.R.A. (AI Companion)', hint: 'Shown in dialogue when A.U.R.A. speaks.', defaultPrompt: 'friendly holographic AI orb companion, glowing cyan, game concept art', removeBackground: false },
  { key: 'npc', label: 'Side Character (NPC)', hint: 'Shown in dialogue for Commander Jax, etc.', defaultPrompt: 'game NPC character portrait, military commander, game concept art', removeBackground: false },
  { key: 'background', label: 'Battle Background / Location', hint: 'Backdrop shown behind the 3D battle world.', defaultPrompt: 'dark futuristic ruined city battle arena, dramatic lighting, wide background concept art', removeBackground: false },
];

const STORAGE_PREFIX = 'legend-awakening-portrait:';

export type SpriteAction = 'idle' | 'walk' | 'attack' | 'jump';
export type ActionFrames = Record<SpriteAction, string[]>;

const POSE_SUFFIX: Record<SpriteAction, [string, string]> = {
  idle: ['standing relaxed idle pose, arms at sides', 'standing idle pose, slight breathing shift'],
  walk: ['mid-walk pose, left foot forward', 'mid-walk pose, right foot forward'],
  attack: ['attacking pose, weapon raised back', 'attacking pose, weapon swinging forward, mid-strike'],
  jump: ['crouched pose, about to jump', 'airborne jumping pose, mid-air, legs tucked'],
};

interface PortraitEntry {
  url: string | null;
  prompt: string | null;
  frames?: ActionFrames | null;
}

const cache: Record<PortraitKey, PortraitEntry> = {} as Record<PortraitKey, PortraitEntry>;
for (const { key } of PORTRAIT_SLOTS) cache[key] = { url: null, prompt: null, frames: null };

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

/** Synchronous read of the 4-action (idle/walk/attack/jump) x 2-frame animation set, if generated. */
export function getFrames(key: PortraitKey): ActionFrames | null {
  return cache[key]?.frames ?? null;
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
    .select('slot, photo_url, prompt, frames')
    .then(({ data, error }) => {
      if (error) {
        console.warn('Sprite sync: failed to load from Supabase, using local cache only:', error.message);
        return;
      }
      let changed = false;
      for (const row of data || []) {
        const key = row.slot as PortraitKey;
        if (PORTRAIT_SLOTS.some((s) => s.key === key)) {
          writeLocal(key, { url: row.photo_url ?? null, prompt: row.prompt ?? null, frames: (row as any).frames ?? null });
          changed = true;
        }
      }
      if (changed) notify();
    });

  supabase
    .channel('portraits-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, (payload) => {
      const row = (payload.new || payload.old) as { slot?: string; photo_url?: string | null; prompt?: string | null; frames?: ActionFrames | null };
      const key = row.slot as PortraitKey;
      if (!key || !PORTRAIT_SLOTS.some((s) => s.key === key)) return;
      writeLocal(
        key,
        payload.eventType === 'DELETE'
          ? { url: null, prompt: null, frames: null }
          : { url: row.photo_url ?? null, prompt: row.prompt ?? null, frames: row.frames ?? null }
      );
      notify();
    })
    .subscribe();
}

/** Builds a Pollinations.ai (free, no API key) image URL for the given prompt. */
function buildGenerationUrl(prompt: string, width: number, height: number, seed: number): string {
  const encoded = encodeURIComponent(prompt.trim());
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
}

/**
 * Loads an image and keys out its green-screen background (the prompts ask the AI for a
 * "solid bright green screen background"), producing a transparent PNG so the character
 * renders as a clean cutout in the 3D world instead of a rectangular photo card. Free,
 * runs entirely client-side on a <canvas> — no paid background-removal API needed.
 * Falls back to the original (un-keyed) image if pixel access is blocked (e.g. CORS).
 */
async function removeGreenScreen(imageUrl: string): Promise<Blob | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image load failed'));
      el.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Bright, saturated green: G clearly dominant over both R and B.
      const isGreen = g > 90 && g - r > 35 && g - b > 35;
      if (isGreen) {
        data[i + 3] = 0;
      } else {
        // Soften green spill on edges (e.g. hair/armor rim lit by the green backdrop)
        // by desaturating green there instead of leaving a visible fringe.
        const edgeGreen = g > 70 && g - r > 15 && g - b > 15;
        if (edgeGreen) {
          const avg = (r + b) / 2;
          data[i + 1] = Math.round((g + avg) / 2);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  } catch (err) {
    console.warn('Background removal skipped (falling back to original image):', err);
    return null;
  }
}

/**
 * Generates one image via Pollinations, optionally keys out its green-screen background,
 * uploads the result to Supabase Storage, and returns the final public URL.
 */
async function generateOneFrame(
  prompt: string,
  width: number,
  height: number,
  seed: number,
  shouldRemoveBg: boolean,
  pathPrefix: string
): Promise<string> {
  const rawUrl = buildGenerationUrl(prompt, width, height, seed);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image generation failed — try again or simplify the description.'));
    img.src = rawUrl;
  });

  if (!shouldRemoveBg) return rawUrl;

  const cutoutBlob = await removeGreenScreen(rawUrl);
  if (!cutoutBlob) return rawUrl;

  const path = `${pathPrefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.png`;
  const { error: uploadError } = await supabase.storage
    .from(CHARACTER_PHOTOS_BUCKET)
    .upload(path, cutoutBlob, { contentType: 'image/png', upsert: true, cacheControl: '3600' });
  if (uploadError) return rawUrl;

  const { data } = supabase.storage.from(CHARACTER_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Generates a new image for the given slot from a text prompt via Pollinations.ai, keys
 * out the green-screen background (for character/enemy slots), uploads the result to
 * Supabase Storage, and saves the URL + prompt to Supabase so it syncs to every player.
 */
export async function generatePortrait(
  key: PortraitKey,
  prompt: string,
  opts?: { width?: number; height?: number }
): Promise<string> {
  const width = opts?.width ?? 512;
  const height = opts?.height ?? 768;
  const shouldRemoveBg = PORTRAIT_SLOTS.find((s) => s.key === key)?.removeBackground ?? false;
  const seed = Math.floor(Math.random() * 1_000_000);

  const finalUrl = await generateOneFrame(prompt, width, height, seed, shouldRemoveBg, key);

  const label = PORTRAIT_SLOTS.find((s) => s.key === key)?.label ?? key;
  const { error } = await supabase.from('characters').upsert({
    slot: key,
    name: label,
    photo_url: finalUrl,
    prompt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  writeLocal(key, { url: finalUrl, prompt, frames: cache[key]?.frames ?? null });
  notify();
  return finalUrl;
}

/**
 * Generates a full 2-frame-per-action animation set (idle/walk/attack/jump = 8 images
 * total) for a character slot, using ONE fixed seed across all of them so the character's
 * identity/style stays as consistent as Pollinations' free model allows, with only the
 * pose description changing per frame. Reports progress via onProgress(done, total).
 */
export async function generateCharacterFrames(
  key: PortraitKey,
  basePrompt: string,
  onProgress?: (done: number, total: number) => void
): Promise<ActionFrames> {
  const shouldRemoveBg = PORTRAIT_SLOTS.find((s) => s.key === key)?.removeBackground ?? true;
  const seed = Math.floor(Math.random() * 1_000_000);
  const actions: SpriteAction[] = ['idle', 'walk', 'attack', 'jump'];
  const total = actions.length * 2;
  let done = 0;

  const frames = {} as ActionFrames;
  for (const action of actions) {
    const [poseA, poseB] = POSE_SUFFIX[action];
    const urlA = await generateOneFrame(`${basePrompt}, ${poseA}`, 512, 768, seed, shouldRemoveBg, `${key}-${action}-a`);
    done++;
    onProgress?.(done, total);
    const urlB = await generateOneFrame(`${basePrompt}, ${poseB}`, 512, 768, seed, shouldRemoveBg, `${key}-${action}-b`);
    done++;
    onProgress?.(done, total);
    frames[action] = [urlA, urlB];
  }

  const label = PORTRAIT_SLOTS.find((s) => s.key === key)?.label ?? key;
  const { error } = await supabase.from('characters').upsert({
    slot: key,
    name: label,
    photo_url: frames.idle[0],
    prompt: basePrompt,
    frames,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  writeLocal(key, { url: frames.idle[0], prompt: basePrompt, frames });
  notify();
  return frames;
}

export async function resetPortrait(key: PortraitKey): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert({ slot: key, photo_url: null, prompt: null, frames: null, updated_at: new Date().toISOString() });
  if (error) throw error;
  writeLocal(key, { url: null, prompt: null, frames: null });
  notify();
}
