
-- ===============================================================
-- Update Vector Dimension for Local Embeddings (all-MiniLM-L6-v2)
-- Run this in Supabase SQL Editor
-- ===============================================================

-- The all-MiniLM-L6-v2 model produces 384-dimensional embeddings
-- This updates the vector columns from 1024 to 384

-- Step 1: Drop existing indexes (they'll need recreation)
DROP INDEX IF EXISTS docs_embedding_idx;
DROP INDEX IF EXISTS faqs_embedding_idx;

-- Step 2: Drop existing functions
DROP FUNCTION IF EXISTS match_documents(uuid, int);
DROP FUNCTION IF EXISTS match_faqs(uuid, int);
DROP FUNCTION IF EXISTS match_knowledge_base(uuid, int);
DROP FUNCTION IF EXISTS insert_doc_with_embedding(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS insert_faq_with_embedding(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_doc_embedding(UUID, TEXT);
DROP FUNCTION IF EXISTS update_faq_embedding(UUID, TEXT);

-- Step 3: Drop and recreate embedding columns with 384 dimensions
ALTER TABLE public.docs DROP COLUMN IF EXISTS embedding;
ALTER TABLE public.faqs DROP COLUMN IF EXISTS embedding;

-- Step 4: Add embedding column with correct dimension (384 for all-MiniLM-L6-v2)
ALTER TABLE public.docs ADD COLUMN embedding vector(384);
ALTER TABLE public.faqs ADD COLUMN embedding vector(384);

-- Step 5: Recreate indexes for the new dimension
CREATE INDEX IF NOT EXISTS docs_embedding_idx 
ON public.docs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS faqs_embedding_idx 
ON public.faqs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 6: Recreate similarity search functions with new dimension (384)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(384),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    title,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM docs
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_faqs(
  query_embedding vector(384),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    question,
    answer,
    1 - (embedding <=> query_embedding) AS similarity
  FROM faqs
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(384),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  source text,
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT * FROM (
    SELECT
      'doc'::text as source,
      id,
      title,
      content,
      1 - (embedding <=> query_embedding) AS similarity
    FROM docs
    WHERE embedding IS NOT NULL
    
    UNION ALL
    
    SELECT
      'faq'::text as source,
      id,
      question as title,
      answer as content,
      1 - (embedding <=> query_embedding) AS similarity
    FROM faqs
    WHERE embedding IS NOT NULL
  ) combined
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Step 7: Recreate insert functions with new dimension (384)
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
    p_embedding::vector(384)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

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
    p_embedding::vector(384)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Step 8: Create update functions for migration script
CREATE OR REPLACE FUNCTION public.update_doc_embedding(
  p_id UUID,
  p_embedding TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.docs
  SET embedding = p_embedding::vector(384)
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_faq_embedding(
  p_id UUID,
  p_embedding TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.faqs
  SET embedding = p_embedding::vector(384)
  WHERE id = p_id;
END;
$$;

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE column_name = 'embedding' 
AND table_name IN ('docs', 'faqs');

