-- Alloha Qi Space — healing events & bookings
-- Run after schema.sql (needs public.is_admin()). Safe to re-run.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text default '',
  summary text default '',              -- one line for cards
  description text default '',          -- markdown
  start_at timestamptz not null,
  end_at timestamptz not null,
  mode text not null default 'in-person' check (mode in ('in-person', 'online', 'hybrid')),
  venue text default 'Alloha Qi Space, Kalyani Nagar, Pune',
  price integer not null default 0 check (price >= 0),   -- rupees per seat; 0 = free
  capacity integer not null default 0 check (capacity >= 0), -- 0 = unlimited
  max_per_booking integer not null default 6 check (max_per_booking between 1 and 50),
  cover_url text default '',
  highlights text default '',           -- one per line
  payment_link text default '',         -- optional: external payment page instead of built-in checkout
  booking_open boolean not null default true,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_at >= start_at)
);
create index if not exists events_start_idx on public.events(start_at);

create table if not exists public.event_bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null,
  phone text default '',
  seats integer not null default 1 check (seats > 0),
  amount integer not null default 0,    -- rupees
  status text not null default 'pending' check (status in ('pending', 'paid', 'free', 'manual', 'cancelled')),
  razorpay_order_id text unique,
  payment_id text default '',
  note text default '',
  created_at timestamptz not null default now()
);
create index if not exists event_bookings_event_idx on public.event_bookings(event_id);

-- Seats taken per event (confirmed bookings only). Exposes totals, never attendee details.
create or replace view public.event_seats as
  select e.id as event_id,
         coalesce(sum(b.seats) filter (where b.status in ('paid', 'free', 'manual')), 0)::int as booked
  from public.events e left join public.event_bookings b on b.event_id = e.id
  where e.published
  group by e.id;
grant select on public.event_seats to anon, authenticated;

alter table public.events enable row level security;
alter table public.event_bookings enable row level security;

drop policy if exists "published events readable" on public.events;
create policy "published events readable" on public.events for select using (published or public.is_admin());
drop policy if exists "admin manages events" on public.events;
create policy "admin manages events" on public.events for all using (public.is_admin()) with check (public.is_admin());

-- Bookings: only admins can read/write directly. Public bookings are created by the server (service role).
drop policy if exists "admin manages bookings" on public.event_bookings;
create policy "admin manages bookings" on public.event_bookings for all using (public.is_admin()) with check (public.is_admin());

-- Migrate the past Reverence Festival
insert into public.events (slug, title, subtitle, summary, description, start_at, end_at, mode, venue, price, capacity, cover_url, highlights, booking_open, published)
values ('reverence-festival', 'Reverence Festival', 'A week of art, wellness and community at Alloha Qi Space.',
  'A week of art, wellness and community: daily Qi Gong, yoga, live music, drum circles and more.',
  E'Join us for a week of art, wellness, and community at the Reverence Festival.\n\nEnjoy daily Qi Gong, yoga, live music, drum circles, and more throughout this immersive wellness week.\n\nOur doors are open to all who wish to explore Zhineng Qigong, music, yoga, art, and sculptures in a welcoming and inspiring space.\n\nCome connect, create, and rejuvenate with us.',
  '2026-04-21 08:00+05:30', '2026-04-21 17:00+05:30', 'in-person', 'Alloha Qi Space, Kalyani Nagar, Pune', 0, 0,
  'https://images.unsplash.com/photo-1758798469179-dea5d63257ba?auto=format&fit=crop&q=70&w=1600',
  E'Daily Qi Gong and yoga\nLive music and drum circles\nArt and sculpture\nOpen to everyone', false, true)
on conflict (slug) do nothing;
