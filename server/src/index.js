import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import { supabase } from './config/supabase.js'


const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}))

app.use(express.json())

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/auth', authRoutes)
app.use('/api', chatRoutes)
app.use('/api/admin', adminRoutes)


// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Assistly Server is running' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

const testDbConnection = async () => {

  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('✅ Database connection verified: Users table is accessible')
  } catch (err) {
    console.error('❌ Database connection error:', err.message)
    console.log('💡 Tip: Make sure you have run the setup.sql in your Supabase SQL Editor.')
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  testDbConnection()
})
