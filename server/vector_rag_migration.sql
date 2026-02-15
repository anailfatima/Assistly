-- ===============================
-- Vector RAG Migration for Assistly
-- Run this in Supabase SQL Editor
-- ===============================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add embedding column to docs table
ALTER TABLE public.docs 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Step 3: Add embedding column to faqs table
ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Step 4: Create index for faster similarity search on docs
CREATE INDEX IF NOT EXISTS docs_embedding_idx 
ON public.docs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 5: Create index for faster similarity search on faqs
CREATE INDEX IF NOT EXISTS faqs_embedding_idx 
ON public.faqs 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 6: Create similarity search function for documents
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
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

-- Step 7: Create similarity search function for FAQs
CREATE OR REPLACE FUNCTION match_faqs(
  query_embedding vector(1536),
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

-- Step 8: Create combined search function (searches both docs and faqs)
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(1536),
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

-- ===============================
-- Notes:
-- 1. The embedding dimension is 1536 for text-embedding-3-small
-- 2. Using cosine distance (<=> operator) for similarity
-- 3. IVFFlat index improves search performance for large datasets
-- 4. match_knowledge_base combines both docs and faqs for unified search
-- ===============================
