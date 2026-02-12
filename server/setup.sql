-- RUN THIS IN SUPABASE SQL EDITOR

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL, -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create docs table
CREATE TABLE IF NOT EXISTS public.docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Added for RAG
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploader_id UUID REFERENCES public.users(id),
  category TEXT NOT NULL DEFAULT 'Other', -- NEW: Policy / FAQ / Other
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  message TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user' or 'bot'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Simplified for development)
-- In production, these should be more restrictive
CREATE POLICY "Allow public read on docs" ON public.docs FOR SELECT USING (true);
CREATE POLICY "Allow public read on faqs" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Allow users to see their own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admins to see all chats" ON public.chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
