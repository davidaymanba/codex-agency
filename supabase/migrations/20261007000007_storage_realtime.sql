-- =============================================================================
-- CODEX · 007 · Storage buckets (+ policies) and Realtime for new leads
-- =============================================================================

-- Public-read image buckets with server-side type/size validation (no SVG: can carry scripts).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select b, b, true, 8 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  from unnest(array['media', 'projects', 'posts', 'team']) as b
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "editors upload images" on storage.objects for insert to authenticated
  with check (bucket_id in ('media', 'projects', 'posts', 'team') and public.has_role('editor'));
create policy "editors update images" on storage.objects for update to authenticated
  using (bucket_id in ('media', 'projects', 'posts', 'team') and public.has_role('editor'));
create policy "editors delete images" on storage.objects for delete to authenticated
  using (bucket_id in ('media', 'projects', 'posts', 'team') and public.has_role('editor'));

-- New leads stream to the dashboard (Realtime respects RLS: only staff receive rows).
alter publication supabase_realtime add table public.leads;
