-- ===============================
-- Assistly AI Chatbot: Database Setup
-- Run this in Supabase SQL Editor
-- ===============================

-- -------------------------------
-- Users Table
-- -------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL, -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------
-- Docs Table
-- -------------------------------
CREATE TABLE IF NOT EXISTS public.docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- for RAG AI
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploader_id UUID REFERENCES public.users(id),
  category TEXT NOT NULL DEFAULT 'Other', -- Policy / FAQ / Other
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------
-- FAQs Table
-- -------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------
-- Chats Table
-- -------------------------------
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  message TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user' or 'bot'
  is_removed BOOLEAN DEFAULT FALSE, -- Soft delete / trash
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------
-- Enable Row Level Security (RLS)
-- -------------------------------
ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- -------------------------------
-- RLS Policies
-- -------------------------------
-- Docs: Public read access
CREATE POLICY "Allow public read on docs" 
ON public.docs 
FOR SELECT 
USING (true);

-- FAQs: Public read access
CREATE POLICY "Allow public read on faqs" 
ON public.faqs 
FOR SELECT 
USING (true);

-- Chats: Users can see their own chats
CREATE POLICY "Allow users to see their own chats" 
ON public.chats 
FOR SELECT 
USING (auth.uid() = user_id);

-- Chats: Users can insert their own chats
CREATE POLICY "Allow users to insert their own chats" 
ON public.chats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Chats: Admins can see all chats
CREATE POLICY "Allow admins to see all chats" 
ON public.chats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- -------------------------------
-- Notes:
-- 1. `category` column added to docs for easy classification (Policy/FAQ/Other)
-- 2. `is_removed` column added to chats for soft delete (trash/restore)
-- 3. Use service role key in backend to bypass RLS for admin operations like permanent deletion
-- 4. Always test after setup to ensure RLS policies work as intended
-- -------------------------------
