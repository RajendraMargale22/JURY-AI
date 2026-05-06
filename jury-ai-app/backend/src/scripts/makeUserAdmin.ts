import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
import connectDB from '../config/database';

dotenv.config();

const makeUserAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('📝 Updating user to admin role...');
    
    const emailToUpdate = 'adityajare2004@gmail.com';
    
    // Find user by email
    const user = await User.findOne({ email: emailToUpdate.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${emailToUpdate} not found!`);
      console.log('Please register this account first, then run this script.');
      process.exit(1);
    }
    
    // Update user role to admin
    user.role = 'admin';
    user.isEmailVerified = true;
    user.isActive = true;
    await user.save();
    
    console.log('✅ User updated to admin successfully!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🔐 Role: ${user.role}`);
    console.log('\n🎉 You can now login and will be redirected to the admin dashboard!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  }
};

makeUserAdmin();
