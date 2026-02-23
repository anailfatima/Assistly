# Assistly AI Chatbot - Complete Architecture & System Design

## 1. Executive Summary

**Assistly** is a full-stack AI-powered customer support platform that provides knowledge-driven AI responses using Retrieval-Augmented Generation (RAG) architecture. The system enables admins to manage knowledge bases (documents & FAQs) while offering users contextual AI support through an intuitive chat interface.

### Key Technologies
| Layer | Technology |
|-------|------------|
| Frontend | Vue.js 3, Tailwind CSS 4, Vue Router, Lucide Icons |
| Backend | Node.js, Express.js, Multer |
| Database | Supabase (PostgreSQL) |
| AI/ML | Groq SDK (LLM), Transformers.js (Embeddings), pgvector |
| Auth | Custom JWT with Supabase |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Vue.js 3 SPA (Frontend)                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────────────┐    │   │
│  │  │  Login   │ │  SignUp  │ │ ChatWindow   │ │ AdminDashboard   │    │   │
│  │  └──────────┘ └──────────┘ └──────────────┘ └───────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/REST API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY LAYER                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   Express.js Server (Backend)                        │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────────┐   │   │
│  │  │ /auth Routes │ │ /api Routes  │ │ /api/admin Routes           │   │   │
│  │  │ (Auth)      │ │ (Chat)       │ │ (Admin)                    │   │   │
│  │  └──────────────┘ └──────────────┘ └─────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │              Middleware Layer                                │   │   │
│  │  │  • authenticateUser    • authenticateAdmin    • Error Handler │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Client Libraries
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐   │
│  │  authService     │  │  chatService     │  │  adminService         │   │
│  │  • signup        │  │  (in controller) │  │  • uploadDoc          │   │
│  │  • login         │  │                  │  │  • addFaq             │   │
│  └──────────────────┘  └──────────────────┘  └────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Utility Layer                                     │   │
│  │  • localEmbeddings.js    • documentChunker.js    • queryNormalizer  │   │****
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Client Libraries
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER (Supabase)                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL Database                                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │   │
│  │  │  users  │  │   docs   │  │  faqs   │  │      chats         │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘   │   │
│  │  +------------------+  +------------------+                        │   │
│  │  │  pgvector Extension  │  Row Level Security (RLS)               │   │   │
│  │  └──────────────────┘  └──────────────────┘                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Supabase Storage (docs bucket)                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ External APIs
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│  ┌──────────────────────┐  ┌───────────────────────────────────────────┐   │
│  │  Groq Cloud API      │  │  Transformers.js (Local Embeddings)     │   │
│  │  • LLM: llama-3.3    │  │  • Model: all-MiniLM-L6-v2 (384-dim)   │   │
│  │  • Chat Completions  │  │  • Local inference                       │   │
│  └──────────────────────┘  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Architecture

### 3.1 User Authentication Flow
```
┌─────────┐     ┌───────────┐     ┌─────────────┐     ┌──────────┐
│  Client │────▶│  Express  │────▶│ authService │────▶│Supabase  │
│ (Login) │     │  Router   │     │  (bcrypt)  │     │   DB     │
└─────────┘     └───────────┘     └─────────────┘     └──────────┘
      │              │                   │
      │              │                   ▼
      │              │            ┌─────────────┐
      │              │            │ JWT Token   │
      │              │            │ Generation │
      │              │            └─────────────┘
      │              │                   │
      ▼              ▼                   ▼
┌─────────┐   ┌───────────┐     ┌─────────────┐
│ Store   │◀──│ Response  │◀────│ Profile +   │
│ Token   │   │  (200 OK) │     │ Token       │
└─────────┘   └───────────┘     └─────────────┘
```

