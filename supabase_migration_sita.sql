-- ============================================================================
-- Migration: add Sita character slot (Ramayan theme)
-- ============================================================================
insert into public.characters (slot, name) values
  ('sita', 'Sita')
on conflict (slot) do nothing;
