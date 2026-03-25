-- ============================================================
-- Golf Charity Platform — BULLETPROOF SCHEMA
-- RLS enabled but ALL policies are fully open (no restrictions)
-- Backend uses service_role key which bypasses RLS anyway
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- ── Step 1: Drop everything cleanly ──────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user() cascade;
drop table if exists winners cascade;
drop table if exists prize_pools cascade;
drop table if exists draws cascade;
drop table if exists scores cascade;
drop table if exists profiles cascade;
drop table if exists charities cascade;

-- ── Step 2: Extensions ───────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Step 3: Charities ────────────────────────────────────────
create table charities (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  description  text,
  image_url    text,
  events       jsonb default '[]'::jsonb,
  is_featured  boolean default false,
  created_at   timestamptz default now()
);

alter table charities enable row level security;
create policy "charities_all" on charities for all using (true) with check (true);

-- ── Step 4: Profiles ─────────────────────────────────────────
create table profiles (
  id                     uuid references auth.users on delete cascade primary key,
  full_name              text,
  email                  text,
  role                   text default 'user',
  charity_id             uuid references charities(id) on delete set null,
  charity_percentage     integer default 10,
  subscription_status    text default 'inactive',
  subscription_plan      text,
  stripe_subscription_id text,
  renewal_date           timestamptz,
  reset_otp              text,
  reset_otp_expires      timestamptz,
  created_at             timestamptz default now()
);

alter table profiles enable row level security;
create policy "profiles_all" on profiles for all using (true) with check (true);

-- ── Step 5: Scores ───────────────────────────────────────────
create table scores (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  score        integer not null check (score >= 1 and score <= 45),
  played_date  date not null,
  created_at   timestamptz default now()
);

create index idx_scores_user_id on scores(user_id);
create index idx_scores_created_at on scores(created_at);

alter table scores enable row level security;
create policy "scores_all" on scores for all using (true) with check (true);

-- ── Step 6: Draws ────────────────────────────────────────────
create table draws (
  id                   uuid default gen_random_uuid() primary key,
  month                integer not null check (month >= 1 and month <= 12),
  year                 integer not null,
  status               text default 'draft',
  draw_type            text default 'random',
  winning_numbers      jsonb,
  jackpot_amount       numeric default 0,
  carried_over_amount  numeric default 0,
  carried_over_from    uuid references draws(id) on delete set null,
  published_at         timestamptz,
  created_at           timestamptz default now()
);

create index idx_draws_status on draws(status);
create index idx_draws_month_year on draws(month, year);

alter table draws enable row level security;
create policy "draws_all" on draws for all using (true) with check (true);

-- ── Step 7: Prize Pools ──────────────────────────────────────
create table prize_pools (
  id               uuid default gen_random_uuid() primary key,
  draw_id          uuid references draws(id) on delete cascade not null,
  total_amount     numeric default 0,
  five_match_pool  numeric default 0,
  four_match_pool  numeric default 0,
  three_match_pool numeric default 0
);

alter table prize_pools enable row level security;
create policy "prize_pools_all" on prize_pools for all using (true) with check (true);

-- ── Step 8: Winners ──────────────────────────────────────────
create table winners (
  id                   uuid default gen_random_uuid() primary key,
  draw_id              uuid references draws(id) on delete cascade not null,
  user_id              uuid references profiles(id) on delete cascade not null,
  match_type           integer not null check (match_type in (3, 4, 5)),
  prize_amount         numeric default 0,
  verification_status  text default 'pending',
  payment_status       text default 'pending',
  proof_url            text,
  rejection_reason     text,
  created_at           timestamptz default now()
);

create index idx_winners_user_id on winners(user_id);
create index idx_winners_draw_id on winners(draw_id);

alter table winners enable row level security;
create policy "winners_all" on winners for all using (true) with check (true);

-- ── Step 9: Auto-create profile trigger ──────────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, subscription_status, charity_percentage)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'user',
    'inactive',
    10
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Step 10: Seed Charities ──────────────────────────────────
insert into charities (name, description, is_featured, image_url, events) values
(
  'Cancer Research UK',
  'Fighting cancer through world-class research, prevention, and awareness. Every contribution helps fund groundbreaking treatments and supports patients and families affected by cancer.',
  true,
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
  '[{"name": "Charity Golf Day 2026", "date": "2026-06-15"}, {"name": "Annual Fundraiser Gala", "date": "2026-09-20"}]'::jsonb
),
(
  'British Heart Foundation',
  'Saving lives through pioneering heart and circulatory research. We fund research into all heart and circulatory diseases and their risk factors.',
  false,
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
  '[{"name": "Heart Health Walk", "date": "2026-05-10"}]'::jsonb
),
(
  'Age UK',
  'Supporting older people to live their best lives. We provide companionship, advice, and support to help older people love later life.',
  false,
  'https://images.unsplash.com/photo-1454923634634-bd1614719a7b?w=400',
  '[{"name": "Community Tea Party", "date": "2026-07-01"}]'::jsonb
),
(
  'RSPCA',
  'Preventing cruelty and promoting animal welfare since 1824. We rescue, rehabilitate, and rehome animals in need across England and Wales.',
  false,
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
  '[{"name": "Pet Adoption Day", "date": "2026-04-22"}]'::jsonb
);

-- ── Step 11: Setup Notes ─────────────────────────────────────
-- After running this schema:
--
-- 1. Go to Supabase → Authentication → Users → Add User
--    Email: admin@golfcharity.com | Password: AdminPass123! | Auto-confirm: ON
--    Email: testuser@golfcharity.com | Password: TestUser123! | Auto-confirm: ON
--
-- 2. Then run:
--    UPDATE profiles SET role = 'admin', subscription_status = 'active' WHERE email = 'admin@golfcharity.com';
--    UPDATE profiles SET subscription_status = 'active', subscription_plan = 'monthly' WHERE email = 'testuser@golfcharity.com';
--
-- 3. Go to Supabase → Storage → New Bucket
--    Name: winner-proofs | Public: YES | Max: 5MB | Types: image/png, image/jpeg, image/webp
--
-- ── Done ──────────────────────────────────────────────────────
