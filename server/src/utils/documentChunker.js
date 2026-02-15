/**
 * Document Chunking Utility
 * 
 * Splits documents into smaller chunks for better embedding and retrieval.
 * Each chunk is embedded separately, allowing more precise similarity matching.
 */

import { splitIntoChunks } from "./localEmbeddings.js";

/**
 * Chunk a document into smaller pieces for embedding
 * @param {string} content - Document content
 * @param {number} chunkSize - Maximum characters per chunk (default: 500)
 * @param {number} overlap - Characters to overlap between chunks (default: 50)
 * @returns {Array<{text: string, index: number}>} Array of chunks with metadata
 */
export function chunkDocument(content, chunkSize = 500, overlap = 50) {
  if (!content || typeof content !== "string") {
    return [];
  }

  const chunks = [];
  const sentences = content.split(/[.!?]\s+/);
  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // If adding this sentence would exceed chunk size, save current chunk
    if (currentChunk.length + trimmedSentence.length + 2 > chunkSize) {
      if (currentChunk) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex++,
        });
      }
      
      // Start new chunk with overlap from previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText ? `${overlapText} ${trimmedSentence}` : trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex++,
    });
  }

  // Fallback: if no sentences found, split by character
  if (chunks.length === 0 && content.trim().length > 0) {
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunkText = content.slice(i, i + chunkSize).trim();
      if (chunkText) {
        chunks.push({
          text: chunkText,
          index: chunkIndex++,
        });
      }
    }
  }

  return chunks.filter((chunk) => chunk.text.length > 0);
}

/**
 * Format chunk for storage/display
 * @param {Object} chunk - Chunk object with text and index
 * @param {string} documentTitle - Title of the parent document
 * @returns {string} Formatted chunk text
 */
export function formatChunk(chunk, documentTitle = "") {
  return `[Chunk ${chunk.index + 1}${documentTitle ? ` from "${documentTitle}"` : ""}]\n${chunk.text}`;
}

export default {
  chunkDocument,
  formatChunk,
};
