// MongoDB Initialization Script for JURY AI
// Run with: mongosh < setup-mongodb.js

print("🚀 Starting JURY AI MongoDB Setup...\n");

// Switch to main database
use jury-ai

print("📦 Creating collections with schema validation...\n");

// 1. Users Collection with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password", "role"],
      properties: {
        name: { bsonType: "string", description: "User's full name" },
        email: { bsonType: "string", description: "User's email address" },
        password: { bsonType: "string", description: "Hashed password" },
        role: { 
          enum: ["user", "lawyer", "admin"],
          description: "User role"
        },
        avatar: { bsonType: "string" },
        isVerified: { bsonType: "bool" },
        isActive: { bsonType: "bool" },
        profile: { bsonType: "object" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});
print("✅ Created 'users' collection");

// 2. Chats Collection
db.createCollection("chats", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "type", "title"],
      properties: {
        userId: { bsonType: "string" },
        lawyerId: { bsonType: "string" },
        type: { enum: ["ai", "lawyer"] },
        title: { bsonType: "string" },
        status: { enum: ["active", "closed", "archived"] },
        messages: { bsonType: "array" }
      }
    }
  }
});
print("✅ Created 'chats' collection");

// 3. Chatbot Sessions Collection
db.createCollection("chatbot_sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["sessionId", "userId", "startTime"],
      properties: {
        sessionId: { bsonType: "string" },
        userId: { bsonType: "string" },
        startTime: { bsonType: "date" },
        endTime: { bsonType: "date" },
        queries: { bsonType: "array" },
        satisfaction_rating: { 
          bsonType: "int",
          minimum: 1,
          maximum: 5
        }
      }
    }
  }
});
print("✅ Created 'chatbot_sessions' collection");

// 4. Legal Queries Collection (Main chatbot storage)
db.createCollection("legal_queries", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["query", "userId", "timestamp"],
      properties: {
        query: { bsonType: "string" },
        userId: { bsonType: "string" },
        aiResponse: { bsonType: "string" },
        timestamp: { bsonType: "date" },
        category: { bsonType: "string" },
        confidence_score: { 
          bsonType: "double",
          minimum: 0,
          maximum: 1
        },
        sources: { bsonType: "array" },
        feedback: { 
          enum: ["helpful", "not_helpful", "partially_helpful", null]
        }
      }
    }
  }
});
print("✅ Created 'legal_queries' collection");

// 5. Other collections (no strict validation for flexibility)
db.createCollection("communityposts");
print("✅ Created 'communityposts' collection");

db.createCollection("templates");
print("✅ Created 'templates' collection");

db.createCollection("documents");
print("✅ Created 'documents' collection");

db.createCollection("lawyers");
print("✅ Created 'lawyers' collection");

db.createCollection("analytics");
print("✅ Created 'analytics' collection");

print("\n⚡ Creating performance indexes...\n");

// Users Indexes
db.users.createIndex({ email: 1 }, { unique: true, name: "email_unique" });
db.users.createIndex({ role: 1 }, { name: "role_index" });
db.users.createIndex({ createdAt: -1 }, { name: "created_desc" });
db.users.createIndex({ isActive: 1 }, { name: "active_index" });
print("✅ Created indexes for 'users'");

// Chats Indexes
db.chats.createIndex({ userId: 1 }, { name: "userId_index" });
db.chats.createIndex({ lawyerId: 1 }, { name: "lawyerId_index" });
db.chats.createIndex({ type: 1 }, { name: "type_index" });
db.chats.createIndex({ status: 1 }, { name: "status_index" });
db.chats.createIndex({ createdAt: -1 }, { name: "created_desc" });
db.chats.createIndex({ userId: 1, type: 1 }, { name: "user_type_compound" });
print("✅ Created indexes for 'chats'");

// Chatbot Sessions Indexes
db.chatbot_sessions.createIndex({ sessionId: 1 }, { unique: true, name: "sessionId_unique" });
db.chatbot_sessions.createIndex({ userId: 1 }, { name: "userId_index" });
db.chatbot_sessions.createIndex({ startTime: -1 }, { name: "startTime_desc" });
print("✅ Created indexes for 'chatbot_sessions'");

// Legal Queries Indexes (Most Important!)
db.legal_queries.createIndex({ userId: 1 }, { name: "userId_index" });
db.legal_queries.createIndex({ timestamp: -1 }, { name: "timestamp_desc" });
db.legal_queries.createIndex({ category: 1 }, { name: "category_index" });
db.legal_queries.createIndex({ "query": "text", "aiResponse": "text" }, { name: "fulltext_search" });
print("✅ Created indexes for 'legal_queries'");

// Community Posts Indexes
db.communityposts.createIndex({ authorId: 1 }, { name: "authorId_index" });
db.communityposts.createIndex({ createdAt: -1 }, { name: "created_desc" });
db.communityposts.createIndex({ category: 1 }, { name: "category_index" });
db.communityposts.createIndex({ "title": "text", "content": "text" }, { name: "fulltext_search" });
print("✅ Created indexes for 'communityposts'");

// Templates Indexes
db.templates.createIndex({ category: 1 }, { name: "category_index" });
db.templates.createIndex({ isPremium: 1 }, { name: "premium_index" });
db.templates.createIndex({ "title": "text", "description": "text" }, { name: "fulltext_search" });
print("✅ Created indexes for 'templates'");

// Documents Indexes
db.documents.createIndex({ userId: 1 }, { name: "userId_index" });
db.documents.createIndex({ uploadDate: -1 }, { name: "uploadDate_desc" });
db.documents.createIndex({ type: 1 }, { name: "type_index" });
print("✅ Created indexes for 'documents'");

// Analytics Indexes
db.analytics.createIndex({ timestamp: -1 }, { name: "timestamp_desc" });
db.analytics.createIndex({ eventType: 1 }, { name: "eventType_index" });
print("✅ Created indexes for 'analytics'");

print("\n📊 Database Statistics:\n");
print("Collections:", db.getCollectionNames().length);
print("Database:", db.getName());

print("\n✨ JURY AI MongoDB Setup Complete!\n");
print("📝 Collections created:");
db.getCollectionNames().forEach(function(col) {
    print("   -", col);
});

print("\n🔗 Connection string: mongodb://localhost:27017/jury-ai");
print("💡 Use MongoDB Compass to visualize your data!\n");
