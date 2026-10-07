-- =============================================================================
-- CODEX · 002 · Website content (every translatable field has _en / _ar)
-- =============================================================================

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('development', 'branding', 'marketing')),
  title_en text not null, title_ar text not null,
  tagline_en text not null default '', tagline_ar text not null default '',
  description_en text not null default '', description_ar text not null default '',
  sub_services jsonb not null default '[]'::jsonb,          -- [{ en, ar }]
  illustration text not null default 'code' check (illustration in ('code', 'construction', 'chart')),
  icon text not null default '',
  team_name_en text not null default '', team_name_ar text not null default '',
  team_description_en text not null default '', team_description_ar text not null default '',
  team_deliverables jsonb not null default '[]'::jsonb,      -- [{ en, ar }]
  faqs jsonb not null default '[]'::jsonb,                   -- [{ q: {en,ar}, a: {en,ar} }]
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.solutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null default 'solution' check (kind in ('solution', 'platform')),
  title_en text not null, title_ar text not null,
  description_en text not null default '', description_ar text not null default '',
  icon text not null default '',
  features jsonb not null default '[]'::jsonb,               -- [{ en, ar }]
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('development', 'branding', 'marketing', 'ai')),
  name_en text not null, name_ar text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_en text not null, title_ar text not null,
  summary_en text not null default '', summary_ar text not null default '',
  challenge_en text not null default '', challenge_ar text not null default '',
  approach_en text not null default '', approach_ar text not null default '',
  content_en jsonb, content_ar jsonb,                        -- Tiptap JSON
  category text not null references public.project_categories (slug) on update cascade,
  tags text[] not null default '{}',
  client_name text not null default '',
  year integer not null default extract(year from now()) check (year between 2000 and 2100),
  cover_image text,
  cover_style text not null default 'blocks' check (cover_style in ('grid', 'blocks', 'brackets', 'chart', 'flow')),
  gallery text[] not null default '{}',
  live_url text check (live_url is null or live_url ~ '^https://'),
  results jsonb not null default '[]'::jsonb,                -- [{ value, label: {en,ar} }]
  services text[] not null default '{}',
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  seo_title_en text not null default '', seo_title_ar text not null default '',
  seo_description_en text not null default '', seo_description_ar text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_public_idx on public.projects (status, sort_order);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_en text not null, title_ar text not null,
  excerpt_en text not null default '', excerpt_ar text not null default '',
  content_en jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_ar jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  cover_image text,
  cover_style text not null default 'blocks' check (cover_style in ('grid', 'blocks', 'brackets', 'chart', 'flow')),
  author_name text not null default 'CODEX Team',
  tags text[] not null default '{}',
  reading_minutes integer not null default 1 check (reading_minutes > 0),
  status public.post_status not null default 'draft',
  published_at timestamptz not null default now(),
  seo_title_en text not null default '', seo_title_ar text not null default '',
  seo_description_en text not null default '', seo_description_ar text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_public_idx on public.posts (status, published_at desc);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote_en text not null, quote_ar text not null,
  author_name text not null,
  author_role_en text not null default '', author_role_ar text not null default '',
  company text not null default '',
  country text not null default 'SA' check (country in ('EG', 'SA', 'AE', 'KW', 'OM')),
  avatar_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name_en text not null, name_ar text not null,
  role_en text not null default '', role_ar text not null default '',
  team text not null check (team in ('development', 'branding', 'marketing')),
  photo_url text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stats (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  value integer not null check (value >= 0),
  suffix text not null default '' check (char_length(suffix) <= 4),
  label_en text not null, label_ar text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tech_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text check (icon is null or icon ~ '^si[A-Z][A-Za-z0-9]*$'),   -- simple-icons export name
  marquee_row smallint not null default 1 check (marquee_row in (1, 2)),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['services','solutions','project_categories','projects','posts','testimonials','team_members','stats','tech_logos']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;
