/**
 * MongoDB Index Setup Script for JURY-AI
 *
 * Adds indexes that are critical for query performance on the
 * Users (lawyers), Templates, and Chats collections.
 *
 * Run with:  npx ts-node src/scripts/createIndexes.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

async function createIndexes() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jury-ai';

  if (mongoURI.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }

  await mongoose.connect(mongoURI, { family: 4, serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not available');
  }

  // --- Users collection (Lawyer queries) ---
  console.log('\n📌 Creating indexes on "users" collection...');
  const users = db.collection('users');
  await users.createIndex({ role: 1, isActive: 1 });
  await users.createIndex({ role: 1, lawyerVerificationStatus: 1 });
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ specialization: 1 });
  await users.createIndex({ city: 1 });
  console.log('   ✅ Users indexes created');

  // --- Templates collection ---
  console.log('📌 Creating indexes on "templates" collection...');
  const templates = db.collection('templates');
  await templates.createIndex({ isActive: 1, createdAt: -1 });
  await templates.createIndex({ isActive: 1, category: 1 });
  await templates.createIndex(
    { title: 'text', description: 'text' },
    { name: 'template_text_search' }
  );
  console.log('   ✅ Templates indexes created');

  // --- Chats collection ---
  console.log('📌 Creating indexes on "chats" collection...');
  const chats = db.collection('chats');
  await chats.createIndex({ userId: 1, createdAt: -1 });
  console.log('   ✅ Chats indexes created');

  // --- Legal queries collection (chatbot backend) ---
  console.log('📌 Creating indexes on "legal_queries" collection...');
  const legalQueries = db.collection('legal_queries');
  await legalQueries.createIndex({ userId: 1, timestamp: -1 });
  await legalQueries.createIndex({ timestamp: -1 });
  console.log('   ✅ Legal queries indexes created');

  // --- Analytics collection (chatbot backend) ---
  console.log('📌 Creating indexes on "analytics" collection...');
  const analytics = db.collection('analytics');
  await analytics.createIndex({ timestamp: -1 });
  await analytics.createIndex({ eventType: 1, timestamp: -1 });
  console.log('   ✅ Analytics indexes created');

  console.log('\n🎉 All indexes created successfully!');
  await mongoose.connection.close();
  process.exit(0);
}

createIndexes().catch((err) => {
  console.error('❌ Failed to create indexes:', err);
  process.exit(1);
});
