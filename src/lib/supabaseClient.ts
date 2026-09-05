import { createClient } from '@supabase/supabase-js';

// This is the "publishable" (anon) key — Supabase's own docs describe it as
// safe to ship in client-side bundles as long as Row Level Security (RLS)
// policies are configured on the tables/storage it touches (which they are,
// see supabase_setup.sql). It is NOT the secret/service_role key.
const SUPABASE_URL = 'https://szadgxaegrdtvkebbpxk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_k4qxOqWYVJJsFGxHZe-98A_IHEwr-qT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export const CHARACTER_PHOTOS_BUCKET = 'character-photos';

export interface CharacterRecord {
  slot: string;
  name: string;
  photo_url: string | null;
  updated_at: string;
}
