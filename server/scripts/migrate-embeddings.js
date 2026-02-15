
#!/usr/bin/env node

/**
 * Bulk Embedding Migration Script
 *
 * This script migrates existing documents and FAQs by generating
 * embeddings for content that doesn't have them yet using local embeddings.
 *
 * Usage:
 *   node migrate-embeddings.js
 *
 * Requirements:
 *   - @xenova/transformers package installed
 *   - Database must have embedding columns (run update_vector_dimension_local.sql first)
 *   - RPC functions must exist (run update_vector_dimension_local.sql)
 */

import "dotenv/config";
import { supabase } from "../src/config/supabase.js";
import { generateEmbedding, formatEmbeddingForVector } from "../src/utils/localEmbeddings.js";

// Configuration
const RATE_LIMIT_DELAY = 100; // ms between embedding generations (local, so faster)
const MAX_CONTENT_LENGTH = 8000; // chars

// Statistics
let stats = {
  docs: { total: 0, migrated: 0, failed: 0, skipped: 0 },
  faqs: { total: 0, migrated: 0, failed: 0, skipped: 0 },
};

/**
 * Migrate documents
 */
async function migrateDocuments() {
  console.log("\n📄 Migrating Documents...\n");

  // Get all docs without embeddings that have content
  const { data: docs, error } = await supabase
    .from("docs")
    .select("*")
    .is("embedding", null)
    .not("content", "is", null);

  if (error) {
    console.error("❌ Error fetching documents:", error);
    return;
  }

  stats.docs.total = docs.length;
  console.log(`Found ${docs.length} documents to migrate\n`);

  if (docs.length === 0) {
    console.log("✅ No documents need migration\n");
    return;
  }

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const progress = `[${i + 1}/${docs.length}]`;

    try {
      // Skip if content is empty
      if (!doc.content || doc.content.trim().length === 0) {
        console.log(`${progress} ⏭️  Skipped: ${doc.title} (no content)`);
        stats.docs.skipped++;
        continue;
      }

      // Truncate content if too long
      const textForEmbedding =
        doc.content.length > MAX_CONTENT_LENGTH
          ? doc.content.substring(0, MAX_CONTENT_LENGTH)
          : doc.content;

      // Generate embedding
      const embedding = await generateEmbedding(textForEmbedding);
      
      if (!embedding || !Array.isArray(embedding)) {
        console.log(`${progress} ❌ Failed: ${doc.title} (invalid embedding)`);
        stats.docs.failed++;
        continue;
      }

      // Convert to vector string format
      const embeddingStr = formatEmbeddingForVector(embedding);

      // Update database using RPC for proper vector casting
      const { error: updateError } = await supabase.rpc(
        "update_doc_embedding",
        {
          p_id: doc.id,
          p_embedding: embeddingStr,
        }
      );

      if (updateError) {
        console.error(`   RPC Error, trying direct update: ${updateError.message}`);
        // Fallback: try direct update with string (let Supabase handle casting)
        const { error: fallbackError } = await supabase
          .from("docs")
          .update({ embedding: embeddingStr })
          .eq("id", doc.id);
        
        if (fallbackError) {
          throw fallbackError;
        }
      }

      console.log(`${progress} ✅ Migrated: ${doc.title}`);
      stats.docs.migrated++;

      // Rate limiting
      if (i < docs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    } catch (error) {
      console.error(`${progress} ❌ Failed: ${doc.title}`);
      console.error(`   Error: ${error.message}`);
      stats.docs.failed++;
    }
  }

  console.log("\n📊 Documents Migration Summary:");
  console.log(`   Total: ${stats.docs.total}`);
  console.log(`   ✅ Migrated: ${stats.docs.migrated}`);
  console.log(`   ❌ Failed: ${stats.docs.failed}`);
  console.log(`   ⏭️  Skipped: ${stats.docs.skipped}`);
}

