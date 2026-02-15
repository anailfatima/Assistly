
-- ===============================================================
-- RPC Functions for Vector Embedding Insertion (Updated for groq/compound-mini)
-- Run this in Supabase SQL Editor
-- ===============================================================

-- ===============================================================
-- Function to insert document with embedding
-- Properly casts the vector string to vector(1024) type
-- ===============================================================
CREATE OR REPLACE FUNCTION public.insert_doc_with_embedding(
  p_title TEXT,
  p_description TEXT,
  p_file_url TEXT,
  p_file_type TEXT,
  p_uploader_id UUID,
  p_content TEXT,
  p_category TEXT,
  p_embedding TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.docs (
    title,
    description,
    file_url,
    file_type,
    uploader_id,
    content,
    category,
    embedding
  ) VALUES (
    p_title,
    p_description,
    p_file_url,
    p_file_type,
    p_uploader_id,
    p_content,
    p_category,
    -- Cast the string to vector(1024) for groq/compound-mini
    p_embedding::vector(1024)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ===============================================================
-- Function to insert FAQ with embedding
-- Properly casts the vector string to vector(1024) type
-- ===============================================================
CREATE OR REPLACE FUNCTION public.insert_faq_with_embedding(
  p_question TEXT,
  p_answer TEXT,
  p_embedding TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.faqs (
    question,
    answer,
    embedding
  ) VALUES (
    p_question,
    p_answer,
    -- Cast the string to vector(1024) for groq/compound-mini
    p_embedding::vector(1024)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ===============================================================
-- Verify the functions were created
-- ===============================================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name IN ('insert_doc_with_embedding', 'insert_faq_with_embedding')
AND routine_schema = 'public';

