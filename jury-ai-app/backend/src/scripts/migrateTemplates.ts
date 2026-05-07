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
    const testTemplatesCollection = testConn.collection('templates');
    
    // Connect to the jury-ai database
    const targetConn = await mongoose.createConnection(MONGODB_URI as string, { dbName: 'jury-ai' }).asPromise();
    const targetTemplatesCollection = targetConn.collection('templates');

    console.log("Connected to MongoDB Atlas");

    // Get all templates from test
    const templates = await testTemplatesCollection.find({}).toArray();
    console.log(`Found ${templates.length} templates in 'test' database.`);

    if (templates.length > 0) {
      let insertedCount = 0;
      for (const template of templates) {
        const exists = await targetTemplatesCollection.findOne({ _id: template._id });
        if (!exists) {
          await targetTemplatesCollection.insertOne(template);
          insertedCount++;
        }
      }
      
      console.log(`Successfully migrated ${insertedCount} templates to 'jury-ai' database.`);
      
      if (insertedCount === templates.length) {
         await testTemplatesCollection.drop();
         console.log("Dropped templates collection from test database.");
      }
    } else {
      console.log("No templates found in 'test' database to migrate.");
    }
    
    await testConn.close();
    await targetConn.close();
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrateData();