### 3.2 Document Upload & Embedding Flow
```
┌──────────────┐    ┌─────────────────┐    ┌─────────────────────┐
│ Admin (File) │───▶│ Multer (Parse)  │───▶│ Supabase Storage    │
└──────────────┘    └─────────────────┘    │ (docs bucket)       │
       │                                        └─────────────────┘
       │                                               │
       ▼                                               ▼
┌──────────────────┐                         ┌─────────────────┐
│ Extract Content  │                         │ Get Public URL  │
│ (TXT parsing)    │                         └─────────────────┘
└──────────────────┘                                │
       │                                             ▼
       ▼                                      ┌─────────────────┐
┌──────────────────┐                         │ Generate        │
│ generateEmbed-  │                         │ Embedding       │
│ ding (Transformers│◀──────────────────────│ (all-MiniLM-L6) │
│ .js)             │                         └─────────────────┘
└──────────────────┘                                │
       │                                            ▼
       ▼                                    ┌─────────────────┐
┌──────────────────┐                         │ Insert to DB    │
│ formatEmbedding  │                         │ (with vector)   │
│ ForVector        │                         └─────────────────┘
└──────────────────┘                                │
       │                                            ▼
       ▼                                    ┌─────────────────┐
┌──────────────────┐                         │ RPC: insert_doc │
│ insert_doc_with_ │───▶ Supabase RPC ──────│ _with_embedding │
│ embedding        │                         └─────────────────┘
└──────────────────┘
```

### 3.3 Chat & RAG Flow (Core AI Pipeline)
```
┌──────────────┐
│  User Message│
└──────┬───────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 1: Generate Query Embedding                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  localEmbeddings.generateEmbedding(userMessage)         │ │
│  │  → Uses Xenova/all-MiniLM-L6-v2 (384 dimensions)        │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 2: Vector Similarity Search                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  supabase.rpc("match_knowledge_base", {                 │ │
│  │    query_embedding: [...],                               │ │
│  │    match_count: 15                                       │ │
│  │  })                                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│       │                                                       │
│       ▼                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  SQL: Cosine Similarity (1 - cosine_distance)          │  │
│  │  Searches: docs + faqs tables (vector column)          │  │
│  │  Filters: similarity > 0.4 threshold                    │  │
│  │  Returns: Top 5-7 relevant chunks                       │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 3: Build Context                                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Format context from matches:                            │ │
│  │  • FAQ: "FAQ Entry X:\nQuestion: ...\nAnswer: ..."       │ │
│  │  • Doc: "Document X: Title\n\nContent: ..."             │ │
│  │  • Concatenate with "---" separators                     │ │
│  │  • Truncate to 6000 chars max                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 4: LLM Prompt Construction                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  System Prompt:                                          │ │
│  │  "You are a friendly, professional support assistant..." │ │
│  │  + Response Style Guidelines (concise, 2-4 sentences)     │ │
│  │  + Context (from vector search)                          │ │
│  │  + User Message                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 5: Groq API Call                                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  groq.chat.completions.create({                          │ │
│  │    model: "llama-3.3-70b-versatile",                    │ │
│  │    messages: [system, user],                              │ │
│  │    temperature: 0.2,                                      │ │
│  │    max_tokens: 400                                        │ │
│  │  })                                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Step 6: Save to History                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  supabase.from("chats").insert([                         │ │
│  │    { user_id, message, sender: "user" },                 │ │
│  │    { user_id, message: AI_response, sender: "bot" }      │ │
│  │  ])                                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Response    │
│  to Client   │
└──────────────┘
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram
```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      users       │         │      docs        │         │      faqs        │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │         │ id (PK)          │
│ name             │         │ title            │         │ question         │
│ email (UQ)       │         │ description      │         │ answer           │
│ password         │         │ content          │         │ embedding (vec)  │
│ role             │◀────────│ file_url         │         │ created_at       │
│ created_at       │  upload │ file_type        │         └──────────────────┘
└──────────────────┘    by   │ uploader_id (FK) │
       │                    │ category         │
       │                    │ embedding (vec)  │
       │                    │ created_at       │
       │                    └──────────────────┘
       │                           │
       │  has many                  │ has many
       ▼                           ▼
