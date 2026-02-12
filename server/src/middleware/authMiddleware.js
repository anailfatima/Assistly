import { supabase } from '../config/supabase.js'

export const authenticateAdmin = async (req, res, next) => {
  const userId = req.headers['x-user-id']
  
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
export const authenticateUser = async (req, res, next) => {
  const userId = req.headers['x-user-id']
  
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
