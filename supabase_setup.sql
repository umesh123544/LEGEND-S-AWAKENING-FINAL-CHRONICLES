-- ============================================================================
-- Legend's Awakening — character portrait sync setup
-- Run this whole file in Supabase → SQL Editor → New query → Run.
-- ============================================================================

-- 1. Table to hold hero / aura / villain / npc photo info
create table if not exists public.characters (
  slot text primary key,   -- 'hero' | 'aura' | 'villain' | 'npc'
  name text not null default '',
  photo_url text,
  updated_at timestamptz not null default now()
);

-- Seed the four slots the game reads (safe to re-run)
insert into public.characters (slot, name) values
  ('hero', 'Hero (Aura Vanguard)'),
  ('aura', 'A.U.R.A. (AI Companion)'),
  ('villain', 'Villain (The Dread Lord)'),
  ('npc', 'Side Character (NPC)')
on conflict (slot) do nothing;

-- 2. Enable Row Level Security
alter table public.characters enable row level security;

-- 3. Everyone (the game, unauthenticated players) can READ character photos
drop policy if exists "Public can view characters" on public.characters;
create policy "Public can view characters"
on public.characters for select
to anon, authenticated
using (true);

-- 4. NOTE ON WRITE ACCESS:
-- The in-game admin panel (?admin=1) uses a simple client-side password check, not a
-- real Supabase-Auth login — so there's no "authenticated" Supabase session to gate on.
-- The write policies below therefore allow the same public "anon" key to insert/update.
-- This mirrors the app's existing security model (documented in AdminPanel.tsx): the
-- password + hidden URL just keep casual players out, they don't stop a determined
-- attacker who reads the shipped JS bundle. Don't store anything sensitive in this table.
drop policy if exists "Public can upsert characters" on public.characters;
create policy "Public can upsert characters"
on public.characters for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can update characters" on public.characters;
create policy "Public can update characters"
on public.characters for update
to anon, authenticated
using (true)
with check (true);

-- 5. Storage: create a PUBLIC bucket named "character-photos" first
--    (Dashboard → Storage → New bucket → name: character-photos → Public bucket: ON)
--    then run the policies below.
drop policy if exists "Public can view character photos" on storage.objects;
create policy "Public can view character photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'character-photos');

drop policy if exists "Public can upload character photos" on storage.objects;
create policy "Public can upload character photos"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'character-photos');

drop policy if exists "Public can update character photos" on storage.objects;
create policy "Public can update character photos"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'character-photos');
