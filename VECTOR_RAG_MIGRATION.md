# Vector RAG Migration Guide for Assistly

This guide will help you upgrade Assistly from keyword-based retrieval to a proper vector-based RAG (Retrieval-Augmented Generation) architecture using pgvector.

## 🎯 What Changed

### Before (Keyword-Based)
- Simple keyword matching using `includes()`
- Retrieved ALL documents and FAQs from database
- Filtered by matching keywords in title/content
- No semantic understanding

### After (Vector-Based RAG)
- **Semantic search** using embeddings and vector similarity
- **Efficient retrieval** - only fetches top 5 most relevant chunks
- **True RAG architecture** with pgvector
- **Better context** for LLM responses

## 📋 Prerequisites

1. **Supabase Account** with your existing project
2. **Groq API Key** - Get one from [Groq Console](https://console.groq.com/keys)

## 🚀 Migration Steps

### Step 1: Enable pgvector in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `server/vector_rag_migration.sql`
4. Copy the entire SQL script
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute

This will:
- ✅ Enable the pgvector extension
- ✅ Add `embedding vector(1536)` columns to `docs` and `faqs` tables
- ✅ Create indexes for fast similarity search
- ✅ Create RPC functions: `match_documents()`, `match_faqs()`, and `match_knowledge_base()`

### Step 2: Configure Groq API Key

1. Get your Groq API key from [Groq Console](https://console.groq.com/keys)
2. Open `server/.env`
3. Make sure you have:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   ```

### Step 3: Restart the Server

Since the server is already running, you need to restart it to load the new environment variable:

1. Stop the current server (Ctrl+C in the terminal running `npm run dev`)
2. Start it again:
   ```bash
   cd server
   npm run dev
   ```

### Step 4: Re-upload Existing Documents (IMPORTANT!)

**All existing documents and FAQs need to be re-uploaded to generate embeddings.**

#### Option A: Manual Re-upload (Recommended for small datasets)
1. Log in to the Admin Dashboard
2. Go to **Documents** section
3. Delete old documents
4. Re-upload them one by one
5. You'll see confirmation: "Document uploaded successfully **with vector embedding**"

#### Option B: Bulk Migration Script (For large datasets)

If you have many documents, create a migration script:

```javascript
// server/scripts/migrate-embeddings.js
import { supabase } from '../src/config/supabase.js'
import { generateEmbedding } from '../src/utils/embeddings.js'

async function migrateDocuments() {
  // Get all docs without embeddings
  const { data: docs } = await supabase
    .from('docs')
    .select('*')
    .is('embedding', null)
    .not('content', 'is', null)

  console.log(`Found ${docs.length} documents to migrate`)

  for (const doc of docs) {
    try {
      const textForEmbedding = doc.content.length > 8000 
        ? doc.content.substring(0, 8000) 
        : doc.content
      
      const embedding = await generateEmbedding(textForEmbedding)
      
      await supabase
        .from('docs')
        .update({ embedding })
        .eq('id', doc.id)
      
      console.log(`✅ Migrated: ${doc.title}`)
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`❌ Failed: ${doc.title}`, error)
    }
  }
}

async function migrateFAQs() {
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .is('embedding', null)

  console.log(`Found ${faqs.length} FAQs to migrate`)

  for (const faq of faqs) {
    try {
      const textForEmbedding = `${faq.question}\n${faq.answer}`
      const embedding = await generateEmbedding(textForEmbedding)
      
      await supabase
        .from('faqs')
        .update({ embedding })
        .eq('id', faq.id)
      
      console.log(`✅ Migrated FAQ: ${faq.question.substring(0, 50)}...`)
      
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`❌ Failed FAQ: ${faq.question}`, error)
    }
  }
}