┌──────────────────────────────────────────────────┐
│                    chats                          │
├──────────────────────────────────────────────────┤
│ id (PK)                                          │
│ user_id (FK) ───────────────────────────────┐  │
│ message (TEXT)                                  │  │
│ sender (ENUM: 'user' | 'bot')                  │  │
│ is_removed (BOOLEAN) ──────────────────────┐   │  │
│ created_at (TIMESTAMP)                     │   │  │
└─────────────────────────────────────────────┘   │  │
                                                │   │
        has many ◀───────────────────────────────┘  │
                                                    │
        belongs to ◀─────────────────────────────────┘
```

### 4.2 Table Definitions

#### **users** Table
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **docs** Table
```sql
CREATE TABLE public.docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                    -- Extracted text for RAG
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploader_id UUID REFERENCES users(id),
  category TEXT DEFAULT 'Other',
  embedding vector(384),            -- Local embeddings (all-MiniLM-L6-v2)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **faqs** Table
```sql
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  embedding vector(384),           -- Local embeddings
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **chats** Table
```sql
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  is_removed BOOLEAN DEFAULT false,    -- Soft delete
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API Architecture

### 5.1 REST API Endpoints

#### **Authentication Routes** (`/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | Public |
| POST | `/auth/login` | User login | Public |

#### **Chat Routes** (`/api`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat` | Send message, get AI response | User |
| GET | `/api/history` | Get chat history | User |
| POST | `/api/chat/delete` | Soft delete chats | User |
| POST | `/api/chat/restore` | Restore deleted chats | User |
| POST | `/api/chat/delete-permanent` | Permanent delete | User |

#### **Admin Routes** (`/api/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Get dashboard statistics | Admin |
| POST | `/api/admin/upload-doc` | Upload document | Admin |
| GET | `/api/admin/docs` | List all documents | Admin |
| PUT | `/api/admin/docs/:id` | Update document | Admin |
| DELETE | `/api/admin/docs/:id` | Delete document | Admin |
| GET | `/api/admin/faqs` | List all FAQs | Admin |
| POST | `/api/admin/faqs` | Add new FAQ | Admin |
| DELETE | `/api/admin/faqs/:id` | Delete FAQ | Admin |
| GET | `/api/admin/chats` | View all user chats | Admin |

### 5.2 API Request/Response Examples

#### **POST /api/chat**
```javascript
// Request
{
  "message": "How do I reset my password?",
  "user_id": "uuid-xxxx-xxxx"
}

// Response (Success)
{
  "success": true,
  "data": {
    "message": "To reset your password, go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a reset link.",
    "sender": "bot",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "id": "uuid-bot-msg"
  }
}
```

---

## 6. Vector Search Architecture

### 6.1 Embedding Pipeline
```
┌─────────────────────────────────────────────────────────────────────┐
│                    Embedding Generation Flow                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Input Text ──▶ Transformers.js ──▶ all-MiniLM-L6-v2 Model ──▶     │
│  (User Query)     Pipeline         (384-dim, quantized)       384  │
│                                                             floats   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Vector Search Functions

#### **match_knowledge_base** RPC Function
```sql
-- Searches both docs and faqs, returns combined results
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(384),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  source text,      -- 'doc' or 'faq'
  id uuid,
  title text,
  content text,
  similarity float  -- Cosine similarity (0-1)
)
LANGUAGE sql STABLE
AS $$
  SELECT * FROM (
    -- Search docs
    SELECT
      'doc'::text as source,
      id,
      title,
      content,
      1 - (embedding <=> query_embedding) AS similarity
    FROM docs
    WHERE embedding IS NOT NULL
    
    UNION ALL
    
    -- Search faqs
    SELECT
      'faq'::text as source,
      id,
      question as title,
      answer as content,
      1 - (embedding <=> query_embedding) AS similarity
    FROM faqs
    WHERE embedding IS NOT NULL
  ) combined
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

