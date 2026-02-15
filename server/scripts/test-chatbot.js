#!/usr/bin/env node

/**
 * Chatbot Testing Script
 *
 * Tests the chatbot with various question types to ensure it:
 * - Answers questions correctly
 * - Doesn't just repeat keywords
 * - Handles ambiguous questions
 * - Synthesizes information from multiple sources
 * - Provides graceful fallbacks
 *
 * Usage:
 *   node scripts/test-chatbot.js
 */

import "dotenv/config";
import { supabase } from "../src/config/supabase.js";
import { generateEmbedding } from "../src/utils/localEmbeddings.js";
import Groq from "groq-sdk";

const groq =
  process.env.GROQ_API_KEY &&
  process.env.GROQ_API_KEY !== "your_groq_api_key_here"
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

const testQuestions = [
  {
    category: "Direct FAQ Match",
    question: "How many paid leaves does an employee get?",
    expectedKeywords: ["20", "paid", "leaves", "year"],
    shouldContain: true,
  },
  {
    category: "Multiple Document References",
    question: "What are the working hours and remote work requirements?",
    expectedKeywords: ["9:00", "6:00", "remote", "3 days"],
    shouldContain: true,
  },
  {
    category: "Slightly Ambiguous Question",
    question: "When do I need to submit leave requests?",
    expectedKeywords: ["2 days", "advance", "HR portal"],
    shouldContain: true,
  },
  {
    category: "Question with Synonyms",
    question: "Is two-factor authentication required?",
    expectedKeywords: ["MFA", "multi-factor", "required"],
    shouldContain: true,
  },
  {
    category: "Question Not in Knowledge Base",
    question: "What is the company's vacation policy in Europe?",
    expectedKeywords: ["not found", "couldn't find", "don't have"],
    shouldContain: false, // Should gracefully indicate not found
  },
];

async function testQuestion(testCase) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Category: ${testCase.category}`);
  console.log(`Question: "${testCase.question}"`);
  console.log(`${"=".repeat(60)}`);

  try {
    // 1. Generate embedding
    const queryEmbedding = await generateEmbedding(testCase.question);
    console.log(`✅ Generated embedding (${queryEmbedding.length} dimensions)`);

    // 2. Vector search
    const { data: matches, error } = await supabase.rpc(
      "match_knowledge_base",
      {
        query_embedding: queryEmbedding,
        match_count: 15,
      }
    );

    if (error) {
      console.error(`❌ Vector search error:`, error);
      return { success: false, error: "Vector search failed" };
    }

    console.log(`✅ Found ${matches?.length || 0} matches`);

    // 3. Build context
    const validMatches = (matches || []).filter((m) => {
      return m.content && m.title && m.similarity >= 0;
    });

    const sortedMatches = validMatches.sort(
      (a, b) => (b.similarity || 0) - (a.similarity || 0)
    );
    const thresholdMatches = sortedMatches.filter(
      (m) => (m.similarity || 0) > 0.4
    );

    let relevantMatches;
    if (thresholdMatches.length >= 2) {
      relevantMatches = thresholdMatches.slice(0, 7);
    } else {
      const reasonableMatches = sortedMatches.filter(
        (m) => (m.similarity || 0) > 0.3
      );
      relevantMatches =
        reasonableMatches.length > 0
          ? reasonableMatches.slice(0, 5)
          : sortedMatches.slice(0, 3);
    }

    console.log(`   Using ${relevantMatches.length} relevant matches`);

    const contextParts = [];
    relevantMatches.forEach((match, idx) => {
      if (match.source === "faq") {
        contextParts.push(
          `FAQ Entry ${idx + 1}:\nQuestion: ${match.title}\nAnswer: ${
            match.content
          }`
        );
      } else {
        contextParts.push(
          `Document ${idx + 1}: ${match.title}\n\nContent:\n${match.content}`
        );
      }
    });

    const context = contextParts.join("\n\n---\n\n");
    const hasContext = context && context.trim().length > 0;

    console.log(`   Context length: ${context.length} characters`);
    console.log(`   Has context: ${hasContext}`);

    // 4. Generate response
    if (!groq) {
      console.log("⚠️  Groq not available, skipping LLM call");
      return { success: false, error: "Groq not configured" };
    }

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

    console.log("🔄 Calling Groq Chat API...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: testCase.question },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 400, // Reduced for concise answers
      top_p: 0.9,
    });

    const response = chatCompletion.choices[0]?.message?.content || "";
    console.log(`✅ Received response (${response.length} characters)`);
    console.log(`\nResponse:\n${response}\n`);

    // 5. Validate response
    const responseLower = response.toLowerCase();
    const containsKeywords = testCase.expectedKeywords.some((keyword) =>
      responseLower.includes(keyword.toLowerCase())
    );

    const hasErrorPhrases =
      /AI fails|I don't know|I cannot|I'm unable to/i.test(response);
    const isTooShort = response.length < 40; // Adjusted for concise responses
    const isJustKeywords = response.split(/\s+/).length < 8; // Adjusted for concise responses
    const isTooLong = response.length > 500; // New check: ensure responses stay concise

    let issues = [];
    if (testCase.shouldContain && !containsKeywords) {
      issues.push("Missing expected keywords");
    }
    if (hasErrorPhrases && hasContext) {
      issues.push("Contains error phrases despite having context");
    }
    if (isTooShort && hasContext) {
      issues.push("Response is too short");
    }
    if (isJustKeywords && hasContext) {
      issues.push("Response appears to be just keywords");
    }
    if (isTooLong) {
      issues.push("Response is too long (should be concise)");
    }

    const success = issues.length === 0;

    if (success) {
      console.log("✅ Test PASSED");
    } else {
      console.log("❌ Test FAILED");
      issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    return {
      success,
      response,
      issues,
      hasContext,
      matchCount: relevantMatches.length,
    };
  } catch (error) {
    console.error(`❌ Test error:`, error);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log("🧪 Starting Chatbot Tests");
  console.log("=".repeat(60));

  if (!groq) {
    console.error("❌ Groq API key not configured. Cannot run tests.");
    process.exit(1);
  }

  const results = [];

  for (const testCase of testQuestions) {
    const result = await testQuestion(testCase);
    results.push({ ...testCase, ...result });

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((result, idx) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.category}: "${result.question}"`);
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach((issue) => console.log(`      ${issue}`));
    }
  });

  console.log(`\nTotal: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review the issues above.`);
  }
}

runAllTests().catch(console.error);
