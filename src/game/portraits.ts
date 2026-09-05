/**
 * Character portrait storage — synced via Supabase.
 *
 * Lets an "admin" (reachable at ?admin=1) upload a photo for Hero / A.U.R.A. / Villain / NPC
 * and have it show up as the 2D portrait everywhere the game shows an icon (dialogue box,
 * HUD emblem, main menu emblems, character sheet) — for EVERY player, on every device,
 * because the photo is uploaded to Supabase Storage and its URL is stored in a shared
 * "characters" table (see supabase_setup.sql).
 *
 * A local in-memory + localStorage cache is kept so portraits render instantly (no flash of
 * "no photo") and still work offline; Supabase is the source of truth and pushes live
 * updates to every open tab/device via Realtime.
 */
import { useEffect, useState } from 'react';
import { supabase, CHARACTER_PHOTOS_BUCKET } from '../lib/supabaseClient';

export type PortraitKey = 'hero' | 'aura' | 'villain' | 'npc';

export const PORTRAIT_SLOTS: { key: PortraitKey; label: string; hint: string }[] = [
  { key: 'hero', label: 'Hero (Aura Vanguard)', hint: 'Shown on the main menu, HUD, dialogue, and character sheet.' },
  { key: 'aura', label: 'A.U.R.A. (AI Companion)', hint: 'Shown in dialogue when A.U.R.A. speaks.' },
  { key: 'villain', label: 'Villain (The Dread Lord)', hint: 'Shown on the main menu and in dialogue.' },
  { key: 'npc', label: 'Side Character (NPC)', hint: 'Shown in dialogue for Commander Jax, Shadow Drone, etc.' },
];

const STORAGE_PREFIX = 'legend-awakening-portrait:';

const cache: Record<PortraitKey, string | null> = {
  hero: null,
  aura: null,
  villain: null,
  npc: null,
};

// Seed the in-memory cache from localStorage immediately (synchronous, no flash on load).
for (const { key } of PORTRAIT_SLOTS) {
  try {
    cache[key] = localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    // ignore (e.g. private browsing storage restrictions)
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((cb) => cb());
}

function writeLocal(key: PortraitKey, url: string | null) {
  cache[key] = url;
  try {
    if (url) localStorage.setItem(STORAGE_PREFIX + key, url);
    else localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore quota errors — Supabase is still the source of truth
  }
}

/** Synchronous read from the local cache — safe to call directly during render. */
export function getPortrait(key: PortraitKey): string | null {
  return cache[key];
}

/**
 * React hook: forces a re-render whenever any portrait changes (from this tab's own upload,
 * or a Realtime push from another admin/device). Call it once near the top of any component
 * that renders getPortrait(...) so it stays live.
 */
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

/** Fetch current portraits from Supabase and subscribe to live updates. Call once at app start. */
export function initPortraitSync(): void {
  if (initialized) return;
  initialized = true;

  supabase
    .from('characters')
    .select('slot, photo_url')
    .then(({ data, error }) => {
      if (error) {
        console.warn('Portrait sync: failed to load from Supabase, using local cache only:', error.message);
        return;
      }
      let changed = false;
      for (const row of data || []) {
        const key = row.slot as PortraitKey;
        if (PORTRAIT_SLOTS.some((s) => s.key === key) && row.photo_url !== cache[key]) {
          writeLocal(key, row.photo_url);
          changed = true;
        }
      }
      if (changed) notify();
    });

  supabase
    .channel('portraits-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, (payload) => {
      const row = (payload.new || payload.old) as { slot?: string; photo_url?: string | null };
      const key = row.slot as PortraitKey;
      if (!key || !PORTRAIT_SLOTS.some((s) => s.key === key)) return;
      writeLocal(key, payload.eventType === 'DELETE' ? null : row.photo_url ?? null);
      notify();
    })
    .subscribe();
}

/**
 * Uploads a photo to Supabase Storage, saves its public URL against the given slot in the
 * shared "characters" table, and updates the local cache immediately.
 */
export async function setPortrait(key: PortraitKey, file: File): Promise<void> {
  const blob = await fileToCompressedBlob(file);
  const path = `${key}-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(CHARACTER_PHOTOS_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(CHARACTER_PHOTOS_BUCKET).getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  const label = PORTRAIT_SLOTS.find((s) => s.key === key)?.label ?? key;
  const { error: dbError } = await supabase
    .from('characters')
    .upsert({ slot: key, name: label, photo_url: publicUrl, updated_at: new Date().toISOString() });
  if (dbError) throw dbError;

  writeLocal(key, publicUrl);
  notify();
}

export async function resetPortrait(key: PortraitKey): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .upsert({ slot: key, photo_url: null, updated_at: new Date().toISOString() });
  if (error) throw error;
  writeLocal(key, null);
  notify();
}

/**
 * Reads an uploaded image file, downsizes it to a reasonable max dimension, and returns a
 * compressed JPEG Blob — keeps uploads small/fast and avoids giant multi-MB phone-camera
 * photos slowing down the game or eating into the free storage quota.
 */
function fileToCompressedBlob(file: File, maxDim = 512, quality = 0.87): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Could not compress image'))),
          'image/jpeg',
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
