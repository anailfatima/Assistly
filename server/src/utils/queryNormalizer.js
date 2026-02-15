/**
 * Query Normalization Utility
 * 
 * Normalizes and preprocesses user queries for better matching
 */

/**
 * Normalize a query by:
 * - Trimming whitespace
 * - Converting to lowercase
 * - Removing extra spaces
 * - Handling common variations
 * @param {string} query - User query
 * @returns {string} Normalized query
 */
export function normalizeQuery(query) {
  if (!query || typeof query !== "string") {
    return "";
  }

  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[^\w\s?]/g, " ") // Remove special characters except spaces and question marks
    .trim();
}

/**
 * Extract key terms from a query
 * @param {string} query - User query
 * @returns {Array<string>} Array of key terms
 */
export function extractKeyTerms(query) {
  const normalized = normalizeQuery(query);
  const stopWords = new Set([
    "what", "where", "when", "who", "why", "how",
    "is", "are", "was", "were", "be", "been", "being",
    "the", "a", "an", "and", "or", "but", "if", "then",
    "do", "does", "did", "can", "could", "should", "would",
    "have", "has", "had", "will", "shall", "may", "might",
    "to", "from", "in", "on", "at", "by", "for", "with",
    "about", "into", "onto", "of", "off", "out", "up", "down"
  ]);

  return normalized
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Expand query with synonyms for better matching
 * @param {string} query - User query
 * @returns {string} Expanded query
 */
export function expandQueryWithSynonyms(query) {
  const synonymMap = {
    "hours": ["working hours", "work hours", "office hours", "business hours"],
    "leave": ["vacation", "time off", "holiday", "days off"],
    "sick": ["illness", "ill", "unwell", "medical"],
    "remote": ["work from home", "wfh", "telecommute", "telework"],
    "mfa": ["multi-factor authentication", "two-factor", "2fa"],
    "password": ["passcode", "credentials", "login"],
    "expense": ["reimbursement", "cost", "payment"],
    "customer": ["client", "user", "patron"],
    "complaint": ["issue", "problem", "concern", "grievance"],
    "escalate": ["forward", "transfer", "refer", "send"],
  };

  let expanded = query.toLowerCase();
  for (const [key, synonyms] of Object.entries(synonymMap)) {
    for (const synonym of synonyms) {
      if (expanded.includes(synonym)) {
        expanded += " " + key;
        break;
      }
      if (expanded.includes(key)) {
        expanded += " " + synonym;
        break;
      }
    }
  }

  return expanded;
}

export default {
  normalizeQuery,
  extractKeyTerms,
  expandQueryWithSynonyms,
};
