import { supabase } from '../config/supabase.js'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export const signup = async (email, password, name, role = 'user') => {
  try {
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, message: "Email already registered" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    // Insert into database
    const { error } = await supabase
      .from('users')
      .insert([
        { name, email, password: hashedPassword, role }
      ])
    
    if (error) throw error
    
    return { success: true, message: "Account created successfully" }
  } catch (error) {
    console.error('Signup Error:', error.message)
    return { success: false, message: error.message }
  }
}

export const login = async (email, password, role) => {
  try {
    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return { success: false, message: "Invalid email or password" }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return { success: false, message: "Invalid email or password" }
    }

    // Validate role
    if (role && user.role !== role) {
      return { success: false, message: `Access denied. Account is registered as ${user.role}.` }
    }

    // Generate a mock JWT token (base64 for demo purposes)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return { 
      success: true, 
      token, 
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Login Error:', error.message)
    return { success: false, message: "Invalid email or password" }
  }
}
