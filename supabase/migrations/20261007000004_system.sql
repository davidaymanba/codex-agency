-- =============================================================================
-- CODEX · 004 · System: site settings, media, page views, activity log, rate limits
-- =============================================================================

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),           -- single row
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '' check (whatsapp ~ '^[0-9]{0,15}$'),
  address_en text not null default '', address_ar text not null default '',
  socials jsonb not null default '{}'::jsonb,
  seo_title_en text not null default '', seo_title_ar text not null default '',
  seo_description_en text not null default '', seo_description_ar text not null default '',
  announcement_enabled boolean not null default false,
  announcement_en text not null default '', announcement_ar text not null default '',
  announcement_href text not null default '',
  maintenance boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Maintenance mode can only be toggled by admins.
create or replace function public.guard_settings_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.maintenance is distinct from old.maintenance and auth.uid() is not null and not public.has_role('admin') then
    raise exception 'only admins can change maintenance mode' using errcode = 'P0001', hint = 'forbidden';
  end if;
  return new;
end;
$$;
create trigger site_settings_guard before update on public.site_settings
  for each row execute function public.guard_settings_update();

create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null unique,
  url text not null,
  filename text not null,
  mime text not null,
  size integer not null check (size > 0),
  alt_en text not null default '', alt_ar text not null default '',
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index media_created_idx on public.media (created_at desc);

-- Raw, cookie-less page views (no IPs; session_hash is a salted daily hash).
create table public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  locale text not null check (locale in ('en', 'ar')),
  referrer text not null default 'direct',
  device text not null check (device in ('desktop', 'mobile', 'tablet')),
  country text,
  session_hash text not null,
  created_at timestamptz not null default now()
);
create index page_views_created_idx on public.page_views (created_at desc);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  summary text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_created_idx on public.activity_log (created_at desc);
create index activity_entity_idx on public.activity_log (entity, created_at desc);

-- Sliding-window rate limiter shared by every server instance.
create table public.rate_limits (
  key text not null,
  hit_at timestamptz not null default now()
);
create index rate_limits_key_idx on public.rate_limits (key, hit_at desc);

create or replace function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  delete from public.rate_limits where hit_at < now() - make_interval(secs => greatest(p_window_seconds, 3600));
  select count(*) into n from public.rate_limits
   where key = p_key and hit_at > now() - make_interval(secs => p_window_seconds);
  if n >= p_max then
    return false;
  end if;
  insert into public.rate_limits (key) values (p_key);
  return true;
end;
$$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;

create or replace function public.rate_limit_clear(p_key text)
returns void
language sql
security definer
set search_path = ''
as $$ delete from public.rate_limits where key = p_key; $$;
revoke all on function public.rate_limit_clear(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Analytics aggregates (security invoker → page_views RLS applies: staff only)
-- -----------------------------------------------------------------------------
create or replace function public.analytics_daily(p_days integer)
returns table (day date, views bigint, visitors bigint, contact_views bigint)
language sql
stable
set search_path = ''
as $$
  select d::date as day,
         count(pv.id) as views,
         count(distinct pv.session_hash) as visitors,
         count(pv.id) filter (where pv.path = '/contact') as contact_views
    from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
    left join public.page_views pv on pv.created_at >= d and pv.created_at < d + interval '1 day'
   group by d
   order by d;
$$;

create or replace function public.analytics_breakdown(p_days integer, p_dimension text)
returns table (label text, value bigint)
language sql
stable
set search_path = ''
as $$
  select case p_dimension
           when 'path' then pv.path
           when 'referrer' then pv.referrer
           when 'locale' then pv.locale
           when 'device' then pv.device
           else 'unknown'
         end as label,
         count(*) as value
    from public.page_views pv
   where pv.created_at >= current_date - (p_days - 1)
   group by 1
   order by 2 desc
   limit 12;
$$;
