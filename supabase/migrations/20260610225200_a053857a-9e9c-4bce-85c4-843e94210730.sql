ALTER TABLE public.shared_files 
  ADD COLUMN IF NOT EXISTS uploader_name text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS uploader_email text,
  ADD COLUMN IF NOT EXISTS uploader_id text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 hours'),
  ADD COLUMN IF NOT EXISTS keep_forever boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS shared_files_expires_at_idx ON public.shared_files(expires_at);