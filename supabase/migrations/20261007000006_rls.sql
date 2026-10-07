-- =============================================================================
-- CODEX · 006 · Row Level Security — enabled on EVERY table.
--   anon (website visitors): read published content only. No direct inserts anywhere.
--   viewer: read everything in the dashboard.   editor: manage content + leads.
--   admin: everything, incl. users. Server-only writes (leads, page views, rate limits)
--   use the service role, which bypasses RLS by design.
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array['profiles','services','solutions','project_categories','projects','posts','testimonials',
                           'team_members','stats','tech_logos','leads','lead_notes','site_settings','media',
                           'page_views','activity_log','rate_limits']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- content tables with `published`
do $$
declare t text;
begin
  foreach t in array array['services','solutions','testimonials','team_members','stats','tech_logos']
  loop
    execute format($f$create policy "public reads published" on public.%I for select to anon, authenticated using (published)$f$, t);
    execute format($f$create policy "staff read all" on public.%I for select to authenticated using (public.has_role('viewer'))$f$, t);
    execute format($f$create policy "editors insert" on public.%I for insert to authenticated with check (public.has_role('editor'))$f$, t);
    execute format($f$create policy "editors update" on public.%I for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'))$f$, t);
    execute format($f$create policy "editors delete" on public.%I for delete to authenticated using (public.has_role('editor'))$f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- projects / posts / categories
create policy "public reads published projects" on public.projects for select to anon, authenticated using (status = 'published');
create policy "public reads live posts" on public.posts for select to anon, authenticated
  using (status in ('published', 'scheduled') and published_at <= now());
create policy "public reads categories" on public.project_categories for select to anon, authenticated using (true);

do $$
declare t text;
begin
  foreach t in array array['projects','posts','project_categories']
  loop
    execute format($f$create policy "staff read all" on public.%I for select to authenticated using (public.has_role('viewer'))$f$, t);
    execute format($f$create policy "editors insert" on public.%I for insert to authenticated with check (public.has_role('editor'))$f$, t);
    execute format($f$create policy "editors update" on public.%I for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'))$f$, t);
    execute format($f$create policy "editors delete" on public.%I for delete to authenticated using (public.has_role('editor'))$f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- site settings & media (public read)
create policy "public reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "editors update settings" on public.site_settings for update to authenticated
  using (public.has_role('editor')) with check (public.has_role('editor'));

create policy "public reads media" on public.media for select to anon, authenticated using (true);
create policy "editors insert media" on public.media for insert to authenticated with check (public.has_role('editor') and uploaded_by = auth.uid());
create policy "editors update media" on public.media for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "editors delete media" on public.media for delete to authenticated using (public.has_role('editor'));

-- ---------------------------------------------------------------- CRM (no anon access at all)
create policy "staff read leads" on public.leads for select to authenticated using (public.has_role('viewer'));
create policy "editors update leads" on public.leads for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "editors delete leads" on public.leads for delete to authenticated using (public.has_role('editor'));

create policy "staff read notes" on public.lead_notes for select to authenticated using (public.has_role('viewer'));
create policy "editors add own notes" on public.lead_notes for insert to authenticated
  with check (public.has_role('editor') and author_id = auth.uid() and kind = 'note');

-- ---------------------------------------------------------------- users
create policy "staff read profiles" on public.profiles for select to authenticated
  using (public.has_role('viewer') or id = auth.uid());
create policy "admins update profiles" on public.profiles for update to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admins delete profiles" on public.profiles for delete to authenticated using (public.has_role('admin'));

-- Self-service preferences without granting UPDATE on profiles.
create or replace function public.update_my_preferences(p_language text, p_theme text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
     set language = case when p_language in ('en', 'ar') then p_language else language end,
         theme = case when p_theme in ('system', 'light', 'dark') then p_theme else theme end
   where id = auth.uid();
$$;
revoke all on function public.update_my_preferences(text, text) from public, anon;
grant execute on function public.update_my_preferences(text, text) to authenticated;

-- ---------------------------------------------------------------- analytics & audit (read-only for staff)
create policy "staff read page views" on public.page_views for select to authenticated using (public.has_role('viewer'));
create policy "editors read activity" on public.activity_log for select to authenticated using (public.has_role('editor'));
-- rate_limits: RLS on with no policies → only security-definer functions / service role.

-- Analytics functions are security invoker; make them callable but data stays RLS-filtered.
revoke all on function public.analytics_daily(integer) from public, anon;
revoke all on function public.analytics_breakdown(integer, text) from public, anon;
grant execute on function public.analytics_daily(integer) to authenticated;
grant execute on function public.analytics_breakdown(integer, text) to authenticated;
