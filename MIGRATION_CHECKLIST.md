# Vector RAG Migration Checklist

Use this checklist to track your migration progress.

## Pre-Migration Checklist

- [ ] **Backup your database** (recommended)
  - Export current `docs` table
  - Export current `faqs` table
  - Export current `chats` table

- [ ] **Verify prerequisites**
  - [ ] Supabase project is accessible
  - [ ] You have admin access to Supabase SQL Editor
  - [ ] Node.js server is running locally
  - [ ] You have a Groq account

## Phase 1: Database Setup

- [ ] **Enable pgvector extension**
  - [ ] Open Supabase Dashboard
  - [ ] Navigate to SQL Editor
  - [ ] Open `server/vector_rag_migration.sql`
  - [ ] Copy entire SQL script
  - [ ] Paste into Supabase SQL Editor
  - [ ] Click "Run"
  - [ ] Verify no errors in output

- [ ] **Verify database changes**
  ```sql
  -- Run this in Supabase SQL Editor to verify
  
  -- Check if extension is enabled
  SELECT * FROM pg_extension WHERE extname = 'vector';
  
  -- Check if embedding columns exist
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'docs' AND column_name = 'embedding';
  
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'faqs' AND column_name = 'embedding';
  
  -- Check if RPC functions exist
  SELECT routine_name 
  FROM information_schema.routines 
  WHERE routine_name IN ('match_documents', 'match_faqs', 'match_knowledge_base');
  ```
  - [ ] Extension is enabled
  - [ ] Embedding columns exist in both tables
  - [ ] All 3 RPC functions exist

## Phase 2: API Configuration

- [ ] **Get Groq API Key**
  - [ ] Visit https://console.groq.com/keys
  - [ ] Create new API key or use existing
  - [ ] Copy the key (starts with `gsk_`)

- [ ] **Configure environment**
  - [ ] Open `server/.env`
  - [ ] Make sure you have: `GROQ_API_KEY=your_groq_api_key_here`
  - [ ] Save file

- [ ] **Restart server**
  - [ ] Stop current server (Ctrl+C in terminal)
  - [ ] Run: `cd server && npm run dev`
  - [ ] Verify server starts without errors
  - [ ] Check for embedding-related logs

## Phase 3: Code Verification

- [ ] **Verify file changes**
  - [ ] `server/src/controllers/chatController.js` has `generateEmbedding` import
  - [ ] `server/src/controllers/adminController.js` has `generateEmbedding` import
  - [ ] `server/src/utils/embeddings.js` exists
  - [ ] `server/vector_rag_migration.sql` exists

- [ ] **Test embedding generation**
  - [ ] Server logs show no errors about missing modules
  - [ ] No TypeScript/import errors in console

## Phase 4: Data Migration

### Option A: Manual Re-upload (Small Dataset)

- [ ] **Count existing data**
  - Documents: _____ (check Admin Dashboard)
  - FAQs: _____ (check Admin Dashboard)

- [ ] **Backup existing content**
  - [ ] Export/copy document titles and content
  - [ ] Export/copy FAQ questions and answers

- [ ] **Re-upload documents**
  - [ ] Delete old documents from Admin Dashboard
  - [ ] Upload each document again
  - [ ] Verify each shows: "uploaded successfully with vector embedding"
  - [ ] Check server logs for: "✅ Generated embedding for document"

- [ ] **Re-create FAQs**
  - [ ] Delete old FAQs from Admin Dashboard
  - [ ] Add each FAQ again
  - [ ] Verify each shows: "added successfully with vector embedding"
  - [ ] Check server logs for: "✅ Generated embedding for FAQ"

### Option B: Bulk Migration (Large Dataset)

- [ ] **Prepare migration script**
  - [ ] File exists: `server/scripts/migrate-embeddings.js`
  - [ ] Groq API key is configured in `.env`

- [ ] **Run migration**
  ```bash
  cd server
  node scripts/migrate-embeddings.js
  ```
  - [ ] Script runs without fatal errors
  - [ ] Check migration summary output
  - [ ] Note: Migrated: _____ Failed: _____

