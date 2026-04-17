import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    // Use Google DNS to resolve MongoDB Atlas SRV records
    // (local network DNS may not support SRV record resolution)
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jury-ai';
    
    const conn = await mongoose.connect(mongoURI, {
      family: 4,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
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
