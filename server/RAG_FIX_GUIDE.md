# RAG Pipeline Fix Guide

## 🔧 Issues Fixed

### 1. **Similarity Threshold Too High**
- **Problem**: Threshold was set to 0.7 (70%), which filtered out all matches
- **Fix**: Lowered to 0.5 (50%) with adaptive fallback to top matches
- **Impact**: Now retrieves relevant documents even with lower similarity scores

### 2. **Vector Format for RPC Calls**
- **Problem**: Unclear format for passing embeddings to Supabase RPC
- **Fix**: Pass embedding array directly (Supabase handles conversion)
- **Impact**: Proper vector similarity search execution

### 3. **Poor Context Building**
- **Problem**: Empty context when no matches passed threshold
- **Fix**: Adaptive threshold + fallback to top match + better prompt
- **Impact**: Always provides context when matches exist

### 4. **Limited Logging**
- **Problem**: Hard to diagnose retrieval issues
- **Fix**: Added comprehensive logging at each step
- **Impact**: Easy to debug and monitor RAG pipeline

### 5. **Document Embedding Strategy**
- **Problem**: Large documents truncated to 8000 chars
- **Fix**: Use first 2000 + last 200 chars for better representation
- **Impact**: Better embedding quality for long documents

## 📋 Step-by-Step Fix Instructions

### Step 1: Verify Database Schema

Run this SQL in Supabase SQL Editor to ensure your schema is correct:

```sql
-- Check if vector columns exist with correct dimension
SELECT 
  table_name, 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE column_name = 'embedding' 
AND table_name IN ('docs', 'faqs');

-- Should show: vector(384) for both tables
```

If not correct, run:
```bash
# Run the migration SQL file
# File: server/update_vector_dimension_local.sql
```

### Step 2: Verify RPC Functions Exist

```sql
-- Check if match_knowledge_base function exists
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'match_knowledge_base';

-- Should return the function with vector(384) parameter
```

### Step 3: Test Your Setup

Run the diagnostic script:

```bash
cd server
node scripts/test-rag.js "How many paid leaves does an employee get?"
```

This will:
- ✅ Generate a query embedding
- ✅ Check documents in database
- ✅ Test vector search
- ✅ Show similarity scores
- ✅ Diagnose issues

### Step 4: Regenerate Embeddings (If Needed)

If documents don't have embeddings or embeddings are wrong:

```bash
cd server
node scripts/migrate-embeddings.js
```

This will:
- Find all documents/FAQs without embeddings
- Generate embeddings locally
- Update database

### Step 5: Test Chat Endpoint

Send a test query through your chat API:

```bash
curl -X POST http://localhost:YOUR_PORT/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "How many paid leaves does an employee get?",
    "user_id": "YOUR_USER_ID"
  }'
```

Check server logs for:
- ✅ "🔄 Generating query embedding..."
- ✅ "✅ Generated query embedding"
- ✅ "🔄 Performing vector similarity search..."
- ✅ "✅ Found X relevant matches"
- ✅ Similarity scores for each match

## 🐛 Troubleshooting

### Issue: "No matches found"

**Possible Causes:**
1. Documents don't have embeddings
   - **Fix**: Run `node scripts/migrate-embeddings.js`
   
2. Vector dimension mismatch
   - **Fix**: Run `update_vector_dimension_local.sql` in Supabase
   
3. RPC function not created
   - **Fix**: Run `update_vector_dimension_local.sql` in Supabase

**Diagnosis:**
```bash
node scripts/test-rag.js "your query"
```

### Issue: "Similarity scores are very low (< 0.3)"

**Possible Causes:**
1. Query doesn't match document content
2. Embeddings generated incorrectly
3. Model mismatch

**Fix:**
- Check if embeddings were generated correctly
- Verify document content matches query intent
- Try more specific queries

### Issue: "RPC function error"

**Error**: `function match_knowledge_base(vector, integer) does not exist`

**Fix:**
1. Run `update_vector_dimension_local.sql` in Supabase SQL Editor
2. Verify function signature matches:
   ```sql
   CREATE OR REPLACE FUNCTION match_knowledge_base(
     query_embedding vector(384),
     match_count int DEFAULT 5
   )
   ```

### Issue: "Vector dimension mismatch"

**Error**: `dimension mismatch: vector has 384 dimensions but query has X`

**Fix:**
1. Ensure you're using `localEmbeddings.js` (384 dimensions)
2. Run `update_vector_dimension_local.sql` to update database
3. Regenerate embeddings: `node scripts/migrate-embeddings.js`

## 📊 Understanding Similarity Scores

For `all-MiniLM-L6-v2` model:
- **0.8-1.0**: Very similar (exact or near-exact match)
- **0.6-0.8**: Similar (semantically related)
- **0.4-0.6**: Somewhat similar (loosely related)
- **< 0.4**: Not similar

**Current Threshold**: 0.5 (50% similar)
- Matches with similarity > 0.5 are used
- If none > 0.5, top 3 matches are used anyway

## 🔍 Debugging Checklist

- [ ] Database has `vector(384)` columns
- [ ] RPC functions exist and use `vector(384)`
- [ ] Documents have embeddings (check with test script)
- [ ] Query embeddings are 384 dimensions
- [ ] Similarity scores are being calculated
- [ ] Context is being built from matches
- [ ] LLM receives context in prompt

## 📝 Code Changes Summary

### `chatController.js`
- ✅ Lowered similarity threshold to 0.5
- ✅ Added adaptive fallback to top matches
- ✅ Improved logging and error handling
- ✅ Fixed vector format for RPC calls
- ✅ Better context building logic

### `adminController.js`
- ✅ Improved document embedding strategy
- ✅ Better error handling
- ✅ Enhanced logging

### New Files
- ✅ `documentChunker.js` - Document chunking utility
- ✅ `test-rag.js` - Diagnostic testing script

## 🚀 Next Steps

1. **Test the fixes**:
   ```bash
   node scripts/test-rag.js "your test query"
   ```

2. **Upload a test document**:
   - Upload your "Company Policies" document
   - Verify embedding is generated
   - Check database has embedding

3. **Test queries**:
   - "How many paid leaves does an employee get?"
   - "What are the core hours for remote employees?"
   - "Is multi-factor authentication required?"

4. **Monitor logs**:
   - Watch server logs during queries
   - Check similarity scores
   - Verify context is built correctly

## ✅ Success Indicators

You'll know it's working when:
- ✅ Test script shows matches with similarity scores
- ✅ Chat queries return relevant answers
- ✅ Server logs show successful vector search
- ✅ Context is built from retrieved documents
- ✅ LLM generates answers based on context

---

**Need Help?** Run the test script first: `node scripts/test-rag.js "your query"`
