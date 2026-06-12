-- Slice 0: loosen delete policy (rooms are LAN-like, intentional) and add promo duration override

DROP POLICY IF EXISTS "Owner or recent uploader can delete files" ON public.shared_files;
CREATE POLICY "Anyone can delete shared files"
  ON public.shared_files
  FOR DELETE
  TO public
  USING (true);

DROP POLICY IF EXISTS "Recently created texts can be deleted" ON public.shared_texts;
CREATE POLICY "Anyone can delete shared texts"
  ON public.shared_texts
  FOR DELETE
  TO public
  USING (true);

ALTER TABLE public.promo_overrides
  ADD COLUMN IF NOT EXISTS override_seconds bigint;
-- NULL override_seconds + keep_forever=true => infinite. Otherwise expiry = created_at + override_seconds.
