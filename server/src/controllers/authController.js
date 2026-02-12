import * as authService from '../services/authService.js'

export const signup = async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields (name, email, password) are required' 
    })
  }

  const result = await authService.signup(email, password, name, role || 'user')
  
  if (result.success) {
    console.log(`✅ Signup success: ${email} (${role || 'user'})`)
    return res.status(201).json(result)
  } else {
    console.log(`❌ Signup failed: ${result.message}`)
    // If message is "Email already registered", return 409 (Conflict)
    const status = result.message === 'Email already registered' ? 409 : 400
    return res.status(status).json(result)
  }
}

export const login = async (req, res) => {
  const { email, password, role } = req.body

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    })
  }

  const result = await authService.login(email, password, role)
  
  if (result.success) {
    console.log(`✅ Login success: ${email} (${result.profile.role})`)
    return res.status(200).json(result)
  } else {
    console.log(`❌ Login failed: ${email} - ${result.message}`)
    return res.status(401).json(result)
  }
}
