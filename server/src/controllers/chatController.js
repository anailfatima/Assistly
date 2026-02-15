import { supabase } from "../config/supabase.js";
import Groq from "groq-sdk";
import { generateEmbedding } from "../utils/localEmbeddings.js";

// Initialize Groq only if API key is present
const groq =
  process.env.GROQ_API_KEY &&
  process.env.GROQ_API_KEY !== "your_groq_api_key_here"
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

if (!groq) {
  console.error(
    "❌ GROQ_API_KEY is missing in server .env file. AI chat will be unavailable."
  );
} else {
  console.log("✅ Groq client initialized for chat completions");
}

export const handleChat = async (req, res) => {
  try {
    const { message, user_id } = req.body;

    if (!message || !user_id) {
      return res
        .status(400)
        .json({ success: false, message: "Message and user_id are required" });
    }

    if (!groq) {
      return res.status(503).json({
        success: false,
        message:
          "AI service temporarily unavailable. System administrator needs to configure Groq API Link.",
      });
    }

    console.log("\n💬 === Chat Request Started ===");
    console.log(`   User ID: ${user_id}`);
    console.log(`   Message: ${message.substring(0, 100)}...`);

    // 1. Generate embedding for user query
    let queryEmbedding = null;
    try {
      console.log("🔄 Generating query embedding...");
      queryEmbedding = await generateEmbedding(message);

      if (queryEmbedding && Array.isArray(queryEmbedding)) {
        console.log(`✅ Generated query embedding`);
        console.log(`   Embedding dimension: ${queryEmbedding.length}`);
        console.log(
          `   First 5 values: [${queryEmbedding.slice(0, 5).join(", ")}]`
        );
      } else {
        throw new Error("Generated embedding is not a valid array");
      }
    } catch (embError) {
      console.error("❌ Error generating query embedding:", embError.message);
      return res.status(500).json({
        success: false,
        message:
          "Failed to process query. Please ensure Groq API key is configured and has sufficient credits.",
      });
    }

    // 2. Perform vector similarity search using Supabase RPC
    let matches = [];
    try {
      console.log("🔄 Performing vector similarity search...");
      console.log(`   Query embedding type: ${typeof queryEmbedding}`);
      console.log(`   Query embedding length: ${queryEmbedding?.length}`);
      console.log(
        `   First 5 values: [${queryEmbedding.slice(0, 5).join(", ")}]`
      );

      // Supabase RPC accepts array directly - it will convert to vector type
      // The RPC function signature expects vector(384), and Supabase JS client handles conversion
      // Increase match_count to get more candidates for better context
      const { data, error } = await supabase.rpc("match_knowledge_base", {
        query_embedding: queryEmbedding, // Pass array directly
        match_count: 15, // Increased from 10 to get more potential matches
      });

      if (error) {
        console.error("❌ Vector search error:", error);
        console.error("   Error details:", JSON.stringify(error, null, 2));
        matches = [];
      } else {
        matches = data || [];
        console.log(
          `✅ Found ${matches.length} relevant matches via vector search`
        );

        if (matches.length > 0) {
          matches.forEach((match, idx) => {
            console.log(
              `   [${idx + 1}] ${match.source}: "${
                match.title?.substring(0, 50) || "No title"
              }" (similarity: ${match.similarity?.toFixed(3) || "N/A"})`
            );
            console.log(
              `       Content preview: ${
                match.content?.substring(0, 100) || "No content"
              }...`
            );
          });
        } else {
          console.log(
            "⚠️  No matches found - checking if documents have embeddings..."
          );
          // Debug: Check if any documents have embeddings
          const { data: docCheck } = await supabase
            .from("docs")
            .select("id, title, embedding")
            .not("embedding", "is", null)
            .limit(1);
          console.log(`   Documents with embeddings: ${docCheck?.length || 0}`);
        }
      }
    } catch (rpcError) {
      console.error("❌ RPC call error:", rpcError);
      console.error("   Stack:", rpcError.stack);
      matches = [];
    }

    // 3. Build context from matches
    let contextParts = [];

    if (matches && matches.length > 0) {
      // Filter out invalid matches (null similarity, negative, or missing content)
      const validMatches = matches.filter((m) => {
        const hasContent = m.content && m.content.trim().length > 0;
        const hasTitle = m.title && m.title.trim().length > 0;
        const validSimilarity =
          m.similarity !== null &&
          m.similarity !== undefined &&
          m.similarity >= 0;
        return hasContent && hasTitle && validSimilarity;
      });

      if (validMatches.length === 0) {
        console.log(
          "⚠️  All matches were invalid (missing content or negative similarity)"
        );
      } else {
        // Sort by similarity (highest first)
        const sortedMatches = validMatches.sort(
          (a, b) => (b.similarity || 0) - (a.similarity || 0)
        );

        // Log all matches for debugging
        console.log(`   Valid matches: ${sortedMatches.length}`);
        sortedMatches.forEach((match, idx) => {
          console.log(
            `   [${idx + 1}] "${match.title?.substring(0, 50)}" - similarity: ${
              match.similarity?.toFixed(4) || "N/A"
            }`
          );
        });

        // Lower threshold slightly for local embeddings (0.4 instead of 0.5)
        // This helps catch more relevant information that might have slightly lower similarity
        const thresholdMatches = sortedMatches.filter(
          (m) => (m.similarity || 0) > 0.4
        );

        // Use threshold matches if we have at least 2, otherwise use top matches
        // Increase number of matches used for better context (up to 7)
        let relevantMatches;
        if (thresholdMatches.length >= 2) {
          relevantMatches = thresholdMatches.slice(0, 7); // Increased from 5 to 7
          console.log(
            `   Using ${relevantMatches.length} threshold matches (similarity > 0.4)`
          );
        } else {
          // Fallback: use top matches even if similarity is low (but still reasonable)
          // Only use matches with similarity > 0.3 to avoid completely irrelevant content
          const reasonableMatches = sortedMatches.filter(
            (m) => (m.similarity || 0) > 0.3
          );
          relevantMatches =
            reasonableMatches.length > 0
              ? reasonableMatches.slice(
                  0,
                  Math.max(3, Math.min(5, reasonableMatches.length))
                )
              : sortedMatches.slice(0, 3); // Last resort: top 3 even if similarity is very low
          console.log(
            `   Using ${relevantMatches.length} top matches (fallback - similarity may be low)`
          );
        }

        // Build context from relevant matches with better formatting
        if (relevantMatches.length > 0) {
          relevantMatches.forEach((match, idx) => {
            const similarity = match.similarity?.toFixed(4) || "N/A";
            console.log(
              `   [${idx + 1}] Adding to context: "${match.title?.substring(
                0,
                50
              )}" (similarity: ${similarity})`
            );

            // Format context more clearly for better LLM understanding
            if (match.source === "faq") {
              contextParts.push(
                `FAQ Entry ${idx + 1}:\nQuestion: ${match.title}\nAnswer: ${
                  match.content
                }`
              );
            } else {
              contextParts.push(
                `Document ${idx + 1}: ${match.title}\n\nContent:\n${
                  match.content
                }`
              );
            }
          });

          // Add a summary instruction at the end
          if (relevantMatches.length > 1) {
            contextParts.push(
              `\nNote: The above information comes from ${relevantMatches.length} different sources. Please synthesize this information to provide a comprehensive answer to the user's question.`
            );
          }
        }
      }
    } else {
      console.log("⚠️  No matches returned from vector search");
    }

    // Combine context and ensure it's under token limit
    let context = contextParts.join("\n\n---\n\n");

    // Increase context limit for better answers (allow more context)
    const maxContextLength = 6000; // Increased from 4000 for more complete context
    if (context.length > maxContextLength) {
      // Try to keep complete documents rather than truncating mid-sentence
      const truncated = context.substring(0, maxContextLength);
      const lastDocEnd = truncated.lastIndexOf("\n---\n");
      if (lastDocEnd > maxContextLength * 0.7) {
        context =
          truncated.substring(0, lastDocEnd) +
          "\n\n[Additional context truncated for length]";
      } else {
        context = truncated + "... [Context truncated]";
      }
    }

    console.log(`   Context length: ${context.length} characters`);
    console.log(`   Context preview: ${context.substring(0, 200)}...`);

    // 4. Preprocess user query for better matching
    const normalizedQuery = message.trim().toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 2);

    // 5. Construct AI Prompt with improved instructions
    const hasContext = context && context.trim().length > 0;

    if (!hasContext) {
      console.log(
        "⚠️  No context available - will inform user that information was not found"
      );
    }

    // Enhanced system prompt for CONCISE, customer-friendly responses
    const systemPrompt = `You are a friendly, professional support assistant for Assistly. Your goal is to provide quick, easy-to-read answers to customers.

RESPONSE STYLE GUIDELINES:
1. Keep answers CONCISE: 2-4 sentences maximum.
2. Use bullet points ONLY when listing multiple rules/steps (max 4-5 bullets).
3. Otherwise, prefer short paragraphs over bullet lists.
4. Always include all critical information needed to answer the question.
5. If referencing multiple policies, SUMMARIZE the rules clearly - do NOT copy full paragraphs.
6. Write in a friendly, conversational tone as if helping a colleague.
7. Never make up information not in the context.

OPTIONAL REFERENCE:
- Add a "Learn more" or "See Section X" line at the end only if helpful.
- Example: "See Section 4 of the company policy for details."

${
  hasContext
    ? `KNOWLEDGE BASE CONTEXT:
${context}

Provide a concise, friendly answer (2-4 sentences). Use bullets only if listing multiple items.`
    : `No relevant information was found in the knowledge base. 

Politely say: "I couldn't find specific information about that in our knowledge base. Could you please rephrase your question or contact support for assistance?"`
}`;

    let aiResponse = "";

    // 6. Groq API Call for Chat Completion with improved parameters
    try {
      console.log("🔄 Calling Groq Chat API...");
      console.log(`   Has context: ${hasContext}`);
      console.log(`   Context length: ${context.length} characters`);

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2, // Slightly higher for more natural responses
        max_tokens: 400, // Reduced for concise answers (2-4 sentences)
        top_p: 0.9,
      });

      aiResponse = chatCompletion.choices[0]?.message?.content || "";

      // Post-process response to ensure quality
      if (!aiResponse || aiResponse.trim().length === 0) {
        console.log("⚠️  Empty response from LLM, using fallback");
        aiResponse = hasContext
          ? "I found relevant information in our knowledge base, but I'm having trouble formulating a response. Please try rephrasing your question."
          : "I couldn't find specific information about that in our knowledge base. Could you please rephrase your question or contact support for assistance?";
      } else {
        // Clean up common issues
        aiResponse = aiResponse.trim();

        // Remove common error phrases and replace with helpful messages
        const errorPhrases = [
          /AI fails/i,
          /I don't know/i,
          /I cannot/i,
          /I'm unable to/i,
        ];

        // Only replace if context exists (meaning answer should be possible)
        if (hasContext) {
          for (const phrase of errorPhrases) {
            if (phrase.test(aiResponse)) {
              console.log(
                "⚠️  Detected error phrase in response, attempting to improve"
              );
              // Check if response is too short (likely incomplete)
              if (aiResponse.length < 50) {
                aiResponse =
                  "Based on the available information, I need more context to provide a complete answer. Could you please rephrase your question?";
              }
            }
          }
        }

        // Ensure response isn't just keywords
        const responseWords = aiResponse.toLowerCase().split(/\s+/);
        const queryWordsLower = queryWords.map((w) => w.toLowerCase());
        const matchingWords = responseWords.filter((w) =>
          queryWordsLower.includes(w)
        );

        // If response is mostly just query keywords, it's likely incomplete
        if (
          matchingWords.length > responseWords.length * 0.5 &&
          responseWords.length < 20
        ) {
          console.log(
            "⚠️  Response appears to be mostly keywords, may need improvement"
          );
          // Don't replace, but log for monitoring
        }
      }

      console.log("✅ Received response from Groq Chat API");
      console.log(`   Response length: ${aiResponse.length} characters`);
      console.log(`   Response preview: ${aiResponse.substring(0, 150)}...`);
    } catch (groqErr) {
      console.error("❌ Groq Chat Service Error:", groqErr);
      console.error("   Error details:", JSON.stringify(groqErr, null, 2));

      // Provide helpful fallback based on context availability
      aiResponse = hasContext
        ? "I found relevant information in our knowledge base, but I'm experiencing a technical issue. Please try asking your question again, or contact support for assistance."
        : "I couldn't find specific information about that in our knowledge base. Could you please rephrase your question or contact support for assistance?";

      // Don't return error - continue with fallback response
      console.log("⚠️  Using fallback response due to API error");
    }

    // 7. Save Chat History
    const { data: savedChats, error: saveError } = await supabase
      .from("chats")
      .insert([
        { user_id, message, sender: "user" },
        { user_id, message: aiResponse, sender: "bot" },
      ])
      .select();

    if (saveError) {
      console.error("❌ Error saving chat history to Supabase:", saveError);
    } else {
      console.log("✅ Chat history saved to database");
    }

    // Return the bot's response with ID
    const botMsg = savedChats?.find((c) => c.sender === "bot");
    const userMsg = savedChats?.find((c) => c.sender === "user");

    console.log("=== Chat Request Complete ===\n");

    return res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        sender: "bot",
        timestamp: new Date().toISOString(),
        id: botMsg?.id,
        userMessageId: userMsg?.id,
      },
      answer: aiResponse,
    });
  } catch (globalError) {
    console.error("❌ Global Chat Controller Error:", globalError);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing chat",
    });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { user_id, include_deleted } = req.query;
    const { role, id: authUserId } = req.user;

    if (!authUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let query = supabase
      .from("chats")
      .select("*")
      .order("created_at", { ascending: true });

    if (role === "admin") {
      if (include_deleted !== "true") {
        query = query.eq("is_removed", false);
      }

      if (user_id) {
        query = query.eq("user_id", user_id);
      }
    } else {
      query = query.eq("user_id", authUserId);

      if (include_deleted !== "true") {
        query = query.eq("is_removed", false);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Get History Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const deleteChats = async (req, res) => {
  try {
    const { role, id: authUserId } = req.user;
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid chat IDs" });
    }

    const updateData = { is_removed: true };

    let query = supabase.from("chats").update(updateData).in("id", chatIds);

    if (role !== "admin") {
      query = query.eq("user_id", authUserId);
    }

    const { error } = await query;

    if (error) {
      console.error("Delete Chats Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete chats" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Chats moved to trash" });
  } catch (error) {
    console.error("Delete Chats Exception:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const restoreChats = async (req, res) => {
  try {
    const { role, id: authUserId } = req.user;
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid chat IDs" });
    }

    let query = supabase
      .from("chats")
      .update({ is_removed: false })
      .in("id", chatIds);

    if (role !== "admin") {
      query = query.eq("user_id", authUserId);
    }

    const { error } = await query;

    if (error) {
      console.error("Restore Chats Error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to restore chats" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Chats removed from trash" });
  } catch (error) {
    console.error("Restore Chats Exception:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteChatsPermanently = async (req, res) => {
  try {
    const { role, id: authUserId } = req.user;
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid chat IDs" });
    }

    let query = supabase.from("chats").delete().in("id", chatIds);

    if (role !== "admin") {
      query = query.eq("user_id", authUserId);
    }

    const { error } = await query;

    if (error) {
      console.error("Perm Delete Chats Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to permanently delete chats",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Chats permanently deleted" });
  } catch (error) {
    console.error("Perm Delete Chats Exception:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
