-- Alloha Qi Space — healing stories (submitted by students, published by an admin)
-- Run after schema.sql. Safe to re-run.
create table if not exists public.healing_stories (
  id uuid primary key default gen_random_uuid(),
  age_range text default '',
  gender text default '',
  location text default '',
  area text default 'Other',
  practice text default '',          -- what they practised (e.g. Zhineng Qigong classes, Hun Yuan Qi sessions)
  duration text default '',          -- how long
  before_text text default '',       -- what they came with, in their words
  after_text text not null,          -- what changed, in their words
  quote text default '',             -- short pull quote (admin edits)
  doctor_care boolean not null default false,
  consent boolean not null default false,
  contact text default '',           -- private: never shown publicly
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.healing_stories enable row level security;
drop policy if exists "admin manages stories" on public.healing_stories;
create policy "admin manages stories" on public.healing_stories for all using (public.is_admin()) with check (public.is_admin());

-- Public view: published stories only, without contact details.
create or replace view public.public_healing_stories as
  select id, age_range, gender, location, area, practice, duration, before_text, after_text, quote, doctor_care, position, created_at
  from public.healing_stories where status = 'published' and consent;
grant select on public.public_healing_stories to anon, authenticated;
