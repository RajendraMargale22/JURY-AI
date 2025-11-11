# 🗄️ MongoDB Complete Setup Guide for JURY AI
## Database Configuration, Integration & Best Practices

---

## 📋 **Quick Navigation**
1. [MongoDB Compass Connection](#1-mongodb-compass-connection)
2. [Database Structure Overview](#2-database-structure-overview)
3. [Connecting All Services](#3-connecting-all-services)
4. [Chatbot Data Storage](#4-chatbot-data-storage)
5. [Best Practices & Optimization](#5-best-practices--optimization)
6. [Testing & Verification](#6-testing--verification)

---

## 1. 🔌 MongoDB Compass Connection

### Step 1: Start MongoDB Service

```bash
# Start MongoDB
sudo systemctl start mongod

# Enable auto-start on boot (recommended)
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

### Step 2: Connect Using MongoDB Compass

1. **Open MongoDB Compass** on your laptop

2. **Use this connection string:**
   ```
   mongodb://localhost:27017
   ```

3. **OR fill in connection details manually:**
   - Hostname: `localhost`
   - Port: `27017`
   - Authentication: None (for local development)

4. **Click "Connect"**

### Step 3: Verify Connection

After connecting, you should see these default databases:
- `admin`
- `config`
- `local`

Your application database `jury-ai` will be created automatically on first use.

---

## 2. 🏗️ Database Structure Overview

### **Single Database, Multiple Collections Approach** (Recommended)

```
jury-ai/ (Main Database)
├── users                    # User accounts & authentication
├── lawyers                  # Lawyer profiles & specializations
├── chats                    # Chat conversations
├── messages                 # Individual chat messages
├── legal_queries            # ✨ AI chatbot queries & responses
├── chatbot_sessions         # ✨ Chatbot session tracking
├── analytics                # ✨ Usage statistics & metrics
├── communityposts           # Community forum posts
├── documents                # User-uploaded documents
├── templates                # Legal document templates
└── notifications            # User notifications
```

**✨ = New collections added for enhanced chatbot functionality**

### **Collections Purpose:**

| Collection | Purpose | Key Features |
|------------|---------|--------------|
| `legal_queries` | Store all AI chatbot interactions | Query history, AI responses, confidence scores, sources |
| `chatbot_sessions` | Track conversation sessions | Session duration, satisfaction ratings, query count |
| `analytics` | Usage metrics & performance | Event tracking, error logs, usage patterns |
| `users` | User authentication & profiles | Email, role, status, timestamps |
| `chats` | Conversation metadata | User-AI or User-Lawyer chats |
| `communityposts` | Forum discussions | Posts, comments, likes |

---

## 3. 🔗 Connecting All Services

### Service 1: Node.js Backend (Port 5000) ✅

**Already Connected!**

**Location:** `/jury-ai-app/backend/.env`
```env
MONGODB_URI=mongodb://localhost:27017/jury-ai
```

**Configuration File:** `src/config/database.ts`

**What it handles:**
- User authentication
- Lawyer profiles
- Community posts
- Templates
- Main application data

---

### Service 2: Python Chatbot Backend (Port 8000) ✅

**Now Connected!**

**Location:** `/chatbot-backend/.env`
```env
MONGODB_URI=mongodb://localhost:27017/
```

**New Configuration File:** `config/mongodb.py` (Created)

**New Features Added:**

#### 📍 **Enhanced API Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ask/` | POST | Ask question (now stores in MongoDB) |
| `/feedback/` | POST | Submit feedback on answers |
| `/history/{user_id}` | GET | Get user's query history |
| `/analytics/` | GET | Get usage analytics |
| `/health/` | GET | Check MongoDB connection |

#### 📊 **What Gets Stored:**

Every chatbot interaction now automatically stores:
- User query
- AI response
- Timestamp
- Confidence score (from Pinecone similarity)
- Source documents used
- User feedback (helpful/not helpful)

---

### Service 3: React Frontend (Port 3000) ✅

**Uses Backend APIs**

No direct MongoDB connection needed. Communicates through:
- `http://localhost:5000/api/*` (Node.js backend)
- `http://localhost:8000/*` (Python chatbot)

---

## 4. 💬 Chatbot Data Storage (Enhanced)

### **Before vs After:**

#### **BEFORE** (Original Setup):
```
User Query → Pinecone (Vector Search) → AI Response → User
                                          ↓
                                   (No Storage)
```

#### **AFTER** (Enhanced with MongoDB):
```
User Query → Store in MongoDB
     ↓
Pinecone (Vector Search)
     ↓
AI Response → Update MongoDB
     ↓
Track Analytics → User
     ↓
Query History Available
```

### **What Data is Stored:**

#### **legal_queries Collection:**

```json
{
  "_id": "ObjectId(...)",
  "userId": "user123",
  "query": "What are the tenant rights in India?",
  "aiResponse": "In India, tenants have the following rights...",
  "timestamp": "2025-11-01T14:30:00Z",
  "confidence_score": 0.87,
  "sources": [
    {
      "text": "According to the Rent Control Act...",
      "metadata": { "document": "Rent_Act_1948.pdf", "page": 12 }
    }
  ],
  "feedback": "helpful"
}
```

#### **chatbot_sessions Collection:**

```json
{
  "_id": "ObjectId(...)",
  "sessionId": "sess_abc123",
  "userId": "user123",
  "startTime": "2025-11-01T14:30:00Z",
  "endTime": "2025-11-01T14:45:00Z",
  "queries": ["query_id_1", "query_id_2", "query_id_3"],
  "satisfaction_rating": 5
}
```

#### **analytics Collection:**

```json
{
  "_id": "ObjectId(...)",
  "eventType": "query_success",
  "timestamp": "2025-11-01T14:30:00Z",
  "data": {
    "userId": "user123",
    "queryId": "query_id_1",
    "confidence": 0.87
  }
}
```

---

## 5. 🎯 Best Practices & Optimization

### **A. Create Essential Indexes**

**Using MongoDB Compass:**
1. Select a collection
2. Go to "Indexes" tab
3. Click "Create Index"
4. Add field names

**Using MongoDB Shell:**

```javascript
use jury-ai

// Users Collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.users.createIndex({ createdAt: -1 })

// Legal Queries Collection (Important for Chatbot)
db.legal_queries.createIndex({ userId: 1 })
db.legal_queries.createIndex({ timestamp: -1 })
db.legal_queries.createIndex({ confidence_score: -1 })
db.legal_queries.createIndex({ "query": "text" }) // Full-text search

// Chatbot Sessions
db.chatbot_sessions.createIndex({ sessionId: 1 }, { unique: true })
db.chatbot_sessions.createIndex({ userId: 1 })
db.chatbot_sessions.createIndex({ startTime: -1 })

// Chats
db.chats.createIndex({ userId: 1 })
db.chats.createIndex({ type: 1 })
db.chats.createIndex({ createdAt: -1 })

// Community Posts
db.communityposts.createIndex({ authorId: 1 })
db.communityposts.createIndex({ createdAt: -1 })
db.communityposts.createIndex({ "title": "text", "content": "text" })
```

### **B. Implement TTL (Time To Live) Indexes**

Auto-delete old analytics data:

```javascript
// Delete analytics older than 90 days
db.analytics.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 7776000 }
)

// Delete old chatbot sessions (1 year)
db.chatbot_sessions.createIndex(
  { "startTime": 1 },
  { expireAfterSeconds: 31536000 }
)
```

### **C. Connection Pooling**

Already configured in `src/config/database.ts`, but you can optimize:

```typescript
const conn = await mongoose.connect(mongoURI, {
  maxPoolSize: 10,      // Max connections
  minPoolSize: 5,       // Min connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### **D. MongoDB Backup Strategy**

Create automated backups:

```bash
#!/bin/bash
# Save as: /home/aditya/mongodb-backup.sh

BACKUP_DIR="/home/aditya/mongodb-backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup only jury-ai database
mongodump --db=jury-ai --out=$BACKUP_DIR/backup_$DATE

# Compress
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

echo "✅ Backup completed: backup_$DATE.tar.gz"
```

**Schedule daily backups:**
```bash
chmod +x /home/aditya/mongodb-backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/aditya/mongodb-backup.sh
```

---

## 6. ✅ Testing & Verification

### **Step 1: Verify MongoDB is Running**

```bash
# Check status
sudo systemctl status mongod

# Check if port 27017 is listening
sudo lsof -i :27017
```

### **Step 2: Test Python Backend MongoDB Connection**

```bash
cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend
source venv/bin/activate

# Test the health endpoint
python -c "from config.mongodb import check_mongodb_health; print('MongoDB:', 'Connected' if check_mongodb_health() else 'Disconnected')"
```

### **Step 3: Test via API**

Start the chatbot backend:
```bash
cd /home/aditya/Downloads/JURY-AI-main/chatbot-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Test health endpoint:
```bash
curl http://localhost:8000/health/
```

Expected response:
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "mongodb_enabled": true
}
```

### **Step 4: Test Query Storage**

Send a test query:
```bash
curl -X POST "http://localhost:8000/ask/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "question=What are tenant rights?&user_id=test_user"
```

Check in MongoDB Compass:
1. Open `jury-ai` database
2. Open `legal_queries` collection
3. You should see the new query document

### **Step 5: View Analytics in Compass**

1. Open `jury-ai` → `analytics` collection
2. You should see events like:
   - `query_received`
   - `query_success`

---

## 📊 **MongoDB Compass Features to Use**

### **1. Visual Schema Analyzer**
- Select collection → "Schema" tab
- See field distribution and data types

### **2. Query Performance Analyzer**
- Use "Explain Plan" for slow queries
- Check if indexes are being used

### **3. Aggregation Pipeline Builder**
- Visual interface for complex analytics
- Example: Group queries by day, get average confidence scores

### **4. Import/Export Data**
- Export: Collection → "Export Collection" → JSON/CSV
- Import: Database → "Import Data" → Select file

---

## 🚀 **Quick Setup Commands**

### **Complete Setup in One Go:**

```bash
# 1. Start MongoDB
sudo systemctl start mongod

# 2. Create initialization script
cat > /tmp/init-jury-ai.js << 'EOF'
use jury-ai

// Create collections
db.createCollection("users")
db.createCollection("chats")
db.createCollection("legal_queries")
db.createCollection("chatbot_sessions")
db.createCollection("analytics")
db.createCollection("communityposts")
db.createCollection("templates")
db.createCollection("documents")
db.createCollection("lawyers")

// Create essential indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.legal_queries.createIndex({ userId: 1 })
db.legal_queries.createIndex({ timestamp: -1 })
db.chatbot_sessions.createIndex({ sessionId: 1 }, { unique: true })
db.chats.createIndex({ userId: 1 })

print("✅ Database jury-ai initialized successfully!")
EOF

# 3. Run initialization
mongosh < /tmp/init-jury-ai.js

# 4. Verify
mongosh --eval "use jury-ai; db.getCollectionNames()"
```

---

## 📈 **Analytics Queries You Can Run**

### **1. Get Total Queries by User:**
```javascript
db.legal_queries.aggregate([
  { $group: { _id: "$userId", total: { $sum: 1 } } },
  { $sort: { total: -1 } }
])
```

### **2. Get Average Confidence Score:**
```javascript
db.legal_queries.aggregate([
  { $group: { _id: null, avgConfidence: { $avg: "$confidence_score" } } }
])
```

### **3. Get Queries by Feedback Type:**
```javascript
db.legal_queries.aggregate([
  { $group: { _id: "$feedback", count: { $sum: 1 } } }
])
```

### **4. Get Most Active Users (Last 7 Days):**
```javascript
db.legal_queries.aggregate([
  { 
    $match: { 
      timestamp: { 
        $gte: new Date(Date.now() - 7*24*60*60*1000) 
      } 
    } 
  },
  { $group: { _id: "$userId", queries: { $sum: 1 } } },
  { $sort: { queries: -1 } },
  { $limit: 10 }
])
```

---

## ✅ **Setup Checklist**

- [ ] MongoDB service running
- [ ] MongoDB Compass connected successfully
- [ ] Database `jury-ai` visible in Compass
- [ ] Collections created (users, chats, legal_queries, etc.)
- [ ] Indexes created for performance
- [ ] Python chatbot backend has `config/mongodb.py`
- [ ] `pymongo` installed in virtual environment
- [ ] `.env` files updated with `MONGODB_URI`
- [ ] Health endpoint returns "connected"
- [ ] Test query stored successfully in database
- [ ] Analytics events being tracked

---

## 🎯 **Summary - What You Get**

### **Enhanced Capabilities:**

1. ✅ **Persistent Chat History** - Users can view their past queries
2. ✅ **Query Analytics** - Track most common questions, confidence scores
3. ✅ **User Feedback** - Collect feedback to improve AI responses
4. ✅ **Session Tracking** - Monitor conversation flow and satisfaction
5. ✅ **Performance Metrics** - Analyze response times and accuracy
6. ✅ **Audit Trail** - Full history of all interactions
7. ✅ **Better User Experience** - Recommendations based on past queries

### **Data Flow:**

```
User asks question
    ↓
Store in MongoDB (legal_queries)
    ↓
Query Pinecone for relevant documents
    ↓
Generate AI response using Groq + LangChain
    ↓
Update MongoDB with response & confidence
    ↓
Track analytics event
    ↓
Return response to user (with queryId for feedback)
```

---

## 📞 **Support & Next Steps**

### **If MongoDB Connection Fails:**
1. Check if MongoDB is running: `sudo systemctl status mongod`
2. Check logs: `sudo journalctl -u mongod -n 50`
3. Verify port 27017 is open: `sudo lsof -i :27017`

### **If Compass Can't Connect:**
1. Try: `mongodb://127.0.0.1:27017` instead of localhost
2. Check firewall: `sudo ufw status`
3. Restart MongoDB: `sudo systemctl restart mongod`

### **Next Steps:**
1. ✅ Start MongoDB
2. ✅ Connect Compass
3. ✅ Run initialization script
4. ✅ Test Python backend connection
5. ✅ Start all services and test end-to-end

---

**Created:** November 1, 2025  
**Updated:** For JURY AI Application with Enhanced Chatbot Storage
