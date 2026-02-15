# 🚀 Quick Start Guide - Vector RAG Upgrade

## ⚡ 3-Step Setup

### 1️⃣ Run SQL Migration (2 minutes)
```
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: server/vector_rag_migration.sql
3. Paste and click "Run"
4. ✅ Done - pgvector is now enabled!
```

### 2️⃣ Configure Groq API Key (1 minute)
```
1. Get key from: https://console.groq.com/keys
2. Edit: server/.env
3. Make sure you have: GROQ_API_KEY=your_groq_api_key_here
4. Save file
```

### 3️⃣ Restart Server (30 seconds)
```bash
# Stop current server (Ctrl+C)
cd server
npm run dev
```

## ✅ That's It!

Your system now uses **vector-based RAG**!

## 🧪 Test It

### Upload a Test Document
1. Login to Admin Dashboard
2. Upload a .txt file
3. Look for: **"Document uploaded successfully with vector embedding"**

### Ask a Question
1. Go to chat
2. Ask something related to your document
3. Check server console for:
   ```
   ✅ Generated query embedding
   ✅ Found X relevant matches via vector search
   ```

## 📝 Re-upload Existing Content

**IMPORTANT**: Old documents won't work until re-uploaded!

### Quick Method:
1. Admin Dashboard → Documents
2. Delete old docs
3. Re-upload them
4. Each will now have embeddings

### Bulk Method (if you have many):
Run the migration script in `VECTOR_RAG_MIGRATION.md` (Step 4, Option B)

## 🎯 What Changed?

| Before | After |
|--------|-------|
| Keyword matching | Semantic search |
| Retrieved ALL docs | Top 5 relevant only |
| No similarity scoring | 70% similarity threshold |
| Manual filtering | AI-powered matching |

## 🔍 How to Know It's Working

### ✅ Success Indicators:
- Upload message says "with vector embedding"
- Console shows "Generated query embedding"
- Console shows "Found X relevant matches"
- Chat answers are more accurate
- Different wording finds same docs

### ❌ Common Issues:

**"GROQ_API_KEY is not configured"**
→ Add key to `.env` and restart server

**"function match_knowledge_base does not exist"**
→ Run the SQL migration in Supabase

**"No relevant information found"**
→ Re-upload your documents to generate embeddings

## 💰 Cost

- **Groq Embeddings**: ~$0.02 per 1M tokens (via Groq API)
- **Example**: 100 documents = ~$0.002 (less than a penny!)
- **Per chat**: ~$0.00002 (negligible)

## 📚 Full Documentation

- **Migration Guide**: `VECTOR_RAG_MIGRATION.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **SQL Script**: `server/vector_rag_migration.sql`

## 🆘 Need Help?

Check the troubleshooting section in `VECTOR_RAG_MIGRATION.md`

---

**Ready to upgrade?** Just follow the 3 steps above! 🎉
