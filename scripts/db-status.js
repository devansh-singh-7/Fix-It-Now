/**
 * Quick Database Status Check
 * 
 * Quickly shows the current state of the database
 * 
 * Usage: node scripts/db-status.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');

// Try to load dotenv if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  // Ignore if dotenv not available
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fixitnow';

async function checkStatus() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    console.log('\n📊 Database Status\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const collections = ['users', 'buildings', 'tickets', 'technicians'];
    
    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments();
      const icon = count > 0 ? '✅' : '⚪';
      console.log(`${icon} ${collName.padEnd(15)} ${count} documents`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if ready for ticket creation
    const userCount = await db.collection('users').countDocuments();
    const buildingCount = await db.collection('buildings').countDocuments();
    
    if (userCount === 0) {
      console.log('⚠️  No users found. Create an account at /auth/signup\n');
    } else {
      console.log(`✅ ${userCount} user(s) registered\n`);
    }
    
    if (buildingCount === 0) {
      console.log('⚠️  No buildings found. Create or join a building first\n');
    } else {
      console.log(`✅ ${buildingCount} building(s) available\n`);
    }
    
    if (userCount > 0 && buildingCount > 0) {
      console.log('🎉 System ready for ticket creation!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Make sure MongoDB is running on', MONGODB_URI, '\n');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkStatus();
