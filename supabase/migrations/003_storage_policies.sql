-- ============================================================
-- STORAGE POLICIES FOR MCE-DOCUMENTS BUCKET
-- ============================================================
--
-- IMPORTANT: These policies CANNOT be applied via SQL Editor!
-- You MUST use the Supabase Dashboard to create them.
--
-- ============================================================
-- MANUAL SETUP STEPS (Required)
-- ============================================================
--
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Storage (left sidebar)
-- 3. Click on "Policies" tab
-- 4. Select bucket: mce-documents
-- 5. Create the following 3 policies:
--
-- ============================================================
-- POLICY 1: SELECT (View/Download files)
-- ============================================================
-- Policy name: storage_documents_select
-- Allowed operation: SELECT
-- Target roles: authenticated
-- USING expression (paste this):
/*
bucket_id = 'mce-documents'
and exists (
  select 1
  from public.documents d
  where d.storage_bucket = storage.objects.bucket_id
    and d.storage_path = storage.objects.name
    and (
      public.is_admin_role()
      or (d.project_id is not null and public.can_view_project(d.project_id))
      or (d.tender_id is not null and public.can_view_tender(d.tender_id))
    )
)
*/
--
-- ============================================================
-- POLICY 2: INSERT (Upload files)
-- ============================================================
-- Policy name: storage_documents_insert
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression (paste this):
/*
bucket_id = 'mce-documents'
and exists (
  select 1
  from public.documents d
  where d.storage_bucket = storage.objects.bucket_id
    and d.storage_path = storage.objects.name
    and d.uploaded_by_profile_id = public.current_profile_id()
    and (
      (d.project_id is not null and public.can_edit_project(d.project_id))
      or (d.tender_id is not null and public.can_edit_tender(d.tender_id))
    )
)
*/
--
-- ============================================================
-- POLICY 3: DELETE (Remove files - admin only)
-- ============================================================
-- Policy name: storage_documents_delete
-- Allowed operation: DELETE
-- Target roles: authenticated
-- USING expression (paste this):
/*
bucket_id = 'mce-documents'
and exists (
  select 1
  from public.documents d
  where d.storage_bucket = storage.objects.bucket_id
    and d.storage_path = storage.objects.name
    and public.is_admin_role()
)
*/
--
-- ============================================================
-- END OF MANUAL SETUP
-- ============================================================
--
-- The SQL below is for REFERENCE ONLY.
-- It will fail with "ERROR 42501: must be owner of table objects"
-- if you try to run it directly.
--
-- ============================================================

-- REFERENCE SQL (DO NOT RUN - use Dashboard instead)

create policy storage_documents_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mce-documents'
  and exists (
    select 1
    from public.documents d
    where d.storage_bucket = storage.objects.bucket_id
      and d.storage_path = storage.objects.name
      and (
        public.is_admin_role()
        or (d.project_id is not null and public.can_view_project(d.project_id))
        or (d.tender_id is not null and public.can_view_tender(d.tender_id))
      )
  )
);

create policy storage_documents_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mce-documents'
  and exists (
    select 1
    from public.documents d
    where d.storage_bucket = storage.objects.bucket_id
      and d.storage_path = storage.objects.name
      and d.uploaded_by_profile_id = public.current_profile_id()
      and (
        (d.project_id is not null and public.can_edit_project(d.project_id))
        or (d.tender_id is not null and public.can_edit_tender(d.tender_id))
      )
  )
);

create policy storage_documents_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mce-documents'
  and exists (
    select 1
    from public.documents d
    where d.storage_bucket = storage.objects.bucket_id
      and d.storage_path = storage.objects.name
      and public.is_admin_role()
  )
);
