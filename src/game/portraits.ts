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

export const PORTRAIT_SLOTS: { key: PortraitKey; label: string; hint: string; defaultPrompt: string; removeBackground: boolean; inputMode: 'actions' | 'upload' | 'prompt' }[] = [
  { key: 'hero', label: 'Hero (Aura Vanguard)', hint: 'The player character — used in the 3D battle world, HUD, menu and dialogue.', defaultPrompt: 'chibi style armored warrior hero, blue and gold energy armor, holding a glowing axe, full body, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'villain', label: 'Villain (The Dread Lord)', hint: 'The final boss — used in the 3D battle world, menu and dialogue.', defaultPrompt: 'dark armored villain, glowing red eyes, spiked black and crimson armor, full body, menacing, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'enemy_dark_soldier', label: 'Enemy: Dark Soldier', hint: 'Common enemy type in the 3D battle world.', defaultPrompt: 'dark soldier grunt enemy, black armor, full body, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'enemy_shadow_archer', label: 'Enemy: Shadow Archer', hint: 'Ranged enemy type in the 3D battle world.', defaultPrompt: 'shadow archer enemy, hooded, holding a bow, full body, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'enemy_aura_hunter', label: 'Enemy: Aura Hunter', hint: 'Enemy type in the 3D battle world.', defaultPrompt: 'aura hunter enemy, sleek cyber armor, full body, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'enemy_dark_guardian', label: 'Enemy: Dark Guardian', hint: 'Tanky enemy type in the 3D battle world.', defaultPrompt: 'heavy dark guardian enemy, huge shield, bulky armor, full body, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'enemy_demon_beast', label: 'Enemy: Demon Beast', hint: 'Monster enemy type in the 3D battle world.', defaultPrompt: 'demon beast monster enemy, clawed, menacing, full body, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'enemy_mini_boss', label: 'Enemy: Mini Boss', hint: 'Mini-boss enemy type in the 3D battle world.', defaultPrompt: 'powerful mini boss enemy, ornate dark armor, full body, game character concept art, solid plain white studio background, no scenery, no props behind character', removeBackground: true, inputMode: 'actions' },
  { key: 'aura', label: 'A.U.R.A. (AI Companion)', hint: 'Shown in dialogue when A.U.R.A. speaks.', defaultPrompt: 'friendly holographic AI orb companion, glowing cyan, game concept art', removeBackground: false, inputMode: 'prompt' },
  { key: 'npc', label: 'Side Character (NPC)', hint: 'Shown in dialogue for Commander Jax, etc.', defaultPrompt: 'game NPC character portrait, military commander, game concept art', removeBackground: false, inputMode: 'prompt' },
  { key: 'background', label: 'Battle Background / Location', hint: 'Backdrop shown behind the 3D battle world. Upload a scene from pixler.dev\'s Background generator.', defaultPrompt: 'dark futuristic ruined city battle arena, dramatic lighting, wide background concept art', removeBackground: false, inputMode: 'upload' },
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
 * Loads an image and removes its background via a flood-fill from the image edges: it
 * samples the border color, then grows outward-in from every edge pixel, clearing alpha
 * on anything connected to the border that's close to that color. This works regardless
 * of what background color the AI actually used (green, grey, white, gradient studio
 * backdrop, etc.) and — unlike a flat global color threshold — leaves same-colored regions
 * *inside* the character (e.g. white armor) untouched, since they aren't edge-connected.
 * Free, runs entirely client-side on a <canvas> — no paid background-removal API needed.
 * Falls back to the original (un-keyed) image if pixel access is blocked (e.g. CORS).
 */
async function removeUniformBackground(imageUrl: string): Promise<Blob | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image load failed'));
      el.src = imageUrl;
    });

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const idx = (x: number, y: number) => (y * width + x) * 4;

    // Reference background color = average of a sample of border pixels.
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    const sample = (x: number, y: number) => {
      const i = idx(x, y);
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      count++;
    };
    for (let x = 0; x < width; x += 3) {
      sample(x, 0);
      sample(x, height - 1);
    }
    for (let y = 0; y < height; y += 3) {
      sample(0, y);
      sample(width - 1, y);
    }
    const refR = rSum / count;
    const refG = gSum / count;
    const refB = bSum / count;

    const THRESHOLD = 42;
    const FEATHER = 26;
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let qHead = 0;
    let qTail = 0;

    const visit = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const p = y * width + x;
      if (visited[p]) return;
      visited[p] = 1;
      const i = p * 4;
      const dist = Math.sqrt(
        (data[i] - refR) ** 2 + (data[i + 1] - refG) ** 2 + (data[i + 2] - refB) ** 2
      );
      if (dist < THRESHOLD) {
        data[i + 3] = 0;
        queue[qTail++] = p;
      } else if (dist < THRESHOLD + FEATHER) {
        // Soften the edge instead of a hard cutout line.
        data[i + 3] = Math.round((255 * (dist - THRESHOLD)) / FEATHER);
      }
    };

    for (let x = 0; x < width; x++) {
      visit(x, 0);
      visit(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      visit(0, y);
      visit(width - 1, y);
    }
    while (qHead < qTail) {
      const p = queue[qHead++];
      const x = p % width;
      const y = (p / width) | 0;
      visit(x + 1, y);
      visit(x - 1, y);
      visit(x, y + 1);
      visit(x, y - 1);
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
 * uploads the result to Supabase Storage, and returns the final public URL. Has a hard
 * timeout so a slow/stuck Pollinations response can't hang the whole admin flow forever.
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
    const timeout = setTimeout(() => {
      reject(new Error('Image generation timed out after 20s — Pollinations may be slow or unreachable from your network right now.'));
    }, 20000);
    img.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Image generation failed — try again or simplify the description.'));
    };
    img.src = rawUrl;
  });

  if (!shouldRemoveBg) return rawUrl;

  const cutoutBlob = await removeUniformBackground(rawUrl);
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
 * pose description changing per frame. All 8 generate in parallel (much faster than one
 * at a time) and report progress via onProgress(done, total) as each finishes. If some
 * frames fail (e.g. a timeout), the ones that succeeded are still saved.
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
  const bump = () => onProgress?.(++done, total);

  const jobs = actions.map((action) => {
    const [poseA, poseB] = POSE_SUFFIX[action];
    return Promise.all([
      generateOneFrame(`${basePrompt}, ${poseA}`, 512, 768, seed, shouldRemoveBg, `${key}-${action}-a`)
        .then((url) => {
          bump();
          return url;
        })
        .catch((err) => {
          bump();
          console.warn(`Frame failed (${key}/${action} A):`, err);
          return null;
        }),
      generateOneFrame(`${basePrompt}, ${poseB}`, 512, 768, seed, shouldRemoveBg, `${key}-${action}-b`)
        .then((url) => {
          bump();
          return url;
        })
        .catch((err) => {
          bump();
          console.warn(`Frame failed (${key}/${action} B):`, err);
          return null;
        }),
    ]).then(([a, b]) => ({ action, urls: [a, b].filter((u): u is string => !!u) }));
  });

  const results = await Promise.all(jobs);
  const frames = {} as ActionFrames;
  for (const { action, urls } of results) {
    frames[action] = urls;
  }

  if (!frames.idle?.length) {
    throw new Error('All frame generations failed — check your connection and try again.');
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

/**
 * Uploads a single admin-provided image (e.g. a scene from pixler.dev's Background
 * generator) directly for a non-animated slot like 'background', 'aura' or 'npc'.
 */
export async function uploadSinglePortrait(key: PortraitKey, file: File): Promise<string> {
  const path = `${key}-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from(CHARACTER_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/png', upsert: true, cacheControl: '3600' });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(CHARACTER_PHOTOS_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  const label = PORTRAIT_SLOTS.find((s) => s.key === key)?.label ?? key;
  const { error: dbError } = await supabase.from('characters').upsert({
    slot: key,
    name: label,
    photo_url: url,
    updated_at: new Date().toISOString(),
  });
  if (dbError) throw dbError;

  writeLocal(key, { url, prompt: cache[key]?.prompt ?? null, frames: cache[key]?.frames ?? null });
  notify();
  return url;
}

export async function resetPortrait(key: PortraitKey): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert({ slot: key, photo_url: null, prompt: null, frames: null, updated_at: new Date().toISOString() });
  if (error) throw error;
  writeLocal(key, { url: null, prompt: null, frames: null });
  notify();
}

/**
 * Slices a sprite-sheet image (multiple animation frames laid out in a single horizontal
 * strip — the typical export format from tools like pixler.dev) into N individual frame
 * Blobs. If frameCount is 1, the whole image is returned as a single frame (no slicing).
 */
async function sliceSpriteSheet(file: File, frameCount: number): Promise<Blob[]> {
  if (frameCount <= 1) return [file];

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not read that image'));
    el.src = URL.createObjectURL(file);
  });

  const frameWidth = img.naturalWidth / frameCount;
  const frameHeight = img.naturalHeight;
  const blobs: Blob[] = [];

  for (let i = 0; i < frameCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, i * frameWidth, 0, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
    if (blob) blobs.push(blob);
  }

  return blobs.length > 0 ? blobs : [file];
}

/**
 * Uploads an admin-provided image file (e.g. generated on pixler.dev or another sprite
 * tool) for a single action (idle/walk/attack/jump) of a character slot, merging it into
 * that slot's existing frame set. Files from dedicated sprite generators already come with
 * a transparent background, so no background removal is applied here. If frameCount > 1,
 * the image is treated as a sprite sheet and sliced into that many individual frames.
 */
export async function uploadActionFrame(
  key: PortraitKey,
  action: SpriteAction,
  file: File,
  frameCount: number = 1
): Promise<string[]> {
  const slices = await sliceSpriteSheet(file, frameCount);
  const urls: string[] = [];

  for (let i = 0; i < slices.length; i++) {
    const path = `${key}-${action}-${Date.now()}-${i}.png`;
    const { error: uploadError } = await supabase.storage
      .from(CHARACTER_PHOTOS_BUCKET)
      .upload(path, slices[i], { contentType: 'image/png', upsert: true, cacheControl: '3600' });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(CHARACTER_PHOTOS_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  const existingFrames = cache[key]?.frames ?? ({ idle: [], walk: [], attack: [], jump: [] } as ActionFrames);
  const nextFrames: ActionFrames = { ...existingFrames, [action]: urls };

  const label = PORTRAIT_SLOTS.find((s) => s.key === key)?.label ?? key;
  const { error: dbError } = await supabase.from('characters').upsert({
    slot: key,
    name: label,
    photo_url: nextFrames.idle[0] ?? urls[0],
    frames: nextFrames,
    updated_at: new Date().toISOString(),
  });
  if (dbError) throw dbError;

  writeLocal(key, { url: nextFrames.idle[0] ?? urls[0], prompt: cache[key]?.prompt ?? null, frames: nextFrames });
  notify();
  return urls;
}
