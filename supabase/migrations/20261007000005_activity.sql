-- =============================================================================
-- CODEX · 005 · Activity log written by the database (nothing can bypass it)
-- meta feeds the dashboard's localized messages (dash.activity.<action>).
-- =============================================================================

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
  prev jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  actor uuid := auth.uid();
  actor_name text := coalesce((select full_name from public.profiles where id = actor), 'Website');
  entity text;
  section text;
  name text;
  act text;
  changed jsonb;
begin
  entity := case tg_table_name
    when 'leads' then 'lead' when 'projects' then 'project' when 'posts' then 'post'
    when 'site_settings' then 'settings' when 'profiles' then 'user' when 'media' then 'media'
    else 'content' end;
  section := case tg_table_name
    when 'team_members' then 'team' when 'tech_logos' then 'techLogos' else tg_table_name end;
  name := coalesce(rec ->> 'title_en', rec ->> 'name', rec ->> 'name_en', rec ->> 'author_name',
                   rec ->> 'filename', rec ->> 'key', rec ->> 'full_name', rec ->> 'email', '—');

  if tg_op = 'UPDATE' then
    -- Ignore pure ordering / bookkeeping updates (drag-reorder, timestamps, sign-in sync).
    select jsonb_object_agg(k, v) into changed
      from jsonb_each(rec) e(k, v)
     where k not in ('sort_order', 'position', 'updated_at', 'last_sign_in_at', 'invited_at')
       and prev -> k is distinct from v;
    if changed is null then
      return new;
    end if;
  end if;

  if tg_table_name = 'leads' then
    if tg_op = 'INSERT' then
      act := 'create';
    elsif tg_op = 'DELETE' then
      insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
      values (actor, 'delete', 'lead', old.id::text, actor_name || ' deleted lead ' || name, jsonb_build_object('count', '1'));
      return old;
    elsif changed ? 'status' then
      insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
      values (actor, 'status', 'lead', new.id::text, actor_name || ' moved ' || name || ' to ' || (rec ->> 'status'),
              jsonb_build_object('actor', actor_name, 'name', name, 'status', rec ->> 'status'));
      return new;
    elsif changed ? 'assigned_to' then
      insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
      values (actor, 'assign', 'lead', new.id::text, name || ' reassigned',
              jsonb_build_object('name', name, 'who', coalesce((select full_name from public.profiles where id = (rec ->> 'assigned_to')::uuid), '—')));
      return new;
    else
      return new; -- value tweaks are not worth a log line
    end if;
    insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
    values (actor, act, 'lead', new.id::text, 'New lead: ' || name, jsonb_build_object('name', name));
    return new;
  end if;

  if tg_table_name = 'site_settings' then
    insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
    values (actor, 'settings', 'settings', null, actor_name || ' updated the site settings', jsonb_build_object('actor', actor_name));
    return new;
  end if;

  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' then
      insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
      values (actor, 'invite', 'user', new.id::text, actor_name || ' invited ' || (rec ->> 'email'),
              jsonb_build_object('actor', actor_name, 'name', rec ->> 'email', 'role', rec ->> 'role'));
    elsif tg_op = 'UPDATE' and changed ? 'role' then
      insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
      values (actor, 'role', 'user', new.id::text, actor_name || ' changed ' || name || ' to ' || (rec ->> 'role'),
              jsonb_build_object('actor', actor_name, 'name', name, 'role', rec ->> 'role'));
    elsif tg_op = 'UPDATE' and changed ? 'active' then
      insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
      values (actor, 'update', 'user', new.id::text, actor_name || case when (rec ->> 'active')::boolean then ' reactivated ' else ' deactivated ' end || name,
              jsonb_build_object('name', name));
    end if;
    return coalesce(new, old);
  end if;

  if tg_table_name = 'media' then
    insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
    values (actor, case tg_op when 'INSERT' then 'upload' when 'DELETE' then 'content_delete' else 'content_update' end,
            'media', (rec ->> 'id'), actor_name || ' ' || lower(tg_op) || ' ' || name,
            jsonb_build_object('actor', actor_name, 'name', name, 'section', 'media'));
    return coalesce(new, old);
  end if;

  -- Generic content tables
  if tg_op = 'UPDATE' and (changed ? 'published' or changed ? 'status') and (select count(*) from jsonb_object_keys(changed)) = 1 then
    act := case when coalesce((rec ->> 'published')::boolean, rec ->> 'status' in ('published', 'scheduled')) then 'publish' else 'unpublish' end;
  else
    act := case tg_op when 'INSERT' then 'content_create' when 'DELETE' then 'content_delete' else 'content_update' end;
  end if;

  insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
  values (actor, act, entity, rec ->> 'id', actor_name || ' ' || act || ' ' || name,
          jsonb_build_object('actor', actor_name, 'name', name, 'section', section));
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['services','solutions','projects','posts','testimonials','team_members','stats','tech_logos','leads','site_settings','profiles','media']
  loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_activity()', t || '_activity', t);
  end loop;
end $$;

-- Sign-ins are logged from auth.users.
create or replace function public.log_sign_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare n text;
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    select full_name into n from public.profiles where id = new.id;
    insert into public.activity_log (actor_id, action, entity, entity_id, summary, meta)
    values (new.id, 'login', 'user', new.id::text, coalesce(n, new.email) || ' signed in', jsonb_build_object('name', coalesce(n, new.email)));
  end if;
  return new;
end;
$$;

create trigger on_auth_sign_in after update of last_sign_in_at on auth.users
  for each row execute function public.log_sign_in();
