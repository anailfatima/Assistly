import { supabase } from '../config/supabase.js'

export const uploadDoc = async (req, res) => {
  try {
    const file = req.file
    const { title, description, uploader_id, category } = req.body

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    // 1. Upload to Supabase Storage
    const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`
    const { data: storageData, error: storageError } = await supabase.storage
      .from('docs')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      })

    if (storageError) {
        console.error('Storage Error:', storageError)
        return res.status(500).json({ success: false, message: 'Storage upload failed. Ensure "docs" bucket exists in Supabase.' })
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('docs')
      .getPublicUrl(fileName)

    // 3. Extract content for RAG if it's a TXT file
    let content = null
    if (file.mimetype === 'text/plain') {
        content = file.buffer.toString('utf8')
    }

    // 4. Save to Database
    const { data, error } = await supabase
      .from('docs')
      .insert([{ 
        title: title || file.originalname, 
        description, 
        file_url: publicUrl, 
        file_type: file.originalname.split('.').pop().toUpperCase(), 
        uploader_id,
        content,
        category: category || 'Other'
      }])
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ success: true, message: 'Document uploaded successfully', data })
  } catch (error) {
    console.error('Upload Doc Error:', error)
    res.status(500).json({ success: false, message: 'Unable to upload document' })
  }
}



export const getDocs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('docs')
      .select('*, uploader:uploader_id(name)')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateDoc = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description } = req.body

    const { data, error } = await supabase
      .from('docs')
      .update({ title, description })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.status(200).json({ success: true, message: 'Document updated successfully', data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteDoc = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('docs')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(200).json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getChats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*, user:user_id(name, email)')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
export const getFaqs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const addFaq = async (req, res) => {
  try {
    const { question, answer } = req.body

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const { data, error } = await supabase
      .from('faqs')
      .insert([{ question, answer }])
      .select()
      .single()

    if (error) throw error

    res.status(201).json({ success: true, message: 'FAQ added successfully', data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(200).json({ success: true, message: 'FAQ deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
export const getStats = async (req, res) => {
  try {
    const [usersCount, adminCount, docsCount, chatsCount, faqsCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('docs').select('*', { count: 'exact', head: true }),
      supabase.from('chats').select('*', { count: 'exact', head: true }).eq('sender', 'user'),
      supabase.from('faqs').select('*', { count: 'exact', head: true })
    ])

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersCount.count || 0,
        adminCount: adminCount.count || 0,
        totalDocs: docsCount.count || 0,
        totalChats: chatsCount.count || 0,
        totalFaqs: faqsCount.count || 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