// Run migrations
console.log('Starting migration...')
await migrateDocuments()
await migrateFAQs()
console.log('Migration complete!')
```

Run it with:
```bash
cd server
node scripts/migrate-embeddings.js
```

## ✅ Verification

### Test the New System

1. **Upload a new document** via Admin Dashboard
   - Check the console logs for: `✅ Generated embedding for document: [title]`
   
2. **Add a new FAQ**
   - Check for: `✅ Generated embedding for FAQ: [question]`

3. **Test chat queries**
   - Ask a question in the chat
   - Check server logs for:
     ```
     ✅ Generated query embedding
     ✅ Found X relevant matches via vector search
     ```

4. **Verify semantic search works**
   - Try asking questions using different words than what's in the docs
   - Example: If doc says "refund policy", try asking "How do I get my money back?"
   - The system should still find the relevant document!

### Check Database

Run this in Supabase SQL Editor to verify embeddings exist:

```sql
-- Check docs with embeddings
SELECT 
  title, 
  CASE WHEN embedding IS NOT NULL THEN 'Yes' ELSE 'No' END as has_embedding
FROM docs;

-- Check FAQs with embeddings
SELECT 
  question, 
  CASE WHEN embedding IS NOT NULL THEN 'Yes' ELSE 'No' END as has_embedding
FROM faqs;
```

## 🔧 Troubleshooting

### Error: "GROQ_API_KEY is not configured"
- Make sure you added the key to `server/.env`
- Restart the server after adding the key

### Error: "function match_knowledge_base does not exist"
- The SQL migration didn't run successfully
- Re-run `vector_rag_migration.sql` in Supabase SQL Editor

### Error: "column 'embedding' does not exist"
- The migration didn't add the columns
- Check Supabase logs for errors
- Ensure you have proper permissions

### Chat returns "No relevant information found"
- Check if documents have embeddings (see verification section)
- Try lowering the similarity threshold in `chatController.js` (line ~68):
  ```javascript
  const relevantMatches = matches.filter(m => m.similarity > 0.5) // Lower from 0.7
  ```

### Slow response times
- This is normal - embedding generation takes ~1-2 seconds
- Embeddings are only generated once during upload
- Chat queries generate one embedding, then use fast vector search

## 📊 Performance Metrics

### Before (Keyword-Based)
- Retrieved: ALL documents + FAQs
- Filtering: Client-side keyword matching
- Context size: Unpredictable, often too large

### After (Vector-Based)
- Retrieved: Top 5 most relevant chunks only
- Filtering: Server-side vector similarity (pgvector)
- Context size: Controlled (~4000 chars max)
- Similarity threshold: 70% (configurable)

## 🎓 How It Works

```
User Query: "How do I reset my password?"
     ↓
1. Generate embedding for query (1536-dim vector)
     ↓
2. Vector similarity search in Supabase
   - Compares query embedding with all doc/FAQ embeddings
   - Returns top 5 most similar (cosine distance)
     ↓
3. Filter by similarity > 0.7 (70% match)
     ↓
4. Build context from matched chunks
     ↓
5. Send to Groq LLM with context
     ↓
6. Return grounded response to user
```

## 🔐 Security Notes

- Groq API key is only used server-side
- Never expose API keys in frontend code
- Embeddings are stored in Supabase (encrypted at rest)
- RLS policies still apply to all queries

## 💰 Cost Considerations

### Groq Embedding Costs
- Model: `text-embedding-3-small`
- Cost: ~$0.02 per 1M tokens (via Groq API)
- Average document (1000 words): ~$0.00002
- **Very affordable** - even 1000 documents costs ~$0.02

### When embeddings are generated:
- ✅ Document upload (one-time)
- ✅ FAQ creation (one-time)
- ✅ User query (every chat message)

### Optimization tips:
- Embeddings are cached in database
- Only query embedding is generated per chat
- No repeated embedding generation for same content

## 📚 Additional Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Groq Embeddings Guide](https://console.groq.com/docs/embeddings)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-columns)

## 🎉 Success!

Once you see these logs, your system is fully upgraded:

```
✅ Generated embedding for document: [title]
✅ Generated query embedding
✅ Found 3 relevant matches via vector search
```

Your Assistly chatbot now uses **true semantic RAG** with vector similarity search! 🚀
