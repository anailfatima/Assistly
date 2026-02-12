import express from 'express'
import multer from 'multer'
import { 
  uploadDoc, getDocs, updateDoc, deleteDoc, getChats,
  getFaqs, addFaq, deleteFaq, getStats
} from '../controllers/adminController.js'


import { authenticateAdmin } from '../middleware/authMiddleware.js'


const router = express.Router()
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, and DOCX are allowed.'))
    }
  }
})


// All routes here require admin authentication
router.use(authenticateAdmin)

router.get('/stats', getStats)
router.post('/upload-doc', upload.single('file'), uploadDoc)

router.get('/docs', getDocs)
router.put('/docs/:id', updateDoc)
router.delete('/docs/:id', deleteDoc)
router.get('/chats', getChats)

// FAQ routes
router.get('/faqs', getFaqs)
router.post('/faqs', addFaq)
router.delete('/faqs/:id', deleteFaq)

export default router

