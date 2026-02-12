import express from 'express'
import { handleChat, getHistory } from '../controllers/chatController.js'
import { authenticateUser } from '../middleware/authMiddleware.js'

const router = express.Router()

// All chat routes require authentication
router.use(authenticateUser)

router.post('/chat', handleChat)
router.get('/history', getHistory)

export default router
