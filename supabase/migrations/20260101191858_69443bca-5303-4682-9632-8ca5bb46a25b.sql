-- Create rooms table for IP-based rooms
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_files table
CREATE TABLE public.shared_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_key TEXT NOT NULL,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shared_texts table  
CREATE TABLE public.shared_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_key TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (no auth needed for local sharing)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_texts ENABLE ROW LEVEL SECURITY;

-- Public access policies (anyone can read/write to their room)
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view shared files" ON public.shared_files FOR SELECT USING (true);
CREATE POLICY "Anyone can add shared files" ON public.shared_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete shared files" ON public.shared_files FOR DELETE USING (true);

CREATE POLICY "Anyone can view shared texts" ON public.shared_texts FOR SELECT USING (true);
CREATE POLICY "Anyone can add shared texts" ON public.shared_texts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete shared texts" ON public.shared_texts FOR DELETE USING (true);

-- Enable realtime for instant sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_texts;