- [ ] **Verify embeddings in database**
  ```sql
  -- Run in Supabase SQL Editor
  
  -- Count docs with embeddings
  SELECT 
    COUNT(*) as total,
    COUNT(embedding) as with_embedding,
    COUNT(*) - COUNT(embedding) as without_embedding
  FROM docs;
  
  -- Count FAQs with embeddings
  SELECT 
    COUNT(*) as total,
    COUNT(embedding) as with_embedding,
    COUNT(*) - COUNT(embedding) as without_embedding
  FROM faqs;
  ```
  - [ ] All (or most) documents have embeddings
  - [ ] All (or most) FAQs have embeddings

## Phase 5: Testing

### Basic Functionality Tests

- [ ] **Test document upload**
  - [ ] Login to Admin Dashboard
  - [ ] Upload a new .txt file
  - [ ] Success message includes "with vector embedding"
  - [ ] Server logs show: "✅ Generated embedding for document"

- [ ] **Test FAQ creation**
  - [ ] Add a new FAQ
  - [ ] Success message includes "with vector embedding"
  - [ ] Server logs show: "✅ Generated embedding for FAQ"

- [ ] **Test chat query**
  - [ ] Open chat interface
  - [ ] Send a test message
  - [ ] Server logs show:
    - [ ] "✅ Generated query embedding"
    - [ ] "✅ Found X relevant matches via vector search"
  - [ ] Bot responds with relevant information

### Semantic Search Tests

- [ ] **Test 1: Exact match**
  - Document contains: "refund policy"
  - Query: "refund policy"
  - [ ] Bot finds and uses the document

- [ ] **Test 2: Synonym match**
  - Document contains: "refund policy"
  - Query: "money back guarantee"
  - [ ] Bot finds and uses the document (semantic match!)

- [ ] **Test 3: Different wording**
  - Document contains: "How to reset your password"
  - Query: "I forgot my password, what should I do?"
  - [ ] Bot finds and uses the document

- [ ] **Test 4: No match**
  - Query: "What's the weather today?"
  - [ ] Bot responds: "I don't have that information"

### Performance Tests

- [ ] **Response time**
  - Average chat response time: _____ seconds
  - [ ] Response time is acceptable (< 5 seconds)

- [ ] **Accuracy**
  - [ ] Responses are more relevant than before
  - [ ] Bot uses appropriate context
  - [ ] No hallucinations (making up information)

## Phase 6: Monitoring

- [ ] **Check server logs regularly**
  - [ ] No errors about missing embeddings
  - [ ] No Groq API errors
  - [ ] Vector search is working

- [ ] **Monitor Groq usage**
  - [ ] Visit https://console.groq.com/usage
  - [ ] Check daily usage
  - [ ] Verify costs are within budget

- [ ] **User feedback**
  - [ ] Collect feedback from users
  - [ ] Note any issues or improvements needed

## Phase 7: Optimization (Optional)

- [ ] **Tune similarity threshold**
  - Current: 0.7 (70%)
  - Test with: 0.6, 0.5, 0.8
  - Optimal value: _____

- [ ] **Adjust match count**
  - Current: 5
  - Test with: 3, 7, 10
  - Optimal value: _____

- [ ] **Adjust context size**
  - Current: 4000 chars
  - Test with: 3000, 5000
  - Optimal value: _____

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

- [ ] **Restore old code**
  ```bash
  git checkout HEAD~1 server/src/controllers/chatController.js
  git checkout HEAD~1 server/src/controllers/adminController.js
  ```

- [ ] **Remove embedding columns** (optional)
  ```sql
  ALTER TABLE docs DROP COLUMN IF EXISTS embedding;
  ALTER TABLE faqs DROP COLUMN IF EXISTS embedding;
  ```

- [ ] **Restart server**

## Success Criteria

Migration is successful when:

- [x] ✅ All database changes applied without errors
- [x] ✅ Groq API key is configured
- [x] ✅ Server starts without errors
- [ ] ✅ New uploads generate embeddings
- [ ] ✅ Chat queries use vector search
- [ ] ✅ Semantic search works (different wording finds docs)
- [ ] ✅ All existing functionality still works
- [ ] ✅ No breaking errors in production

## Notes & Issues

Use this space to track any issues or observations:

```
Date: ___________
Issue: 
Solution:

Date: ___________
Issue:
Solution:

```

---

**Migration Started**: ___________  
**Migration Completed**: ___________  
**Migrated By**: ___________  
**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back
