import express from 'express'
import { handleChat, getHistory, deleteChats, restoreChats, deleteChatsPermanently } from '../controllers/chatController.js'
import { authenticateUser } from '../middleware/authMiddleware.js'

const router = express.Router()

// All chat routes require authentication
router.use(authenticateUser)

router.post('/chat', handleChat)
router.post('/chat/delete', deleteChats)
router.post('/chat/restore', restoreChats)
router.post('/chat/delete-permanent', deleteChatsPermanently)
router.get('/history', getHistory)

export default router
