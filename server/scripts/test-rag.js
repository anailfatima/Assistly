#!/usr/bin/env node

/**
 * RAG Testing Script
 * 
 * Tests the RAG pipeline to diagnose issues with document retrieval.
 * 
 * Usage:
 *   node scripts/test-rag.js "How many paid leaves does an employee get?"
 */

import "dotenv/config";
import { supabase } from "../src/config/supabase.js";
import { generateEmbedding } from "../src/utils/localEmbeddings.js";

const testQuery = process.argv[2] || "How many paid leaves does an employee get?";

async function testRAG() {
  console.log("🧪 Testing RAG Pipeline");
  console.log("=".repeat(60));
  console.log(`Query: "${testQuery}"\n`);

  try {
    // Step 1: Generate query embedding
    console.log("Step 1: Generating query embedding...");
    const queryEmbedding = await generateEmbedding(testQuery);
    console.log(`✅ Embedding generated: ${queryEmbedding.length} dimensions`);
    console.log(`   First 5 values: [${queryEmbedding.slice(0, 5).join(", ")}]\n`);

    // Step 2: Check documents in database
    console.log("Step 2: Checking documents in database...");
    const { data: docs, error: docsError } = await supabase
      .from("docs")
      .select("id, title, content, embedding")
      .limit(10);

    if (docsError) {
      console.error("❌ Error fetching documents:", docsError);
      return;
    }

    console.log(`✅ Found ${docs.length} documents`);
    
    const docsWithEmbeddings = docs.filter(d => d.embedding !== null);
    const docsWithoutEmbeddings = docs.filter(d => d.embedding === null);
    
    console.log(`   Documents with embeddings: ${docsWithEmbeddings.length}`);
    console.log(`   Documents without embeddings: ${docsWithoutEmbeddings.length}`);
    
    if (docsWithEmbeddings.length === 0) {
      console.log("\n⚠️  WARNING: No documents have embeddings!");
      console.log("   Run: node scripts/migrate-embeddings.js\n");
      return;
    }

    // Show sample documents
    if (docsWithEmbeddings.length > 0) {
      console.log("\n   Sample documents:");
      docsWithEmbeddings.slice(0, 3).forEach((doc, idx) => {
        console.log(`   [${idx + 1}] "${doc.title}"`);
        console.log(`       Content length: ${doc.content?.length || 0} chars`);
        console.log(`       Has embedding: ${doc.embedding ? "YES" : "NO"}`);
      });
    }
    console.log();

    // Step 3: Test vector search
    console.log("Step 3: Testing vector similarity search...");
    const { data: matches, error: searchError } = await supabase.rpc(
      "match_knowledge_base",
      {
        query_embedding: queryEmbedding, // Pass array directly
        match_count: 10,
      }
    );

    if (searchError) {
      console.error("❌ Vector search error:", searchError);
      console.error("   Details:", JSON.stringify(searchError, null, 2));
      return;
    }

    console.log(`✅ Found ${matches?.length || 0} matches\n`);

    if (matches && matches.length > 0) {
      console.log("Top matches:");
      matches.forEach((match, idx) => {
        console.log(`\n[${idx + 1}] ${match.source.toUpperCase()}: "${match.title}"`);
        console.log(`   Similarity: ${match.similarity?.toFixed(4) || "N/A"}`);
        console.log(`   Content preview: ${match.content?.substring(0, 150) || "No content"}...`);
      });

      // Step 4: Analyze similarity scores
      console.log("\n" + "=".repeat(60));
      console.log("Similarity Score Analysis:");
      const similarities = matches.map(m => m.similarity || 0);
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const maxSimilarity = Math.max(...similarities);
      const minSimilarity = Math.min(...similarities);

      console.log(`   Max similarity: ${maxSimilarity.toFixed(4)}`);
      console.log(`   Min similarity: ${minSimilarity.toFixed(4)}`);
      console.log(`   Avg similarity: ${avgSimilarity.toFixed(4)}`);
      console.log(`   Matches > 0.5: ${similarities.filter(s => s > 0.5).length}`);
      console.log(`   Matches > 0.7: ${similarities.filter(s => s > 0.7).length}`);

      if (maxSimilarity < 0.5) {
        console.log("\n⚠️  WARNING: Low similarity scores detected!");
        console.log("   This might indicate:");
        console.log("   - Documents need better embeddings");
        console.log("   - Query doesn't match document content");
        console.log("   - Consider lowering similarity threshold");
      }
    } else {
      console.log("⚠️  No matches found!");
      console.log("   Possible issues:");
      console.log("   - No documents have embeddings");
      console.log("   - Vector dimension mismatch");
      console.log("   - RPC function not created correctly");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Test complete!");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.error("   Stack:", error.stack);
  }
}

testRAG();
