-- Alloha Qi Space — courses & members
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).


-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- courses ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text default '',
  description text default '',          -- markdown
  cover_url text default '',
  price integer not null default 0 check (price >= 0),   -- rupees; 0 = free
  level text default 'Beginner',
  duration_text text default '',
  published boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- lessons (content is protected) ----------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section text default '',
  title text not null,
  position integer not null default 0,
  is_preview boolean not null default false,
  duration_text text default '',
  body text default '',                  -- markdown
  video_path text default '',            -- file in course-media bucket
  video_url text default '',             -- or an embed URL (YouTube unlisted, Vimeo, Bunny)
  audio_path text default '',            -- file in course-media bucket
  created_at timestamptz not null default now()
);
create index if not exists lessons_course_idx on public.lessons(course_id, position);

-- Public outline (titles only, no content) for published courses
create or replace view public.lesson_outline as
  select l.id, l.course_id, l.section, l.title, l.position, l.is_preview, l.duration_text,
         (l.video_path <> '' or l.video_url <> '') as has_video, (l.audio_path <> '') as has_audio
  from public.lessons l join public.courses c on c.id = l.course_id
  where c.published;
grant select on public.lesson_outline to anon, authenticated;

-- ---------- enrollments, progress, orders ----------
create table if not exists public.enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  source text not null default 'free',   -- free | razorpay | admin
  payment_id text default '',
  amount integer default 0,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.orders (
  id text primary key,                   -- Razorpay order id
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  amount integer not null,
  status text not null default 'created',
  payment_id text default '',
  created_at timestamptz not null default now()
);

create or replace function public.is_enrolled(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments where user_id = auth.uid() and course_id = c)
$$;

-- ---------- row level security ----------
alter table public.profiles    enable row level security;
alter table public.courses     enable row level security;
alter table public.lessons     enable row level security;
alter table public.enrollments enable row level security;
alter table public.progress    enable row level security;
alter table public.orders      enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));
drop policy if exists "admin profile update" on public.profiles;
create policy "admin profile update" on public.profiles for update using (public.is_admin());

drop policy if exists "published courses readable" on public.courses;
create policy "published courses readable" on public.courses for select using (published or public.is_admin());
drop policy if exists "admin manages courses" on public.courses;
create policy "admin manages courses" on public.courses for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lesson content for members" on public.lessons;
create policy "lesson content for members" on public.lessons for select using (
  public.is_admin()
  or public.is_enrolled(course_id)
  or (is_preview and exists (select 1 from public.courses c where c.id = course_id and c.published))
);
drop policy if exists "admin manages lessons" on public.lessons;
create policy "admin manages lessons" on public.lessons for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own enrollments" on public.enrollments;
create policy "own enrollments" on public.enrollments for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "enroll in free courses" on public.enrollments;
create policy "enroll in free courses" on public.enrollments for insert with check (
  user_id = auth.uid() and source = 'free'
  and exists (select 1 from public.courses c where c.id = course_id and c.published and c.price = 0)
);
drop policy if exists "admin manages enrollments" on public.enrollments;
create policy "admin manages enrollments" on public.enrollments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "admin reads orders" on public.orders;
create policy "admin reads orders" on public.orders for select using (public.is_admin() or user_id = auth.uid());
-- orders are written only by the server (service role bypasses RLS)

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('course-media', 'course-media', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('course-covers', 'course-covers', true) on conflict (id) do nothing;

-- Files in course-media are stored as <course_id>/<file>
drop policy if exists "members read course media" on storage.objects;
create policy "members read course media" on storage.objects for select using (
  bucket_id = 'course-media' and (
    public.is_admin()
    or public.is_enrolled(((storage.foldername(name))[1])::uuid)
    or exists (select 1 from public.lessons l join public.courses c on c.id = l.course_id
               where l.is_preview and c.published and (l.video_path = name or l.audio_path = name))
  )
);
drop policy if exists "admin writes course media" on storage.objects;
create policy "admin writes course media" on storage.objects for all
  using (bucket_id in ('course-media', 'course-covers') and public.is_admin())
  with check (bucket_id in ('course-media', 'course-covers') and public.is_admin());
drop policy if exists "covers are public" on storage.objects;
create policy "covers are public" on storage.objects for select using (bucket_id = 'course-covers');

-- ---------- make yourself admin (run after you sign up on the site) ----------
-- update public.profiles set is_admin = true where email = 'you@example.com';
