-- Alloha Qi Space — newsletter subscribers (copy of sign-ups; Resend sends the emails)
-- Run after schema.sql. Safe to re-run.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text default '',
  source text default '',
  status text not null default 'subscribed' check (status in ('subscribed', 'unsubscribed')),
  resend_synced boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "admin manages subscribers" on public.newsletter_subscribers;
create policy "admin manages subscribers" on public.newsletter_subscribers for all using (public.is_admin()) with check (public.is_admin());
-- Public sign-ups are written by the server (/api/subscribe) with the service key.
