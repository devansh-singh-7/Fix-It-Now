/**
 * Database Initialization Script
 * 
 * Run this script to set up MongoDB collections and indexes.
 * Usage: node scripts/init-db.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixitnow';

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('fixitnow');

    // Create collections
    console.log('\n📁 Creating collections...');
    
    const collections = ['users', 'tickets', 'technicians', 'preventive_maintenance', 'dashboard_stats'];
    
    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      if (!exists) {
        await db.createCollection(collectionName);
        console.log(`  ✓ Created ${collectionName}`);
      } else {
        console.log(`  ⊙ ${collectionName} already exists`);
      }
    }

    // Create indexes
    console.log('\n🔍 Creating indexes...');

    // Users indexes
    await db.collection('users').createIndex({ firebaseUid: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ phoneNumber: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ role: 1 });
    console.log('  ✓ Users indexes created');

    // Tickets indexes
    await db.collection('tickets').createIndex({ status: 1 });
    await db.collection('tickets').createIndex({ priority: 1 });
    await db.collection('tickets').createIndex({ createdBy: 1 });
    await db.collection('tickets').createIndex({ assignedTo: 1 });
    await db.collection('tickets').createIndex({ createdAt: -1 });
    await db.collection('tickets').createIndex({ status: 1, createdAt: -1 });
    await db.collection('tickets').createIndex({ assignedTo: 1, status: 1 });
    console.log('  ✓ Tickets indexes created');

    // Technicians indexes
    await db.collection('technicians').createIndex({ userId: 1 }, { unique: true });
    await db.collection('technicians').createIndex({ status: 1 });
    await db.collection('technicians').createIndex({ skills: 1 });
    console.log('  ✓ Technicians indexes created');

    // Preventive maintenance indexes
    await db.collection('preventive_maintenance').createIndex({ equipmentId: 1 });
    await db.collection('preventive_maintenance').createIndex({ nextMaintenanceDate: 1 });
    await db.collection('preventive_maintenance').createIndex({ status: 1 });
    console.log('  ✓ Preventive maintenance indexes created');

    console.log('\n🎉 Database initialization complete!');
    console.log('\nDatabase: fixitnow');
    console.log('Collections:', collections.join(', '));

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed');
  }
}

initializeDatabase();
