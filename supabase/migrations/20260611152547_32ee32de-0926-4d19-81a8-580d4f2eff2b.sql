
ALTER TABLE public.shared_texts
  ADD CONSTRAINT shared_texts_content_length_check
  CHECK (length(content) <= 10000);

DROP POLICY IF EXISTS "Anyone can delete shared files" ON public.shared_files;
CREATE POLICY "Owner or recent uploader can delete files"
  ON public.shared_files FOR DELETE
  TO public
  USING (
    (uploader_id IS NOT NULL AND uploader_id = (auth.uid())::text)
    OR created_at > now() - interval '30 minutes'
  );

DROP POLICY IF EXISTS "Anyone can delete shared texts" ON public.shared_texts;
CREATE POLICY "Recently created texts can be deleted"
  ON public.shared_texts FOR DELETE
  TO public
  USING (created_at > now() - interval '30 minutes');

DROP POLICY IF EXISTS "Anyone can view shared files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete shared files" ON storage.objects;

CREATE POLICY "Recently uploaded shared files can be deleted"
  ON storage.objects FOR DELETE
  TO public
  USING (
    bucket_id = 'shared-files'
    AND (
      EXISTS (
        SELECT 1 FROM public.shared_files sf
        WHERE sf.file_path = storage.objects.name
          AND (
            (sf.uploader_id IS NOT NULL AND sf.uploader_id = (auth.uid())::text)
            OR sf.created_at > now() - interval '30 minutes'
          )
      )
      OR storage.objects.created_at > now() - interval '30 minutes'
    )
  );