### 6.3 Similarity Threshold Logic
```
┌────────────────────────────────────────────────────────────────┐
│                  Relevance Filtering Logic                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Get top 15 matches from vector search                     │
│     ↓                                                           │
│  2. Filter valid matches (content exists, similarity > 0)      │
│     ↓                                                           │
│  3. Apply threshold:                                           │
│     • If ≥2 matches with similarity > 0.4 → use top 7         │
│     • Else if ≥3 matches with similarity > 0.3 → use top 3-5  │
│     • Else use top 3 (lowest fallback)                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Architecture

### 7.1 Authentication Flow
```
┌────────────────────────────────────────────────────────────────┐
│                  Token-Based Authentication                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Login with email/password                                   │
│     ↓                                                           │
│  2. Verify against hashed password (bcrypt)                     │
│     ↓                                                           │
│  3. Generate JWT token:                                         │
│     base64(user_id + ":" + timestamp)                          │
│     ↓                                                           │
│  4. Store token in localStorage                                 │
│     ↓                                                           │
│  5. Include in requests:                                        │
│     Headers: { 'x-user-id': user_id }                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Role-Based Access Control (RBAC)

| Feature | User | Admin |
|---------|------|-------|
| Login/Signup | ✅ | ✅ |
| Chat with AI | ✅ | ✅ |
| View Own Chat History | ✅ | ✅ |
| Delete Own Messages | ✅ | ✅ |
| View All Users' Chats | ❌ | ✅ |
| Upload Documents | ❌ | ✅ |
| Manage FAQs | ❌ | ✅ |
| View Dashboard Stats | ❌ | ✅ |

### 7.3 Row Level Security (RLS)
```sql
-- Users can only see their own chats
CREATE POLICY "users_see_own_chats"
ON public.chats FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all chats
CREATE POLICY "admins_see_all_chats"
ON public.chats FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

---

## 8. Frontend Architecture

### 8.1 Component Hierarchy
```
App.vue
├── Background.vue
├── ToastContainer.vue
└── Router View
    ├── Login.vue
    ├── SignUp.vue
    ├── ChatWindow.vue
    │   ├── ChatBubble.vue (repeatable)
    │   └── InputField.vue
    └── AdminDashboard.vue
        ├── Sidebar.vue
        ├── DocumentUpload.vue
        ├── Stats Cards
        └── Management Tables
```

### 8.2 Vue Router Configuration
```javascript
const routes = [
  { path: '/login', component: Login },
  { path: '/signup', component: SignUp },
  { 
    path: '/chat', 
    component: ChatWindow,
    meta: { requiresAuth: true }
  },
  { 
    path: '/admin', 
    component: AdminDashboard,
    meta: { requiresAuth: true, role: 'admin' }
  }
]
```

### 8.3 State Management
- **Authentication State**: localStorage (`assistly_token`, `assistly_user`)
- **UI State**: Vue reactive refs
- **Toast Notifications**: Custom composable (`useToast`)

---

## 9. Deployment Architecture

### 9.1 Development Setup
```
┌─────────────────────────────────────────────────────────────────┐
│                    Local Development                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │ Frontend    │      │ Backend     │      │ Supabase    │     │
│  │ (Vite)     │ ───▶ │ (Express)  │ ───▶ │ (Cloud)     │     │
│  │ :5173       │      │ :3000       │      │ :5432       │     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
│         │                    │                                   │
│         │                    ▼                                   │
│         │            ┌─────────────┐                             │
│         │            │ Groq API    │                             │
│         │            │ (Cloud)     │                             │
│         │            └─────────────┘                             │
│         ▼                                                       │
│  ┌─────────────┐                                               │
│  │ Browser     │                                               │
│  │ (localhost) │                                               │
│  └─────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Environment Variables

#### **Backend (.env)**
```bash
PORT=3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx
GROQ_API_KEY=gsk_xxx
```

#### **Frontend (.env)**
```bash
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
```

