-- ============================================================================
-- Migration: AI-generated 2D character sprites (run AFTER supabase_setup.sql)
-- ============================================================================

-- Add a 'prompt' column to remember what text was used to generate each image
alter table public.characters add column if not exists prompt text;

-- Seed rows for every sprite-able slot (safe to re-run — won't overwrite existing rows)
insert into public.characters (slot, name) values
  ('villain', 'Villain (The Dread Lord)'),
  ('enemy_dark_soldier', 'Enemy: Dark Soldier'),
  ('enemy_shadow_archer', 'Enemy: Shadow Archer'),
  ('enemy_aura_hunter', 'Enemy: Aura Hunter'),
  ('enemy_dark_guardian', 'Enemy: Dark Guardian'),
  ('enemy_demon_beast', 'Enemy: Demon Beast'),
  ('enemy_mini_boss', 'Enemy: Mini Boss'),
  ('background', 'Battle Background / Location')
on conflict (slot) do nothing;
