# Local Embeddings Setup Guide

This guide explains how to use **local embeddings** with `@xenova/transformers` for RAG (Retrieval-Augmented Generation) in your Node.js chatbot backend.

## Overview

The system now uses **local embeddings** instead of cloud-based APIs (Groq/OpenAI). All embeddings are generated on your local machine using the `all-MiniLM-L6-v2` model, which produces **384-dimensional** embeddings.

## Prerequisites

1. **Node.js** (v18 or higher recommended)
2. **Supabase** account with pgvector extension enabled
3. **@xenova/transformers** package installed

## Installation

### 1. Install Dependencies

```bash
cd server
npm install @xenova/transformers
```

The package is already added to `package.json`, so running `npm install` will install it.

### 2. Database Setup

Run the SQL migration script in your Supabase SQL Editor to set up the vector columns with the correct dimension (384):

```sql
-- Run this in Supabase SQL Editor
-- File: server/update_vector_dimension_local.sql
```

This script will:
- Update vector columns to `vector(384)` dimension
- Recreate indexes for efficient similarity search
- Update RPC functions for vector operations

**Important:** Make sure to run `update_vector_dimension_local.sql` (not the Groq version which uses 1024 dimensions).

## Architecture

### Components

1. **`localEmbeddings.js`** - Core embedding generation module
   - Uses `@xenova/transformers` with `all-MiniLM-L6-v2` model
   - Generates 384-dimensional embeddings
   - Provides utility functions for text processing

2. **`chatController.js`** - Handles chat requests with RAG
   - Generates query embeddings locally
   - Performs vector similarity search in Supabase
   - Retrieves top-k relevant documents
   - Feeds context to LLM (still uses Groq for chat completions)

3. **`adminController.js`** - Handles document uploads
   - Extracts text from uploaded files
   - Generates embeddings locally
   - Stores documents with embeddings in Supabase

## Usage

### Document Upload

When you upload a document through the admin interface:

1. Text is extracted from the file (currently supports `.txt` files)
2. Embedding is generated locally using `generateEmbedding()`
3. Document and embedding are stored in Supabase using the `insert_doc_with_embedding` RPC function

**Example:**
```javascript
import { generateEmbedding, formatEmbeddingForVector } from '../utils/localEmbeddings.js';

const text = "Your document content here...";
const embedding = await generateEmbedding(text);
const embeddingStr = formatEmbeddingForVector(embedding);

// Insert into Supabase
await supabase.rpc('insert_doc_with_embedding', {
  p_title: 'Document Title',
  p_content: text,
  p_embedding: embeddingStr,
  // ... other fields
});
```

### Query Processing (RAG)

When a user sends a chat message:

1. **Query Embedding**: Generate embedding for the user's query
2. **Vector Search**: Search Supabase for similar documents using `match_knowledge_base` RPC
3. **Context Building**: Extract top-k relevant documents (similarity > 0.7)
4. **LLM Response**: Feed context to Groq LLM for answer generation

**Example:**
```javascript
import { generateEmbedding } from '../utils/localEmbeddings.js';

const query = "What is the refund policy?";
const queryEmbedding = await generateEmbedding(query);

// Search Supabase
const { data: matches } = await supabase.rpc('match_knowledge_base', {
  query_embedding: queryEmbedding, // Array is automatically converted
  match_count: 5
});

// Use matches as context for LLM
```

### Migration Script

To generate embeddings for existing documents that don't have them:

```bash
cd server
node scripts/migrate-embeddings.js
```

This script will:
- Find all documents and FAQs without embeddings
- Generate embeddings locally for each
- Update the database with the new embeddings

**Note:** No API keys required - everything runs locally!

## API Reference

### `generateEmbedding(text: string): Promise<number[]>`

Generates a 384-dimensional embedding for the given text.

**Parameters:**
- `text` (string): Text to embed

**Returns:**
- `Promise<number[]>`: Array of 384 numbers representing the embedding

**Example:**
```javascript
const embedding = await generateEmbedding("Hello, world!");
console.log(embedding.length); // 384
```

### `generateEmbeddings(texts: string[]): Promise<number[][]>`

Generates embeddings for multiple texts in batch.

**Parameters:**
- `texts` (string[]): Array of texts to embed

