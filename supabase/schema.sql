-- FRAMEWISE production schema (Supabase / Postgres)
-- Mirrors src/lib/types.ts. The demo app runs on seed data + .data/store.json;
-- point src/lib/db.ts at these tables to go live.

create table platforms (
  id text primary key,                      -- 'ps5', 'xbox-series-x', 'pc-high', …
  name text not null,
  short text not null,
  family text not null check (family in ('playstation','xbox','nintendo','pc','steamdeck','mac','mobile')),
  theme jsonb not null,                     -- { primary, secondary, gradient:[a,b], badgeBg, badgeFg, tint }
  hardware jsonb not null default '{}'::jsonb,
  sort int not null default 0
);

create table studios (
  slug text primary key,
  name text not null,
  founded int,
  hq text,
  parent text,
  history text,
  logo_url text
);
create table publishers (like studios including all);

create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  igdb_id bigint unique
);

create table games (
  slug text primary key,
  title text not null,
  tagline text,
  summary text,
  release_date date,
  genres text[] not null default '{}',
  tags text[] not null default '{}',
  engine text,
  critic_score int,
  cover_url text,
  igdb_id bigint unique,
  rawg_id bigint unique,
  updated_at timestamptz not null default now()
);

create table game_studios (game_slug text references games on delete cascade, studio_slug text references studios, primary key (game_slug, studio_slug));
create table game_publishers (game_slug text references games on delete cascade, publisher_slug text references publishers, primary key (game_slug, publisher_slug));

create table game_credits (
  game_slug text references games on delete cascade,
  person_id uuid references people,
  role text not null check (role in ('director','lead_writer','composer','producer')),
  primary key (game_slug, person_id, role)
);

create table game_platforms (
  game_slug text references games on delete cascade,
  platform text not null,                   -- release platform: ps4, ps5, xbox-series, switch-2, pc, mac …
  release_date date,
  edition text,                             -- 'PS5 Pro Enhanced', 'Xbox Series X|S Optimized'
  primary key (game_slug, platform)
);

create table pc_requirements (
  game_slug text references games on delete cascade,
  tier text not null check (tier in ('minimum','recommended','ultra')),
  cpu text, gpu text, ram_gb int, vram_gb int, storage text, os text, api text, target text,
  source text,
  primary key (game_slug, tier)
);

create table performance_tests (
  id uuid primary key default gen_random_uuid(),
  game_slug text references games on delete cascade,
  platform_id text references platforms,
  mode text not null check (mode in ('performance','balanced','quality','raytracing')),
  target_fps numeric,
  fps_avg numeric not null check (fps_avg > 0),
  fps_1low numeric not null check (fps_1low >= 0),
  native_res text, native_pixels int, output_res text,
  upscaler text,
  quality text check (quality in ('Low','Medium','High','Ultra')),
  rt boolean not null default false,
  hdr boolean not null default false,
  vrr boolean not null default false,
  load_sec numeric, install_gb numeric,
  patch_version text,
  source_label text not null,
  source_url text check (source_url is null or source_url like 'https://%'),
  verified boolean not null default false,
  is_demo boolean not null default false,
  submitted_by uuid references auth.users,
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  tested_at date,
  created_at timestamptz not null default now()
);
create index on performance_tests (game_slug, platform_id, mode) where status = 'approved';

create table user_builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text, cpu text not null, gpu text not null, ram_gb int not null, resolution int not null,
  is_active boolean not null default false
);
create table user_consoles (user_id uuid references auth.users on delete cascade, platform_id text references platforms, primary key (user_id, platform_id));
create table favorites (user_id uuid references auth.users on delete cascade, game_slug text references games on delete cascade, primary key (user_id, game_slug));
create table saved_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text, url text not null, created_at timestamptz not null default now()
);
create table patch_alerts (user_id uuid references auth.users on delete cascade, game_slug text references games on delete cascade, last_patch_seen text, primary key (user_id, game_slug));

-- Row level security: users own their rows; catalog tables are public-read, admin-write.
alter table user_builds enable row level security;
alter table user_consoles enable row level security;
alter table favorites enable row level security;
alter table saved_comparisons enable row level security;
alter table patch_alerts enable row level security;
create policy own_builds on user_builds for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_consoles on user_consoles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_favs on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_comparisons on saved_comparisons for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_alerts on patch_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table performance_tests enable row level security;
create policy read_approved on performance_tests for select using (status = 'approved');
create policy submit_own on performance_tests for insert with check (auth.uid() = submitted_by and status = 'pending' and verified = false);
-- Admin writes go through the service role key from server routes.
