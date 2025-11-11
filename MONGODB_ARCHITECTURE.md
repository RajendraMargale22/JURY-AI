# 🏗️ JURY AI - MongoDB Architecture Diagram

## System Architecture with MongoDB Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         JURY AI APPLICATION                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  React Frontend │────────▶│  Node.js Backend │────────▶│   MongoDB       │
│   (Port 3000)   │         │   (Port 5000)    │         │ (Port 27017)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │                            │
        │                            │                            │
        │                            ▼                            │
        │                   ┌──────────────────┐                 │
        └──────────────────▶│ Python Chatbot   │─────────────────┘
                           │ Backend (8000)   │
                           └──────────────────┘
                                    │
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  Pinecone Vector │
                          │     Database     │
                          └──────────────────┘


## MongoDB Database: jury-ai

┌────────────────────────────────────────────────────────────────────┐
│                         COLLECTIONS                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  👥 users              ┌─────────────────────────────┐            │
│  ├─ Authentication     │  Stores:                    │            │
│  ├─ User profiles      │  - Email, password hash     │            │
│  └─ Role management    │  - Role (user/lawyer/admin) │            │
│                        │  - Verification status      │            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  💬 chats              ┌─────────────────────────────┐            │
│  ├─ User-AI chats      │  Stores:                    │            │
│  ├─ User-Lawyer chats  │  - Conversation metadata    │            │
│  └─ Chat status        │  - Type (ai/lawyer)         │            │
│                        │  - Participants             │            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  🤖 legal_queries ✨   ┌─────────────────────────────┐            │
│  ├─ AI questions       │  Stores:                    │            │
│  ├─ AI responses       │  - User query               │            │
│  ├─ Confidence scores  │  - AI response              │            │
│  ├─ Source documents   │  - Confidence (0-1)         │            │
│  └─ User feedback      │  - Sources used             │            │
│                        │  - Feedback (helpful/not)   │            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  🎯 chatbot_sessions ✨┌─────────────────────────────┐            │
│  ├─ Session tracking   │  Stores:                    │            │
│  ├─ Query count        │  - Session ID               │            │
│  ├─ Duration           │  - Start/End time           │            │
│  └─ Satisfaction       │  - Query IDs                │            │
│                        │  - Satisfaction rating (1-5)│            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  📊 analytics ✨       ┌─────────────────────────────┐            │
│  ├─ Event tracking     │  Stores:                    │            │
│  ├─ Usage metrics      │  - Event type               │            │
│  ├─ Error logs         │  - Timestamp                │            │
│  └─ Performance data   │  - Event data               │            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  👥 communityposts     ┌─────────────────────────────┐            │
│  ├─ Forum discussions  │  Stores:                    │            │
│  ├─ Comments           │  - Post content             │            │
│  └─ Likes/Reactions    │  - Author info              │            │
│                        │  - Comments, likes          │            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  📄 templates          ┌─────────────────────────────┐            │
│  ├─ Legal documents    │  Stores:                    │            │
│  ├─ Categories         │  - Template content         │            │
│  └─ Premium status     │  - Category                 │            │
│                        │  - Premium/Free             │            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  📎 documents          ┌─────────────────────────────┐            │
│  ├─ User uploads       │  Stores:                    │            │
│  ├─ File metadata      │  - File path                │            │
│  └─ Processing status  │  - Upload date              │            │
│                        │  - Type, size               │            │
│                        └─────────────────────────────┘            │
│                                                                     │
│  ⚖️ lawyers            ┌─────────────────────────────┐            │
│  ├─ Lawyer profiles    │  Stores:                    │            │
│  ├─ Specializations    │  - Profile info             │            │
│  └─ Availability       │  - Specializations          │            │
│                        │  - Ratings                  │            │
│                        └─────────────────────────────┘            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘

✨ = New collections for enhanced chatbot functionality


## Data Flow: User Query Journey

