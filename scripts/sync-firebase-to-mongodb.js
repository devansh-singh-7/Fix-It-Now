/**
 * Sync Firebase to MongoDB Script
 * 
 * This script helps when Firebase Auth has users but MongoDB doesn't.
 * It's useful after clearing the database.
 * 
 * Note: This is for reference. The system now auto-syncs on sign-in.
 * 
 * Usage: node scripts/sync-firebase-to-mongodb.js
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
const SUPER_ADMIN_EMAIL = 'devanshsingh@gmail.com';

async function showSyncStatus() {
  let client;
  
  try {
    console.log('\n🔄 Firebase <-> MongoDB Sync Status\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Count users in MongoDB
    const userCount = await usersCollection.countDocuments();
    console.log(`📊 Users in MongoDB: ${userCount}\n`);
    
    if (userCount > 0) {
      console.log('👥 Registered Users:\n');
      const users = await usersCollection.find({}, { 
        projection: { email: 1, name: 1, role: 1, firebaseUid: 1 } 
      }).toArray();
      
      users.forEach((user, index) => {
        const adminBadge = user.email === SUPER_ADMIN_EMAIL ? '🔐 ADMIN' : '';
        console.log(`   ${index + 1}. ${user.name || 'Unknown'}`);
        console.log(`      Email: ${user.email || 'N/A'} ${adminBadge}`);
        console.log(`      Role: ${user.role || 'N/A'}`);
        console.log(`      UID: ${user.firebaseUid || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('ℹ️  Auto-Sync Information:\n');
    console.log('   The system now automatically syncs Firebase users');
    console.log('   to MongoDB when they sign in.\n');
    console.log('   If you have a Firebase account but no MongoDB profile:');
    console.log('   1. Just sign in at http://localhost:3000/auth/signin');
    console.log('   2. The system will automatically create your profile');
    console.log('   3. Super admin email gets admin role automatically\n');
    
    console.log('🔐 Super Admin: ' + SUPER_ADMIN_EMAIL + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB\n');
    }
  }
}

// Run the script
showSyncStatus();