/**
 * Migrate FAQs
 */
async function migrateFAQs() {
  console.log("\n❓ Migrating FAQs...\n");

  // Get all FAQs without embeddings
  const { data: faqs, error } = await supabase
    .from("faqs")
    .select("*")
    .is("embedding", null);

  if (error) {
    console.error("❌ Error fetching FAQs:", error);
    return;
  }

  stats.faqs.total = faqs.length;
  console.log(`Found ${faqs.length} FAQs to migrate\n`);

  if (faqs.length === 0) {
    console.log("✅ No FAQs need migration\n");
    return;
  }

  for (let i = 0; i < faqs.length; i++) {
    const faq = faqs[i];
    const progress = `[${i + 1}/${faqs.length}]`;

    try {
      // Combine question and answer
      const textForEmbedding = `${faq.question}\n${faq.answer}`;

      // Generate embedding
      const embedding = await generateEmbedding(textForEmbedding);
      
      if (!embedding || !Array.isArray(embedding)) {
        console.log(`${progress} ❌ Failed: ${faq.question.substring(0, 50)} (invalid embedding)`);
        stats.faqs.failed++;
        continue;
      }

      // Convert to vector string format
      const embeddingStr = formatEmbeddingForVector(embedding);

      // Update database using RPC for proper vector casting
      const { error: updateError } = await supabase.rpc(
        "update_faq_embedding",
        {
          p_id: faq.id,
          p_embedding: embeddingStr,
        }
      );

      if (updateError) {
        console.error(`   RPC Error, trying direct update: ${updateError.message}`);
        // Fallback: try direct update with string
        const { error: fallbackError } = await supabase
          .from("faqs")
          .update({ embedding: embeddingStr })
          .eq("id", faq.id);
        
        if (fallbackError) {
          throw fallbackError;
        }
      }

      const preview = faq.question.substring(0, 60);
      console.log(
        `${progress} ✅ Migrated: ${preview}${
          faq.question.length > 60 ? "..." : ""
        }`
      );
      stats.faqs.migrated++;

      // Rate limiting
      if (i < faqs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    } catch (error) {
      const preview = faq.question.substring(0, 60);
      console.error(
        `${progress} ❌ Failed: ${preview}${
          faq.question.length > 60 ? "..." : ""
        }`
      );
      console.error(`   Error: ${error.message}`);
      stats.faqs.failed++;
    }
  }

  console.log("\n📊 FAQs Migration Summary:");
  console.log(`   Total: ${stats.faqs.total}`);
  console.log(`   ✅ Migrated: ${stats.faqs.migrated}`);
  console.log(`   ❌ Failed: ${stats.faqs.failed}`);
  console.log(`   ⏭️  Skipped: ${stats.faqs.skipped}`);
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting Local Embedding Migration...");
  console.log("=".repeat(50));
  console.log("Using local embeddings (no API keys required)");
  console.log("=".repeat(50));

  const startTime = Date.now();

  try {
    // Migrate documents
    await migrateDocuments();

    // Migrate FAQs
    await migrateFAQs();

    // Final summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalMigrated = stats.docs.migrated + stats.faqs.migrated;
    const totalFailed = stats.docs.failed + stats.faqs.failed;

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Migration Complete!");
    console.log("=".repeat(50));
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`✅ Total Migrated: ${totalMigrated}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log("=".repeat(50));

    if (totalFailed > 0) {
      console.log(
        "\n⚠️  Some items failed to migrate. Check the errors above."
      );
      console.log("You can re-run this script to retry failed items.\n");
    } else if (totalMigrated > 0) {
      console.log("\n✅ All items migrated successfully!");
      console.log("Your knowledge base is now ready for vector search.\n");
    } else {
      console.log("\n✅ No items needed migration.");
      console.log("Your knowledge base is already up to date.\n");
    }
  } catch (error) {
    console.error("\n❌ Fatal error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
main();

