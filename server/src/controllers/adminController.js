import { supabase } from "../config/supabase.js";
import { generateEmbedding, formatEmbeddingForVector } from "../utils/localEmbeddings.js";
import { chunkDocument } from "../utils/documentChunker.js";

// formatEmbeddingForVector is now imported from localEmbeddings.js

export const uploadDoc = async (req, res) => {
  try {
    const file = req.file;
    const { title, description, uploader_id, category } = req.body;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    console.log("\n📄 === Document Upload Started ===");
    console.log(`   File: ${file.originalname}`);
    console.log(`   Type: ${file.mimetype}`);
    console.log(`   Size: ${file.size} bytes`);

    // 1. Upload to Supabase Storage
    const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from("docs")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (storageError) {
      console.error("Storage Error:", storageError);
      return res.status(500).json({
        success: false,
        message:
          'Storage upload failed. Ensure "docs" bucket exists in Supabase.',
      });
    }

    console.log("✅ File uploaded to Supabase Storage");

    // 2. Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("docs").getPublicUrl(fileName);

    // 3. Extract content for RAG if it's a TXT file
    let content = null;
    if (file.mimetype === "text/plain") {
      content = file.buffer.toString("utf8");
      console.log(`   Extracted text content: ${content.length} characters`);
    }

    // 4. Generate embedding for the content (if available)
    // For better retrieval, we'll use the full content but chunk it if it's very long
    let embedding = null;
    let embeddingStr = null;
    if (content && content.trim().length > 0) {
      try {
        // For documents > 2000 chars, use first 2000 chars for main embedding
        // In future, we can implement multi-chunk storage, but for now use a representative chunk
        let textForEmbedding = content.trim();
        
        if (textForEmbedding.length > 2000) {
          // Use first 2000 chars + last 200 chars for better representation
          textForEmbedding = textForEmbedding.substring(0, 2000) + 
            "\n\n" + textForEmbedding.substring(textForEmbedding.length - 200);
          console.log(`   Document is long (${content.length} chars), using representative sample`);
        }

        console.log("🔄 Generating embedding for document...");
        console.log(`   Text length for embedding: ${textForEmbedding.length} characters`);
        embedding = await generateEmbedding(textForEmbedding);

        if (embedding && Array.isArray(embedding)) {
          // Convert to vector string format for Supabase
          embeddingStr = formatEmbeddingForVector(embedding);
          console.log(
            `✅ Generated embedding for document: ${title || file.originalname}`
          );
          console.log(`   Embedding dimension: ${embedding.length}`);
          console.log(
            `   First 5 values: [${embedding.slice(0, 5).join(", ")}]`
          );
          console.log(`   Embedding string length: ${embeddingStr.length}`);
        } else {
          console.error("❌ Embedding is not a valid array");
          embedding = null;
        }
      } catch (embError) {
        console.error(
          "❌ Failed to generate embedding for document:",
          embError.message
        );
        console.error("   Stack:", embError.stack);
        embedding = null;
      }
    } else {
      console.log("⚠️ No content available for embedding generation");
    }

    // 5. Save to Database with embedding (using RPC for vector casting)
    let data, error;

    if (embedding && embeddingStr) {
      console.log("📝 Inserting document with embedding using RPC...");

      // Use RPC to properly cast the vector
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "insert_doc_with_embedding",
        {
          p_title: title || file.originalname,
          p_description: description,
          p_file_url: publicUrl,
          p_file_type: file.originalname.split(".").pop().toUpperCase(),
          p_uploader_id: uploader_id,
          p_content: content,
          p_category: category || "Other",
          p_embedding: embeddingStr,
        }
      );

      if (rpcError) {
        console.error("❌ RPC insert error:", rpcError);
        // Fall back to regular insert without embedding
        console.log("📝 Falling back to regular insert without embedding...");
      } else {
        console.log("✅ Document inserted via RPC with embedding");

        // Fetch the inserted document to get full data
        const { data: fetchedData, error: fetchError } = await supabase
          .from("docs")
          .select("*")
          .eq("id", rpcData)
          .single();

        data = fetchedData;
        error = fetchError;
      }
    }

    // Fallback: Regular insert if RPC failed or no embedding
    if (!data) {
      console.log("📝 Inserting document with regular insert...");

      const insertPayload = {
        title: title || file.originalname,
        description,
        file_url: publicUrl,
        file_type: file.originalname.split(".").pop().toUpperCase(),
        uploader_id,
        content,
        category: category || "Other",
      };

      console.log("   Insert payload keys:", Object.keys(insertPayload));

      const result = await supabase
        .from("docs")
        .insert([insertPayload])
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("❌ Database insert error:", error);
      throw error;
    }

    console.log("✅ Document saved to database");
    console.log("   Document ID:", data.id);
    console.log("   Has embedding:", data.embedding ? "YES" : "NO");
    if (data.embedding) {
      console.log(
        "   Embedding sample:",
        Array.isArray(data.embedding)
          ? `[${data.embedding.slice(0, 5).join(", ")}...]`
          : data.embedding
      );
    }
    console.log("=== Document Upload Complete ===\n");

    res.status(201).json({
      success: true,
      message:
        "Document uploaded successfully" +
        (data.embedding ? " with vector embedding" : ""),
      data,
    });
  } catch (error) {
    console.error("❌ Upload Doc Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to upload document" });
  }
};