### 9.3 Recommended Production Deployment
```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │ Vercel/Netlify   │      │ Vercel/Render    │               │
│  │ (Vue.js SPA)     │      │ (Node.js API)    │               │
│  └──────────────────┘      └──────────────────┘               │
│           │                         │                           │
│           └────────────┬────────────┘                          │
│                        │                                        │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Supabase Cloud                         │  │
│  │  • PostgreSQL + pgvector                                 │  │
│  │  • Authentication                                        │  │
│  │  • Storage (docs bucket)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                        │                                        │
│                        ▼                                        │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Groq Cloud       │  │ Local ML Model   │                   │
│  │ (LLM Inference) │  │ (Transformers.js)│                   │
│  └──────────────────┘  └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Key Features & Implementation Details

### 10.1 Document Processing Pipeline
1. **Upload**: Admin uploads PDF/TXT/DOCX via Multer
2. **Storage**: Save to Supabase Storage bucket (`docs`)
3. **Extraction**: Extract text content (TXT files directly; PDF/DOCX needs processing)
4. **Chunking**: Split into 500-char chunks with 50-char overlap
5. **Embedding**: Generate 384-dim embeddings using Transformers.js
6. **Storage**: Save to `docs.embedding` column via RPC

### 10.2 Chat Management Features
- **Soft Delete**: `is_removed = true` (moves to trash)
- **Restore**: `is_removed = false` (recover from trash)
- **Permanent Delete**: Actual DB deletion
- **History**: Filter by `is_removed` flag

### 10.3 RAG Prompt Engineering
```system
You are a friendly, professional support assistant for Assistly.
Keep answers CONCISE: 2-4 sentences maximum.
Use bullet points ONLY when listing multiple items.
Write in a friendly, conversational tone.
Never make up information not in the context.

KNOWLEDGE BASE CONTEXT:
{retrieved_chunks}

Provide a concise answer based on the context above.
```

---

## 11. Performance Considerations

### 11.1 Embedding Optimization
- **Model**: all-MiniLM-L6-v2 (384-dim, quantized)
- **Caching**: Embedding pipeline cached in memory
- **Batch Processing**: Support for bulk embedding

### 11.2 Vector Search Optimization
- **Index Type**: IVFFlat (Inverted File Index)
- **Lists Parameter**: 100
- **Distance Metric**: Cosine similarity

### 11.3 Response Time Targets
| Operation | Target |
|-----------|--------|
| Embedding Generation | < 500ms |
| Vector Search | < 100ms |
| LLM Response | < 2s |
| Total Chat Response | < 3s |

---

## 12. Future Enhancements

1. **Multi-document Chunking**: Store multiple embeddings per document
2. **Better PDF Parsing**: Use pdf-parse or similar for PDF content
3. **Streaming Responses**: Server-sent events for real-time typing
4. **Conversation Context**: Maintain chat session context
5. **Analytics Dashboard**: User behavior insights
6. **File Type Support**: More document formats (CSV, Markdown, etc.)

---

## 13. File Structure Summary

```
/Assistly
├── index.html
├── package.json              # Frontend dependencies
├── vite.config.js
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── style.css
│   ├── router/index.js
│   ├── components/
│   │   ├── Login.vue
│   │   ├── SignUp.vue
│   │   ├── ChatWindow.vue
│   │   ├── AdminDashboard.vue
│   │   ├── ChatBubble.vue
│   │   ├── DocumentUpload.vue
│   │   └── ...
│   └── composables/useToast.js
│
└── server/
    ├── package.json          # Backend dependencies
    ├── setup.sql             # Initial schema
    ├── vector_rag_migration.sql
    ├── update_vector_dimension_local.sql
    └── src/
        ├── index.js
        ├── config/supabase.js
        ├── routes/
        │   ├── authRoutes.js
        │   ├── chatRoutes.js
        │   └── adminRoutes.js
        ├── controllers/
        │   ├── authController.js
        │   ├── chatController.js
        │   └── adminController.js
        ├── middleware/authMiddleware.js
        ├── services/authService.js
        └── utils/
            ├── localEmbeddings.js
            ├── documentChunker.js
            └── queryNormalizer.js
```

---

## 14. Conclusion

Assistly implements a modern, scalable RAG-based chatbot architecture with:

- ✅ **Local Embeddings**: Privacy-preserving, no external API for embeddings
- ✅ **Vector Search**: pgvector-powered similarity search
- ✅ **LLM Integration**: Groq Cloud for fast AI responses
- ✅ **Role-Based Access**: Secure admin/user separation
- ✅ **Full-Stack Vue**: Modern SPA with beautiful UI
- ✅ **Production-Ready**: Environment variables, error handling, logging

This architecture provides a solid foundation for building production-ready AI support systems while maintaining flexibility for future enhancements.

