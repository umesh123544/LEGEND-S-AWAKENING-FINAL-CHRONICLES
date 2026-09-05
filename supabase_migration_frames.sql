-- ============================================================================
-- Migration: multi-frame sprite animation (run AFTER the previous migrations)
-- ============================================================================

-- Stores 2 frames each for idle / walk / attack / jump, e.g.:
-- {"idle": ["url1","url2"], "walk": ["url1","url2"], "attack": ["url1","url2"], "jump": ["url1","url2"]}
alter table public.characters add column if not exists frames jsonb;
