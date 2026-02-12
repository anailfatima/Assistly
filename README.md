# 🧠 Assistly AI Support Chatbot

A full-stack **AI-powered customer support platform** that provides **knowledge-driven AI responses** to user queries. Built with a **retrieval-augmented generation (RAG) architecture**, this system enables admins to manage FAQs and documents while offering users contextual AI support.

---

## 📌 Features

### **User & Admin Roles**
- **Admin**: Upload documents, manage FAQs, view analytics, access full chat history.  
- **User**: Ask questions via a chat interface and receive AI-powered answers.  

### **Knowledge Management**
- Upload documents (PDF, text) and FAQs.  
- Content is stored in **Supabase** and used as the knowledge base for AI responses.  

### **AI Chat System**
- AI answers are **contextual and retrieval-based**:  
  1. Search documents and FAQs for relevant content.  
  2. Combine context with user question.  
  3. Use **Groq SDK** to generate a grounded AI response.  
- Reduces hallucination by grounding answers in your own uploaded knowledge base.  

### **Conversation Logging**
- All chats are stored in Supabase’s `chats` table.  
- Tracks **user**, **bot messages**, and **timestamps**.  
- Enables analytics and support history.  

### **Dashboard Analytics (Admin)**
- Total registered users.  
- Knowledge base count.  
- Support interactions overview.  
- Manage documents and FAQs.  

---

## 🛠 Tech Stack

| Layer       | Technology |
|------------|------------|
| **Frontend** | Vue.js, Tailwind CSS, Lucide Icons |
| **Backend**  | Node.js / Express (Serverless-ready) |
| **Database** | Supabase (PostgreSQL, Storage, Auth, RLS) |
| **AI**       | Groq SDK (LLM integration), RAG-style retrieval |
| **Deployment (Recommended)** | Vercel / Render / Railway (backend + frontend) |

---

## 🔄 How It Works

### **User Authentication**
- Users/Admins log in via **Supabase Auth**. Role-based access controls what they can see.

### **Knowledge Ingestion (Admin)**
- Admin uploads documents & FAQs.  
- Content stored in `docs` and `faqs` tables.

### **Chat Flow**
1. User sends a message.  
2. Backend searches relevant knowledge (docs + FAQs).  
3. **Groq LLM** generates an AI response using retrieved context.  
4. Response stored in `chats` table and sent to frontend.

### **Dashboard & Analytics**
- Admin can view chat history, number of users, documents, and FAQs.

---

## ⚠️ Environment Variables (`.env`)

To run this project locally, you need to **create a `.env` file** for both frontend and backend.  
Do **not push your `.env` file** to GitHub; it is included in `.gitignore`.

### **Backend `.env`**
```env
# Backend server port
PORT=3000

# Supabase credentials
SUPABASE_URL=https://your-supabase-project-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Groq AI API key
GROQ_API_KEY=your_groq_api_key_here
Frontend .env
# API URL for frontend to connect to backend
VITE_API_URL=http://localhost:3000

# Supabase credentials (public)
VITE_SUPABASE_URL=https://your-supabase-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
How to use:
Copy .env.demo → .env
Replace placeholders with your real credentials
Start your backend and frontend servers
💻 Getting Started Locally
Clone the repository
git clone https://github.com/your-username/assistly-ai-chatbot.git
cd assistly-ai-chatbot
Install dependencies
Backend:
cd server
npm install
Frontend:
cd frontend
npm install
Create .env files (see above)
Start backend
npm run dev
Start frontend
npm run dev
Access app
Frontend: http://localhost:5173 (Vite default)
Backend: http://localhost:3000
📹 Demo / Portfolio
If deploying live is not possible, you can showcase the project via:
Screen recording of chat interactions
Screenshots of admin dashboard and chat interface
GIFs for dynamic interactions
This demonstrates the AI capabilities without exposing keys.
⚡ Notes
The AI chat won’t work without a valid Groq API key in the backend .env.
Frontend fetches the backend API using VITE_API_URL.
All sensitive credentials should remain local; only placeholders should be in the public repo.
🏆 Key Learning Outcomes
Built full-stack AI support system with Vue, Supabase, and Groq SDK.
Implemented retrieval-based AI responses for real-world queries.
Managed documents, FAQs, user roles, and analytics dashboards.
Learned secure environment variable management and safe deployment practices.
