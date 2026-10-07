-- Staff can list objects (needed to verify an upload before registering it in public.media,
-- and for upsert/delete). Public image URLs are served by the bucket itself, not by this policy.
create policy "staff list images" on storage.objects for select to authenticated
  using (bucket_id in ('media', 'projects', 'posts', 'team') and public.has_role('viewer'));
