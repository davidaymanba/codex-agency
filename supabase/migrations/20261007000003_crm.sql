-- =============================================================================
-- CODEX · 003 · CRM: leads + timeline notes
-- Leads are INSERTED ONLY by the server (service role) after validation, honeypot,
-- rate limiting and optional Turnstile — there is no anon insert policy.
-- =============================================================================

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  phone text not null check (char_length(phone) <= 30),
  company text check (company is null or char_length(company) <= 160),
  service text not null check (service in ('development', 'branding', 'marketing', 'ai', 'ecommerce', 'other')),
  budget text not null check (budget in ('lt5k', '5to15k', '15to40k', 'gt40k', 'unsure')),
  message text not null check (char_length(message) <= 4000),
  locale text not null default 'en' check (locale in ('en', 'ar')),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  source_page text,
  utm jsonb,
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles (id) on delete set null,
  estimated_value integer check (estimated_value is null or estimated_value >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_status_idx on public.leads (status, position);

create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  kind text not null default 'note' check (kind in ('note', 'status', 'assign', 'created')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

-- Timeline entries for status / assignee changes and creation, written by the database.
create or replace function public.lead_timeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare who text;
begin
  if tg_op = 'INSERT' then
    insert into public.lead_notes (lead_id, author_id, kind, body)
    values (new.id, null, 'created', 'Lead created from the website contact form.');
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.lead_notes (lead_id, author_id, kind, body)
    values (new.id, auth.uid(), 'status', old.status || ' → ' || new.status);
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    select full_name into who from public.profiles where id = new.assigned_to;
    insert into public.lead_notes (lead_id, author_id, kind, body)
    values (new.id, auth.uid(), 'assign', 'Assigned to ' || coalesce(who, 'nobody'));
  end if;
  return new;
end;
$$;

create trigger leads_timeline after insert or update of status, assigned_to on public.leads
  for each row execute function public.lead_timeline();
