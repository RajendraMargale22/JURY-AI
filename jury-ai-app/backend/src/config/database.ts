import mongoose from 'mongoose';
import dns from 'dns';

// Use a scoped DNS resolver for MongoDB Atlas SRV resolution
// without overriding the global process-wide DNS servers
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  try {
    // Only override global DNS if using Atlas (mongodb+srv://)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jury-ai';
    if (mongoURI.startsWith('mongodb+srv://')) {
      // SRV resolution requires global DNS override for mongoose
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    }
    
    const conn = await mongoose.connect(mongoURI, {
      dbName: 'jury-ai',
      family: 4,
      serverSelectionTimeoutMS: 10000,  // 10s — avoids blocking health checks
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected — Mongoose will auto-reconnect');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.warn('⚠️ Server will continue running without database connection.');
  }
};

export default connectDB;

