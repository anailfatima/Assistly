# Quick Start: Local Embeddings

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd server
npm install
```

### Step 2: Update Database Schema
1. Open Supabase SQL Editor
2. Run `server/update_vector_dimension_local.sql`
3. This sets up 384-dimensional vector columns

### Step 3: Verify Installation
```bash
# Test embedding generation
node -e "import('./src/utils/localEmbeddings.js').then(m => m.generateEmbedding('test').then(e => console.log('✅ Embedding dimension:', e.length)))"
```

### Step 4: Migrate Existing Documents (Optional)
```bash
node scripts/migrate-embeddings.js
```

## ✅ What Changed

- ✅ All embedding generation now uses **local embeddings** (no API keys needed)
- ✅ `chatController.js` uses local embeddings for query processing
- ✅ `adminController.js` uses local embeddings for document uploads
- ✅ Migration script updated to use local embeddings

## 📝 Key Files

- `server/src/utils/localEmbeddings.js` - Core embedding module
- `server/src/controllers/chatController.js` - Chat with RAG
- `server/src/controllers/adminController.js` - Document uploads
- `server/update_vector_dimension_local.sql` - Database schema (384 dimensions)

## 🔍 Testing

### Test Document Upload
1. Upload a `.txt` file through admin interface
2. Check console logs for "✅ Generated embedding successfully"
3. Verify embedding dimension is 384

### Test Chat Query
1. Send a chat message
2. Check console logs for:
   - "🔄 Generating local embedding..."
   - "✅ Generated embedding successfully"
   - "✅ Found X relevant matches via vector search"

## ⚠️ Important Notes

1. **First Run**: Model downloads automatically (~90MB) - may take 1-2 minutes
2. **Vector Dimension**: Must be 384 (not 1024 or 1536)
3. **No API Keys**: Embeddings work without Groq/OpenAI keys (but chat still needs Groq for LLM)

## 🐛 Troubleshooting

**Error: "Cannot find module '@xenova/transformers'"**
```bash
cd server && npm install @xenova/transformers
```

**Error: "Dimension mismatch"**
- Run `update_vector_dimension_local.sql` in Supabase
- Verify vector columns are `vector(384)`

**Error: "Model download failed"**
- Check internet connection
- Models cache in `~/.cache/huggingface/`

## 📚 Full Documentation

See `LOCAL_EMBEDDINGS_SETUP.md` for complete documentation.