export const getDocs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("docs")
      .select("*, uploader:uploader_id(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const { data, error } = await supabase
      .from("docs")
      .update({ title, description })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "Document updated successfully", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("docs").delete().eq("id", id);

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChats = async (req, res) => {
  try {
    const { include_deleted } = req.query;

    let query = supabase
      .from("chats")
      .select("*, user:user_id(name, email)")
      .order("created_at", { ascending: false });

    if (include_deleted !== "true") {
      query = query.eq("is_removed", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addFaq = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    console.log("\n❓ === FAQ Add Started ===");
    console.log(`   Question: ${question.substring(0, 50)}...`);
    console.log(`   Answer length: ${answer.length} characters`);

    // Generate embedding from question + answer
    let embedding = null;
    let embeddingStr = null;
    try {
      const textForEmbedding = `${question}\n${answer}`;
      console.log("🔄 Generating embedding for FAQ...");

      embedding = await generateEmbedding(textForEmbedding);

      if (embedding && Array.isArray(embedding)) {
        // Convert to vector string format for Supabase
        embeddingStr = formatEmbeddingForVector(embedding);
        console.log(`✅ Generated embedding for FAQ`);
        console.log(`   Embedding dimension: ${embedding.length}`);
        console.log(`   First 5 values: [${embedding.slice(0, 5).join(", ")}]`);
        console.log(`   Embedding string length: ${embeddingStr.length}`);
      } else {
        console.error("❌ Embedding is not a valid array");
        embedding = null;
      }
    } catch (embError) {
      console.error(
        "❌ Failed to generate embedding for FAQ:",
        embError.message
      );
      embedding = null;
    }

    // Save to Database with embedding (using RPC for vector casting)
    let data, error;

    if (embedding && embeddingStr) {
      console.log("📝 Inserting FAQ with embedding using RPC...");

      // Use RPC to properly cast the vector
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "insert_faq_with_embedding",
        {
          p_question: question,
          p_answer: answer,
          p_embedding: embeddingStr,
        }
      );

      if (rpcError) {
        console.error("❌ RPC insert error:", rpcError);
        // Fall back to regular insert without embedding
        console.log("📝 Falling back to regular insert without embedding...");
      } else {
        console.log("✅ FAQ inserted via RPC with embedding");

        // Fetch the inserted FAQ to get full data
        const { data: fetchedData, error: fetchError } = await supabase
          .from("faqs")
          .select("*")
          .eq("id", rpcData)
          .single();

        data = fetchedData;
        error = fetchError;
      }
    }

    // Fallback: Regular insert if RPC failed or no embedding
    if (!data) {
      console.log("📝 Inserting FAQ with regular insert...");

      const insertPayload = {
        question,
        answer,
      };

      const result = await supabase
        .from("faqs")
        .insert([insertPayload])
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("❌ Database insert error:", error);
      throw error;
    }

    console.log("✅ FAQ saved to database");
    console.log("   FAQ ID:", data.id);
    console.log("   Has embedding:", data.embedding ? "YES" : "NO");
    if (data.embedding) {
      console.log(
        "   Embedding sample:",
        Array.isArray(data.embedding)
          ? `[${data.embedding.slice(0, 5).join(", ")}...]`
          : data.embedding
      );
    }
    console.log("=== FAQ Add Complete ===\n");

    res.status(201).json({
      success: true,
      message:
        "FAQ added successfully" +
        (data.embedding ? " with vector embedding" : ""),
      data,
    });
  } catch (error) {
    console.error("❌ Add FAQ Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("faqs").delete().eq("id", id);

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const [usersCount, adminCount, docsCount, chatsCount, faqsCount] =
      await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin"),
        supabase.from("docs").select("*", { count: "exact", head: true }),
        supabase
          .from("chats")
          .select("*", { count: "exact", head: true })
          .eq("sender", "user")
          .eq("is_removed", false),
        supabase.from("faqs").select("*", { count: "exact", head: true }),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersCount.count || 0,
        adminCount: adminCount.count || 0,
        totalDocs: docsCount.count || 0,
        totalChats: chatsCount.count || 0,
        totalFaqs: faqsCount.count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("chats")
      .update({ is_removed: true })
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ success: true, message: "Chat moved to trash" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteChats = async (req, res) => {
  try {
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const { error } = await supabase
      .from("chats")
      .update({ is_removed: true })
      .in("id", chatIds);

    if (error) throw error;

    res.status(200).json({ success: true, message: "Chats moved to trash" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restoreChats = async (req, res) => {
  try {
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const { error } = await supabase
      .from("chats")
      .update({ is_removed: false })
      .in("id", chatIds);

    if (error) throw error;

    res.status(200).json({ success: true, message: "Chats restored" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteChatsPermanently = async (req, res) => {
  try {
    const { chatIds } = req.body;

    if (!chatIds || !Array.isArray(chatIds)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    const { error } = await supabase.from("chats").delete().in("id", chatIds);

    if (error) throw error;

    res
      .status(200)
      .json({ success: true, message: "Chats permanently deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
