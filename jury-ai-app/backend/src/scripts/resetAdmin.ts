import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const run = async () => {
  const mongoURI = process.env.MONGODB_URI || '';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI, { family: 4, serverSelectionTimeoutMS: 30000 });
  console.log('Connected!');

  // Reset admin password
  const admin = await User.findOne({ email: 'adityajare2004@gmail.com' });
  if (admin) {
    admin.password = 'Aditya@2004';
    await admin.save(); // pre-save hook will hash the password
    console.log('✅ Admin password reset to: Aditya@2004');
    console.log(`   Admin role: ${admin.role}`);
  } else {
    console.log('Admin user not found, creating...');
    const newAdmin = await User.create({
      name: 'Aditya Jare',
      email: 'adityajare2004@gmail.com',
      password: 'Aditya@2004',
      role: 'admin',
      isVerified: true,
      isEmailVerified: true,
      isActive: true,
    });
    console.log('✅ Admin user created:', newAdmin.email);
  }

  // Create test users
  const testUsers = [
    { name: 'Rajendra Margale', email: 'rajendramargale2004@gmail.com', password: 'Rajendra@2004', role: 'user' },
    { name: 'Faizal Mistry', email: 'faizalmistry2004@gmail.com', password: 'Faizal@2004', role: 'lawyer' },
    { name: 'Mayur Patil', email: 'mayurpatil2004@gmail.com', password: 'Mayur@2004', role: 'lawyer' },
    { name: 'Ashpak Shaikh', email: 'ashpakshaikh2004@gmail.com', password: 'Ashpak@2004', role: 'user' },
  ];

  for (const u of testUsers) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`⏩ User ${u.email} already exists (role: ${exists.role})`);
    } else {
      await User.create({ ...u, isVerified: true, isEmailVerified: true, isActive: true });
      console.log(`✅ Created ${u.role}: ${u.email}`);
    }
  }

  // Show all users
  const allUsers = await User.find({}, 'name email role isActive');
  console.log('\n📋 All users in database:');
  allUsers.forEach(u => console.log(`   ${u.role.padEnd(8)} ${u.email} (${u.name})`));

  await mongoose.disconnect();
  console.log('\nDone!');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
