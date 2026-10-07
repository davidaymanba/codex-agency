-- =============================================================================
-- CODEX · 001 · Core: extensions, enums, helpers, profiles & roles
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- Roles are ordered: viewer < editor < admin (enum order is used for comparisons).
create type public.user_role as enum ('viewer', 'editor', 'admin');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost');
create type public.content_status as enum ('draft', 'published');
create type public.post_status as enum ('draft', 'scheduled', 'published');

-- -----------------------------------------------------------------------------
-- updated_at helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'viewer',
  avatar_url text,
  active boolean not null default true,
  invited_at timestamptz,
  last_sign_in_at timestamptz,
  language text not null default 'en' check (language in ('en', 'ar')),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Dashboard users. Role comes from auth app_metadata on creation (never user-editable metadata).';

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Role helpers (security definer so policies can call them without recursion)
-- -----------------------------------------------------------------------------
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.active;
$$;

create or replace function public.has_role(min_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.auth_role() >= min_role, false);
$$;

revoke all on function public.auth_role() from public;
revoke all on function public.has_role(public.user_role) from public;
grant execute on function public.auth_role() to authenticated, anon;
grant execute on function public.has_role(public.user_role) to authenticated, anon;

-- -----------------------------------------------------------------------------
-- Auto-create a profile for every new auth user (invites included).
-- The role is read from raw_APP_meta_data (only the service role can set it).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role, invited_at, language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'viewer'),
    new.invited_at,
    coalesce(new.raw_user_meta_data ->> 'language', 'en')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep last sign-in + name in sync (and clear the invite flag once they sign in).
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
     set last_sign_in_at = new.last_sign_in_at,
         invited_at = case when new.last_sign_in_at is not null then null else p.invited_at end,
         full_name = coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), p.full_name)
   where p.id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of last_sign_in_at, raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();

-- -----------------------------------------------------------------------------
-- Guards on profile changes: nobody edits their own role/active flag, and there is
-- always at least one active admin.
-- -----------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.id = auth.uid()
     and (new.role is distinct from old.role or new.active is distinct from old.active) then
    raise exception 'cannot change your own access' using errcode = 'P0001', hint = 'self';
  end if;
  if old.role = 'admin' and old.active and (new.role <> 'admin' or not new.active) then
    if (select count(*) from public.profiles where role = 'admin' and active and id <> old.id) = 0 then
      raise exception 'at least one active admin is required' using errcode = 'P0001', hint = 'last_admin';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();