**Returns:**
- `Promise<number[][]>`: Array of embeddings

### `formatEmbeddingForVector(embedding: number[]): string`

Converts an embedding array to Supabase vector string format.

**Parameters:**
- `embedding` (number[]): Embedding array

**Returns:**
- `string`: Formatted vector string like `[1.0,2.0,3.0,...]`

### `splitIntoChunks(text: string, maxChunkSize?: number): string[]`

Splits text into chunks for processing large documents.

**Parameters:**
- `text` (string): Text to split
- `maxChunkSize` (number, optional): Maximum characters per chunk (default: 800)

**Returns:**
- `string[]`: Array of text chunks

### `getEmbeddingDimension(): number`

Returns the embedding dimension (384).

### `getModelName(): string`

Returns the model name being used (`Xenova/all-MiniLM-L6-v2`).

## Supabase RPC Functions

The following RPC functions are used for vector operations:

### `match_knowledge_base(query_embedding, match_count)`

Searches both documents and FAQs for similar content.

**Parameters:**
- `query_embedding` (vector(384)): Query embedding
- `match_count` (int): Number of results to return (default: 5)

**Returns:**
- Table with columns: `source`, `id`, `title`, `content`, `similarity`

### `insert_doc_with_embedding(...)`

Inserts a document with its embedding.

### `insert_faq_with_embedding(...)`

Inserts an FAQ with its embedding.

## Performance Considerations

### Model Loading

The embedding model is loaded on first use and cached in memory. The first embedding generation may take a few seconds, but subsequent calls are fast.

### Embedding Generation Speed

- **Local embeddings**: ~50-200ms per embedding (depending on text length and hardware)
- **No API rate limits**: Generate as many embeddings as needed
- **No API costs**: Completely free to use

### Vector Search Performance

Supabase uses `ivfflat` indexes for fast similarity search. The index is created automatically when you run the migration SQL.

## Troubleshooting

### Model Download Issues

If the model fails to download:
- Check your internet connection (model downloads on first use)
- Models are cached in `~/.cache/huggingface/` (or similar)
- You can pre-download models manually if needed

### Dimension Mismatch Errors

If you see dimension mismatch errors:
- Ensure you've run `update_vector_dimension_local.sql` (384 dimensions)
- Check that your Supabase vector columns are `vector(384)`
- Verify RPC functions use `vector(384)` type

### Memory Issues

If you encounter memory issues with large batches:
- Process documents in smaller batches
- Use `splitIntoChunks()` for very long documents
- Consider increasing Node.js memory limit: `node --max-old-space-size=4096`

## Migration from Cloud Embeddings

If you were previously using Groq/OpenAI embeddings:

1. **Update Database Schema**: Run `update_vector_dimension_local.sql`
2. **Update Code**: All imports now use `localEmbeddings.js` instead of `embeddings.js`
3. **Regenerate Embeddings**: Run `migrate-embeddings.js` to regenerate all embeddings with local model
4. **Remove API Keys**: You no longer need `GROQ_API_KEY` for embeddings (still needed for chat completions)

## Advantages of Local Embeddings

✅ **No API costs** - Completely free  
✅ **No rate limits** - Generate as many embeddings as needed  
✅ **Privacy** - Data never leaves your server  
✅ **Reliability** - No dependency on external APIs  
✅ **Speed** - Fast generation after initial model load  
✅ **Offline capable** - Works without internet (after model download)

## Limitations

⚠️ **Model size**: ~90MB download on first use  
⚠️ **Memory usage**: Model stays in memory (~200MB)  
⚠️ **Embedding quality**: `all-MiniLM-L6-v2` is good but not as powerful as larger models  
⚠️ **Dimension**: 384 dimensions (vs 1024/1536 for some cloud models)

## Next Steps

1. ✅ Install `@xenova/transformers`
2. ✅ Run database migration SQL
3. ✅ Test document upload with embeddings
4. ✅ Test chat queries with RAG
5. ✅ Run migration script for existing documents

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase logs for RPC function errors
- Verify vector column dimensions match (384)
- Ensure RPC functions are created correctly

---

**Last Updated**: 2024  
**Model**: `Xenova/all-MiniLM-L6-v2`  
**Embedding Dimension**: 384
