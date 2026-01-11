/**
 * Ensure Database Indexes
 * 
 * This script ensures that all necessary performance indexes exist in the MongoDB database.
 * Run this during deployment or startup.
 * 
 * Usage: node scripts/ensure-indexes.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitnow';

async function ensureIndexes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db('fixitnow');
    console.log('✅ Connected to database:', db.databaseName);

    console.log('\n🔍 Ensuring Indexes...');

    // --- Tickets Collection ---
    console.log('  👉 Tickets...');
    // Requested by user: optimize dashboard queries
    await db.collection('tickets').createIndex({ buildingId: 1, status: 1 });
    // Other common access patterns
    await db.collection('tickets').createIndex({ buildingId: 1 });
    await db.collection('tickets').createIndex({ assignedTo: 1, status: 1 });
    await db.collection('tickets').createIndex({ createdBy: 1 });
    await db.collection('tickets').createIndex({ createdAt: -1 });
    console.log('     ✓ Created { buildingId: 1, status: 1 }');
    console.log('     ✓ Created others (buildingId, assignedTo, etc.)');

    // --- Users Collection ---
    console.log('  👉 Users...');
    await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ buildingId: 1 }); // Finding users in a building
    console.log('     ✓ Created { firebaseUid: 1 }, { buildingId: 1 }');

    // --- Buildings Collection ---
    console.log('  👉 Buildings...');
    await db.collection('buildings').createIndex({ id: 1 }, { unique: true });
    await db.collection('buildings').createIndex({ joinCode: 1 }, { unique: true }); // Fast lookup for joining
    await db.collection('buildings').createIndex({ adminId: 1 }); // Fast lookup for admin dashboard
    console.log('     ✓ Created { joinCode: 1 }, { adminId: 1 }');

    // --- Rate Limit Collection ---
    console.log('  👉 Rate Limits...');
    // Ensure TTL index for rate limiting (if not already handled by app code)
    await db.collection('rate_limits').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
    await db.collection('rate_limits').createIndex({ key: 1 });
    console.log('     ✓ Created TTL index on createdAt');

    console.log('\n✅ All indexes verified/created successfully.');

  } catch (error) {
    console.error('❌ Error ensuring indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

ensureIndexes();
