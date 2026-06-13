
CREATE TABLE IF NOT EXISTS public.file_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_file_id uuid,
  room_key text NOT NULL,
  name text NOT NULL,
  size bigint NOT NULL DEFAULT 0,
  type text,
  subject text,
  uploader_name text,
  uploader_email text,
  uploader_id text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.file_history TO authenticated;
GRANT ALL ON public.file_history TO service_role;

ALTER TABLE public.file_history ENABLE ROW LEVEL SECURITY;

-- Only authenticated users may read; the Admin page additionally gates by email allowlist on the client.
CREATE POLICY "Authenticated can read file history"
  ON public.file_history FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS file_history_uploaded_at_idx
  ON public.file_history (uploaded_at DESC);

CREATE OR REPLACE FUNCTION public.log_shared_file_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.file_history (
    shared_file_id, room_key, name, size, type, subject,
    uploader_name, uploader_email, uploader_id, uploaded_at
  ) VALUES (
    NEW.id, NEW.room_key, NEW.name, NEW.size, NEW.type, NEW.subject,
    NEW.uploader_name, NEW.uploader_email, NEW.uploader_id, NEW.created_at
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shared_files_log_history ON public.shared_files;
CREATE TRIGGER shared_files_log_history
  AFTER INSERT ON public.shared_files
  FOR EACH ROW EXECUTE FUNCTION public.log_shared_file_history();

-- Backfill existing rows so admin sees all past uploads.
INSERT INTO public.file_history (
  shared_file_id, room_key, name, size, type, subject,
  uploader_name, uploader_email, uploader_id, uploaded_at
)
SELECT id, room_key, name, size, type, subject,
       uploader_name, uploader_email, uploader_id, created_at
FROM public.shared_files
ON CONFLICT DO NOTHING;
