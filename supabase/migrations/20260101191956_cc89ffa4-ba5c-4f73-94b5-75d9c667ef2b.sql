-- Create storage bucket for shared files
INSERT INTO storage.buckets (id, name, public) VALUES ('shared-files', 'shared-files', true);

-- Storage policies for shared files bucket
CREATE POLICY "Anyone can view shared files" ON storage.objects FOR SELECT USING (bucket_id = 'shared-files');
CREATE POLICY "Anyone can upload shared files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shared-files');
CREATE POLICY "Anyone can delete shared files" ON storage.objects FOR DELETE USING (bucket_id = 'shared-files');

-- Update shared_files table to store URL instead of data
ALTER TABLE public.shared_files DROP COLUMN data;
ALTER TABLE public.shared_files ADD COLUMN file_path TEXT NOT NULL DEFAULT '';