-- ============================================================
-- Trading Journal - Storage Buckets
-- Run this in the Supabase SQL editor after the initial migration.
-- ============================================================

-- Create trade-images bucket (private, 10 MB max per file)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trade-images',
  'trade-images',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ── Storage RLS Policies ──────────────────────────────────

-- SELECT: user can read their own trade images
create policy "trade-images: owner read"
  on storage.objects for select
  using (
    bucket_id = 'trade-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- INSERT: user can upload to their own folder
create policy "trade-images: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'trade-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: user can delete their own trade images
create policy "trade-images: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'trade-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
