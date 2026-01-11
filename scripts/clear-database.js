/**
 * Clear Database Script
 * 
 * This script deletes all data from MongoDB collections to provide a clean slate.
 * Run this when you want to start fresh with new data.
 * 
 * Usage: node scripts/clear-database.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');

// Try to load dotenv if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  console.log('ℹ️  dotenv not found, using environment variables or defaults');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fixitnow';

const COLLECTIONS = [
  'users',
  'buildings',
  'tickets',
  'technicians',
  'preventive_maintenance',
  'dashboard_stats',
  'invoices',
  'predictions',
];

async function clearDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`URI: ${MONGODB_URI}`);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    console.log(`\n🗄️  Database: ${DB_NAME}`);
    
    // List all collections
    const existingCollections = await db.listCollections().toArray();
    console.log(`\n📋 Found ${existingCollections.length} collections:`);
    existingCollections.forEach(col => console.log(`   - ${col.name}`));
    
    console.log('\n🗑️  Clearing all collections...\n');
    
    let totalDeleted = 0;
    
    for (const collectionName of COLLECTIONS) {
      try {
        const collection = db.collection(collectionName);
        
        // Count documents before deletion
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`   ✓ ${collectionName}: Deleted ${result.deletedCount} documents`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`   - ${collectionName}: Already empty`);
        }
      } catch {
        console.log(`   ⚠ ${collectionName}: Collection doesn't exist or error occurred`);
      }
    }
    
    console.log(`\n✅ Database cleared successfully!`);
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log('\n💡 You can now add fresh data to the database.');
    console.log('   Start by creating a user account through the signup page.');
    
  } catch (error) {
    console.error('\n❌ Error clearing database:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB\n');
    }
  }
}

// Run the script
clearDatabase();
