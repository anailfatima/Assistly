/**
 * Local Embeddings using @xenova/transformers
 *
 * This module provides local embedding generation using the Transformers.js library.
 * No external API calls needed - embeddings are generated entirely on the local machine.
 *
 * Usage:
 *   const { generateEmbedding } = require('./localEmbeddings.js');
 *   const embedding = await generateEmbedding("Your text here");
 *
 * Requirements:
 *   - @xenova/transformers package installed
 *   - Supabase vector column dimension must match the model's output (384 for all-MiniLM-L6-v2)
 */

import { pipeline, env } from "@xenova/transformers";

// Skip local model checks since we're in Node.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Model configuration
// Using all-MiniLM-L6-v2 which produces 384-dimensional embeddings
// This is a fast, lightweight model optimized for semantic search
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIMENSION = 384;

// Cache the embedding pipeline
let embeddingPipeline = null;

/**
 * Get or initialize the embedding pipeline
 * @returns {Promise<Object>} The feature-extraction pipeline
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log(`🔄 Loading local embedding model: ${MODEL_NAME}...`);
    embeddingPipeline = await pipeline("feature-extraction", MODEL_NAME, {
      quantized: true, // Use quantized model for smaller size
    });
    console.log(`✅ Local embedding model loaded successfully`);
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a given text using local transformers
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} Embedding array (384 dimensions)
 */
export async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Invalid text input for embedding generation");
    }

    console.log("🔄 Generating local embedding...");
    console.log(`   Text length: ${text.trim().length} characters`);
    console.log(`   Model: ${MODEL_NAME}`);

    const pipeline = await getEmbeddingPipeline();

    // Generate embedding - the pipeline returns a tensor
    const output = await pipeline(text, {
      pooling: "mean",
      normalize: true,
    });

    // Extract data from tensor and convert to regular array
    const embedding = Array.from(output.data);

    if (embedding.length !== EMBEDDING_DIMENSION) {
      console.warn(
        `⚠️  Embedding dimension mismatch: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`
      );
    }

    console.log(`✅ Generated embedding successfully`);
    console.log(`   Embedding dimension: ${embedding.length}`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).join(", ")}]`);

    return embedding;
  } catch (error) {
    console.error("❌ Error generating local embedding:", error.message);
    console.error("   Stack:", error.stack);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} Array of embeddings
 */
export async function generateEmbeddings(texts) {
  if (!Array.isArray(texts)) {
    throw new Error("Input must be an array of texts");
  }

  const pipeline = await getEmbeddingPipeline();
  const embeddings = [];

  for (const text of texts) {
    try {
      const output = await pipeline(text, {
        pooling: "mean",
        normalize: true,
      });
      const embedding = Array.from(output.data);
      embeddings.push(embedding);
    } catch (error) {
      console.error(
        `Failed to generate embedding for: ${text.substring(0, 50)}...`,
        error
      );
      embeddings.push(null);
    }
  }

  return embeddings;
}

/**
 * Split text into chunks for embedding
 * @param {string} text - Text to split
 * @param {number} maxChunkSize - Maximum characters per chunk (default: 800)
 * @returns {Array<string>} Array of text chunks
 */
export function splitIntoChunks(text, maxChunkSize = 800) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const chunks = [];
  const sentences = text.split(/[.!?]\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length + 2 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0 && text.trim().length > 0) {
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chunks.push(text.slice(i, i + maxChunkSize).trim());
    }
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Generate embeddings for multiple text chunks
 * @param {Array<string>} chunks - Array of text chunks
 * @returns {Promise<Array<Array<number>>>} Array of embeddings
 */
export async function generateEmbeddingsForChunks(chunks) {
  const embeddings = [];

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk);
      embeddings.push(embedding);
    } catch (error) {
      console.error(
        `Failed to generate embedding for chunk: ${chunk.substring(0, 50)}...`,
        error
      );
      embeddings.push(null);
    }
  }

  return embeddings;
}

/**
 * Get the embedding dimension for the current model
 * @returns {number} Embedding dimension
 */
export function getEmbeddingDimension() {
  return EMBEDDING_DIMENSION;
}

/**
 * Get the model name being used
 * @returns {string} Model name
 */
export function getModelName() {
  return MODEL_NAME;
}

/**
 * Convert embedding array to vector string format for Supabase
 * @param {Array<number>} embedding - Array of floats
 * @returns {string} Formatted vector string
 */
export function formatEmbeddingForVector(embedding) {
  if (!embedding || !Array.isArray(embedding)) {
    return null;
  }
  return `[${embedding.join(",")}]`;
}

export default {
  generateEmbedding,
  generateEmbeddings,
  generateEmbeddingsForChunks,
  splitIntoChunks,
  getEmbeddingDimension,
  getModelName,
  formatEmbeddingForVector,
};
