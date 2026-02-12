import { supabase } from '../config/supabase.js'
import Groq from 'groq-sdk'

// Initialize Groq only if API key is present
const groq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here'
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null

if (!groq) {
  console.error('❌ GROQ_API_KEY is missing in server .env file. AI chat will be unavailable.')
}

export const handleChat = async (req, res) => {
  try {
    const { message, user_id } = req.body

    if (!message || !user_id) {
      return res.status(400).json({ success: false, message: 'Message and user_id are required' })
    }

    if (!groq) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service temporarily unavailable. System administrator needs to configure Groq API Link.' 
      })
    }

    // 1. Retrieve Knowledge Base Context
    let docsRes, faqsRes;
    try {
      [docsRes, faqsRes] = await Promise.all([
        supabase.from('docs').select('title, content').not('content', 'is', null),
        supabase.from('faqs').select('question, answer')
      ])
    } catch (dbErr) {
      console.error('Database connection error during chat context retrieval:', dbErr)
      return res.status(500).json({ success: false, message: 'Database error while retrieving knowledge base.' })
    }

    const docs = docsRes.data || []
    const faqs = faqsRes.data || []

    // If knowledge base is empty
    if (docs.length === 0 && faqs.length === 0) {
      return res.status(200).json({ 
        success: false, 
        message: "No documents available." 
      })
    }

    // 2. Filter relevant context (Simple keyword matching)
    const keywords = message.toLowerCase().split(' ').filter(word => word.length > 3)
    let contextParts = []
    
    // Add relevant FAQs
    const relevantFaqs = faqs.filter(f => 
      keywords.some(k => (f.question?.toLowerCase()?.includes(k) || f.answer?.toLowerCase()?.includes(k)))
    )
    relevantFaqs.forEach(f => {
      contextParts.push(`Q: ${f.question}\nA: ${f.answer}`)
    })

    // Add relevant Docs (limit to keeping context manageable)
    const relevantDocs = docs.filter(d => 
      keywords.some(k => (d.title?.toLowerCase()?.includes(k) || d.content?.toLowerCase()?.includes(k)))
    ).slice(0, 3)
    
    relevantDocs.forEach(d => {
      contextParts.push(`Document: ${d.title}\nContent: ${d.content}`)
    })

    // Combine context and safe-guard length
    let context = contextParts.join('\n\n')
    if (context.length > 3000) {
      context = context.substring(0, 3000) + "... [Truncated for efficiency]"
    }

    // 3. Construct AI Prompt
    const systemPrompt = `You are a professional support assistant for Assistly.
Answer the user's question ONLY using the provided knowledge base context.
If the answer is not in the context, politely say that you don't have that information.
Keep your response concise and professional.

KNOWLEDGE BASE CONTEXT:
${context || "No specific matching documents found. Inform the user you couldn't find a specific answer in the current documentation."}`

    let aiResponse = ""

    // 4. Groq API Call (OpenAI-compatible SDK)
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        max_tokens: 1024,
      })
      
      aiResponse = chatCompletion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this moment."
    } catch (groqErr) {
      console.error('Groq Service Error:', groqErr)
      return res.status(503).json({ success: false, message: "AI service temporarily unavailable." })
    }

    // 5. Save Chat History
    const { error: saveError } = await supabase
      .from('chats')
      .insert([
        { user_id, message, sender: 'user' },
        { user_id, message: aiResponse, sender: 'bot' }
      ])

    if (saveError) {
      console.error('Error saving chat history to Supabase:', saveError)
    }

    // Preservation of frontend expected structure
    return res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      },
      // Backend expects 'answer' but frontend component used result.data.message in previous turns.
      // I will include 'answer' property as well to be safe if requirements changed.
      answer: aiResponse 
    })

  } catch (globalError) {
    console.error('Global Chat Controller Error:', globalError)
    return res.status(500).json({ success: false, message: 'Internal server error while processing chat' })
  }
}

export const getHistory = async (req, res) => {
  try {
    const { user_id } = req.query
    const { role, id: authUserId } = req.user

    if (!authUserId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    let query = supabase.from('chats').select('*').order('created_at', { ascending: true })

    if (role !== 'admin') {
      query = query.eq('user_id', authUserId)
    } else if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data, error } = await query
    if (error) throw error

    return res.status(200).json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Get History Error:', error)
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' })
  }
}
