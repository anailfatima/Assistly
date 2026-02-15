import Groq from "groq-sdk";

// Initialize Groq client
const groq =
  process.env.GROQ_API_KEY &&
  process.env.GROQ_API_KEY !== "your_groq_api_key_here"
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

if (!groq) {
  console.error(
    "❌ GROQ_API_KEY is missing. Embedding generation will be unavailable."
  );
} else {
  console.log("✅ Groq client initialized for embeddings");
}

// Groq embedding model - using compound-mini which is a valid Groq model
// Note: Different models have different dimensions. Update DB schema if needed.
const GROQ_EMBEDDING_MODEL = "groq/compound-mini";
// Default dimension for compound-mini is 1024. Change to match your DB vector size.
const EMBEDDING_DIMENSION = 1024;

/**
 * Generate embedding for a given text using Groq's embedding model
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} Embedding array
 */
export async function generateEmbedding(text) {
  try {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Invalid text input for embedding generation");
    }

    // Check if Groq client is available
    if (!groq) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    console.log("🔄 Calling Groq Embeddings API...");
    console.log(`   Text length: ${text.trim().length} characters`);
    console.log(`   Model: ${GROQ_EMBEDDING_MODEL}`);

    // Make API call to Groq for embeddings
    const response = await groq.embeddings.create({
      model: GROQ_EMBEDDING_MODEL,
      input: text.trim(),
    });

    console.log("📥 Groq Embeddings Response received");
    console.log("   Response type:", typeof response);
    console.log("   Response keys:", response ? Object.keys(response) : "N/A");

    // Handle different response formats
    let embedding = null;

    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      embedding = response.data[0].embedding;
    } else if (response.embedding) {
      // Alternative response format
      embedding = response.embedding;
    } else if (Array.isArray(response)) {
      // Another possible format
      embedding = response[0]?.embedding;
    }

    if (!embedding || !Array.isArray(embedding)) {
      console.error("❌ Invalid embedding format:", {
        hasData: !!response.data,
        hasEmbedding: !!response.embedding,
        responseStructure: JSON.stringify(response, null, 2).substring(0, 500),
      });
      throw new Error(
        "Invalid response from Groq Embeddings API - no embedding found"
      );
    }

    console.log(`✅ Generated embedding successfully`);
    console.log(`   Embedding length: ${embedding.length}`);
    console.log(`   First 5 values: [${embedding.slice(0, 5).join(", ")}]`);

    return embedding;
  } catch (error) {
    console.error("❌ Error generating embedding:", error.message);
    if (error.response) {
      console.error("   Response:", JSON.stringify(error.response.data));
    }
    console.error("   Stack:", error.stack);
    throw error;
  }
}

/**
 * Get the embedding dimension used by the current model
 * @returns {number} Embedding dimension
 */
export function getEmbeddingDimension() {
  return EMBEDDING_DIMENSION;
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
      await new Promise((resolve) => setTimeout(resolve, 100));
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