┌─────────────────────────────────────────────────────────────────────┐
│                      CHATBOT QUERY FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

  1. User sends question
         │
         ▼
  2. Store query in MongoDB (legal_queries)
     ├─ query: "What are tenant rights?"
     ├─ userId: "user123"
     ├─ timestamp: 2025-11-01T14:30:00Z
     └─ status: "processing"
         │
         ▼
  3. Query Pinecone for relevant documents
     ├─ Embed question using HuggingFace
     ├─ Search legal_index
     └─ Get top 5 similar documents
         │
         ▼
  4. Generate AI response
     ├─ LangChain + Groq (Llama 3.3)
     ├─ Use retrieved documents as context
     └─ Calculate confidence score
         │
         ▼
  5. Update MongoDB with response
     ├─ aiResponse: "In India, tenants have..."
     ├─ confidence_score: 0.87
     ├─ sources: [doc1, doc2, doc3]
     └─ status: "completed"
         │
         ▼
  6. Track analytics event
     ├─ eventType: "query_success"
     ├─ data: {userId, queryId, confidence}
     └─ timestamp: 2025-11-01T14:30:05Z
         │
         ▼
  7. Return response to user
     ├─ answer: "In India, tenants have..."
     ├─ queryId: "64abc123..."
     ├─ confidence: 0.87
     └─ sources_count: 5


## MongoDB Compass View

┌─────────────────────────────────────────────────────────────────────┐
│  MongoDB Compass - localhost:27017                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📁 Databases                                                        │
│    ├─ admin                                                          │
│    ├─ config                                                         │
│    ├─ local                                                          │
│    └─ 📂 jury-ai ← YOUR DATABASE                                    │
│         ├─ 👥 users (45 documents)                                  │
│         ├─ 💬 chats (128 documents)                                 │
│         ├─ 🤖 legal_queries (356 documents) ✨                      │
│         ├─ 🎯 chatbot_sessions (89 documents) ✨                    │
│         ├─ 📊 analytics (1,234 documents) ✨                        │
│         ├─ 👥 communityposts (67 documents)                         │
│         ├─ 📄 templates (23 documents)                              │
│         ├─ 📎 documents (156 documents)                             │
│         └─ ⚖️ lawyers (12 documents)                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


## Connection Configuration

┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICE CONNECTIONS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Node.js Backend                                                     │
│  ├─ Config: /jury-ai-app/backend/.env                              │
│  ├─ MONGODB_URI=mongodb://localhost:27017/jury-ai                  │
│  ├─ Uses: Mongoose ODM                                              │
│  └─ File: src/config/database.ts                                    │
│                                                                      │
│  Python Chatbot Backend                                              │
│  ├─ Config: /chatbot-backend/.env                                  │
│  ├─ MONGODB_URI=mongodb://localhost:27017/                         │
│  ├─ Uses: PyMongo driver                                            │
│  └─ File: config/mongodb.py                                         │
│                                                                      │
│  MongoDB Compass                                                     │
│  ├─ Connection: mongodb://localhost:27017                          │
│  ├─ Direct connection to view/edit data                             │
│  └─ Visual interface for database management                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


## Indexing Strategy

┌─────────────────────────────────────────────────────────────────────┐
│                        KEY INDEXES                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  users                                                               │
│  └─ { email: 1 } UNIQUE      ← Fast login lookup                   │
│                                                                      │
│  legal_queries                                                       │
│  ├─ { userId: 1 }            ← User's query history                │
│  ├─ { timestamp: -1 }        ← Recent queries first                │
│  ├─ { confidence_score: -1 } ← High confidence queries             │
│  └─ { query: "text" }        ← Full-text search                    │
│                                                                      │
│  chatbot_sessions                                                    │
│  ├─ { sessionId: 1 } UNIQUE  ← Fast session lookup                 │
│  └─ { userId: 1 }            ← User's sessions                      │
│                                                                      │
│  chats                                                               │
│  ├─ { userId: 1 }            ← User's conversations                │
│  └─ { createdAt: -1 }        ← Recent chats first                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘


## Benefits of This Setup

✅ Centralized Data Storage
   └─ All application data in one place

✅ Query History & Analytics
   └─ Track user behavior and improve AI responses

✅ Performance Optimization
   └─ Proper indexing for fast queries

✅ Data Persistence
   └─ Chat history available across sessions

✅ User Feedback Loop
   └─ Collect feedback to improve accuracy

✅ Audit Trail
   └─ Complete log of all interactions

✅ Scalability
   └─ Ready for production with connection pooling

✅ Easy Management
   └─ Visual interface with MongoDB Compass
