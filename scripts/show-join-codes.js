/**
 * Show Available Building Join Codes
 * Run this to see all available buildings and their join codes
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';

async function showJoinCodes() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...\n');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DB_NAME);

    console.log('🏢 AVAILABLE BUILDINGS & JOIN CODES');
    console.log('═══════════════════════════════════════════════════\n');

    const buildings = await db.collection('buildings').find({ isActive: true }).toArray();

    if (buildings.length === 0) {
      console.log('❌ No active buildings found.');
      console.log('Create a building first from the admin panel.\n');
    } else {
      buildings.forEach((building, index) => {
        console.log(`${index + 1}. ${building.name}`);
        console.log(`   📍 Address: ${building.address}`);
        console.log(`   🔑 Join Code: ${building.joinCode}`);
        console.log(`   👤 Manager: ${building.managerName}`);
        console.log(`   📅 Created: ${building.createdAt.toLocaleDateString()}`);
        console.log('');
      });

      console.log('═══════════════════════════════════════════════════');
      console.log('📋 QUICK REFERENCE');
      console.log('═══════════════════════════════════════════════════\n');
      
      console.log('Copy these join codes to share with users:\n');
      buildings.forEach(building => {
        console.log(`• ${building.name}: ${building.joinCode}`);
      });
      
      console.log('\n💡 Users can join by:');
      console.log('1. Going to Dashboard or Settings');
      console.log('2. Clicking "Join Your Building" banner');
      console.log('3. Entering the join code');
      console.log('4. Clicking "Join"\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

showJoinCodes();
