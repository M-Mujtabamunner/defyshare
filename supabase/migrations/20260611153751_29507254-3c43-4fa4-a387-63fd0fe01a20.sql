CREATE POLICY "Anyone can read shared files objects"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'shared-files');