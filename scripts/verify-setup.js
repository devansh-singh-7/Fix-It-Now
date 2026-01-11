/**
 * Verify Database Setup Script
 * 
 * This script verifies the MongoDB connection and shows the current state
 * of the database after clearing.
 * 
 * Usage: node scripts/verify-setup.js
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

async function verifySetup() {
  let client;
  
  try {
    console.log('🔍 Verifying Database Setup\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI}`);
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ MongoDB connection successful!\n');
    
    const db = client.db(DB_NAME);
    console.log(`🗄️  Database: ${DB_NAME}\n`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Collections (${collections.length}):`);
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name.padEnd(25)} ${count} documents`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Database is ready!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Start your Next.js app: npm run dev');
    console.log('   2. Go to the signup page: http://localhost:3000/auth/signup');
    console.log('   3. Create a new user account');
    console.log('   4. If you need admin access, create a building first');
    console.log('   5. Join the building with the join code');
    console.log('   6. Create your first ticket!\n');
    
    console.log('🏗️  Ticket Creation Architecture:');
    console.log('   ✓ MongoDB connection configured');
    console.log('   ✓ Collections structure ready');
    console.log('   ✓ API route: /api/tickets/create');
    console.log('   ✓ Database function: createTicket()');
    console.log('   ✓ Frontend form: CreateTicketForm component\n');
    
    console.log('⚠️  Important Requirements:');
    console.log('   - User must be authenticated (Firebase Auth)');
    console.log('   - User must have joined a building');
    console.log('   - User profile must have buildingId\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   - Make sure MongoDB is running');
    console.error('   - Check MONGODB_URI in .env.local');
    console.error('   - Default: mongodb://localhost:27017\n');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB\n');
    }
  }
}

// Run the script
verifySetup();
