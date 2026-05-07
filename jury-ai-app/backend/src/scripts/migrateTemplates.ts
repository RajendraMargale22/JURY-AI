import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import dns from 'dns';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in .env");
  process.exit(1);
}

if (MONGODB_URI.startsWith('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}

async function migrateData() {
  try {
    // Connect to the test database
    const testConn = await mongoose.createConnection(MONGODB_URI as string, { dbName: 'test' }).asPromise();
    const testUsersCollection = testConn.collection('users');

    // Connect to the jury-ai database
    const targetConn = await mongoose.createConnection(MONGODB_URI as string, { dbName: 'jury-ai' }).asPromise();
    const targetUsersCollection = targetConn.collection('users');

    console.log("Connected to MongoDB Atlas");

    // Get all users from test
    const users = await testUsersCollection.find({}).toArray();
    console.log(`Found ${users.length} users in 'test' database.`);

    if (users.length > 0) {
      let insertedCount = 0;
      for (const user of users) {
        const exists = await targetUsersCollection.findOne({ _id: user._id });
        if (!exists) {
          await targetUsersCollection.insertOne(user);
          insertedCount++;
        }
      }

      console.log(`Successfully migrated ${insertedCount} users to 'jury-ai' database.`);

      if (insertedCount === users.length) {
        await testUsersCollection.drop();
        console.log("Dropped users collection from test database.");
      }
    } else {
      console.log("No users found in 'test' database to migrate.");
    }

    await testConn.close();
    await targetConn.close();
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrateData();
