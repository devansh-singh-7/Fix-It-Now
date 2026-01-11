/**
 * Test Ticket Creation Flow
 * This script tests:
 * 1. MongoDB connectivity
 * 2. User profile with buildingId
 * 3. Ticket creation
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';

async function testTicketCreation() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully\n');

    const db = client.db(DB_NAME);

    // Test 1: Check collections exist
    console.log('📦 Checking collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Found collections:', collectionNames.join(', '));
    
    const requiredCollections = ['users', 'tickets', 'buildings'];
    const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
    if (missingCollections.length > 0) {
      console.log('⚠️  Missing collections:', missingCollections.join(', '));
    } else {
      console.log('✅ All required collections exist\n');
    }

    // Test 2: Check users
    console.log('👥 Checking users...');
    const usersCount = await db.collection('users').countDocuments();
    console.log(`Total users: ${usersCount}`);
    
    const usersWithBuilding = await db.collection('users').countDocuments({ buildingId: { $exists: true, $ne: null } });
    console.log(`Users with buildingId: ${usersWithBuilding}`);
    
    const usersWithoutBuilding = await db.collection('users').countDocuments({ $or: [{ buildingId: { $exists: false } }, { buildingId: null }] });
    console.log(`Users without buildingId: ${usersWithoutBuilding}\n`);

    // Test 3: Check buildings
    console.log('🏢 Checking buildings...');
    const buildingsCount = await db.collection('buildings').countDocuments();
    console.log(`Total buildings: ${buildingsCount}`);
    
    if (buildingsCount > 0) {
      const buildings = await db.collection('buildings').find({}).limit(5).toArray();
      console.log('Sample buildings:');
      buildings.forEach(b => {
        console.log(`  - ${b.name} (ID: ${b.id || b._id}) - Join Code: ${b.joinCode}`);
      });
    } else {
      console.log('⚠️  No buildings found! Users need buildings to join.\n');
    }
    console.log('');

    // Test 4: Check tickets
    console.log('🎫 Checking tickets...');
    const ticketsCount = await db.collection('tickets').countDocuments();
    console.log(`Total tickets: ${ticketsCount}`);
    
    if (ticketsCount > 0) {
      const recentTickets = await db.collection('tickets').find({}).sort({ createdAt: -1 }).limit(3).toArray();
      console.log('Recent tickets:');
      recentTickets.forEach(t => {
        console.log(`  - ${t.title} (Building: ${t.buildingId || 'N/A'}, Status: ${t.status})`);
      });
    }
    console.log('');

    // Test 5: Create a test ticket
    console.log('🧪 Testing ticket creation...');
    
    // Find or create a test user with buildingId
    let testUser = await db.collection('users').findOne({ 
      buildingId: { $exists: true, $ne: null } 
    });
    
    if (!testUser) {
      console.log('⚠️  No users with buildingId found. Need to join a building first.\n');
      
      // Check if any buildings exist to join
      const anyBuilding = await db.collection('buildings').findOne({});
      if (!anyBuilding) {
        console.log('❌ No buildings exist. Creating a test building...');
        
        const testBuilding = {
          id: Date.now().toString(),
          name: 'Test Building',
          address: '123 Test St',
          joinCode: 'TEST-' + Math.random().toString(36).substring(7).toUpperCase(),
          managerId: 'test-manager',
          managerName: 'Test Manager',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('buildings').insertOne(testBuilding);
        console.log(`✅ Created test building: ${testBuilding.name} (Join Code: ${testBuilding.joinCode})\n`);
        console.log(`📝 Users can now join this building using join code: ${testBuilding.joinCode}\n`);
      } else {
        console.log(`📝 Building exists: ${anyBuilding.name} (Join Code: ${anyBuilding.joinCode})`);
        console.log('Users need to join this building before creating tickets.\n');
      }
      
      console.log('⏭️  Skipping ticket creation test - no users with buildingId\n');
    } else {
      console.log(`Found user: ${testUser.name || testUser.email} (Building: ${testUser.buildingName})`);
      
      const testTicket = {
        id: Date.now().toString(),
        title: 'Test Ticket - Automated',
        description: 'This is a test ticket created by the test script',
        category: 'plumbing',
        priority: 'medium',
        status: 'open',
        location: testUser.buildingName || 'Test Location',
        contactPhone: testUser.phoneNumber || '555-0000',
        imageUrls: [],
        createdByName: testUser.name || testUser.email,
        buildingId: testUser.buildingId,
        createdBy: testUser.firebaseUid,
        timeline: [{
          status: 'open',
          timestamp: new Date(),
          by: testUser.firebaseUid,
          userName: testUser.name || testUser.email,
          note: 'Ticket created'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('tickets').insertOne(testTicket);
      console.log(`✅ Test ticket created successfully (ID: ${testTicket.id})\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ MongoDB Connection: OK`);
    console.log(`✅ Database: ${DB_NAME}`);
    console.log(`📦 Collections: ${collectionNames.length}`);
    console.log(`👥 Users: ${usersCount} (${usersWithBuilding} with building, ${usersWithoutBuilding} without)`);
    console.log(`🏢 Buildings: ${buildingsCount}`);
    console.log(`🎫 Tickets: ${ticketsCount}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (usersWithoutBuilding > 0 && buildingsCount > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('Some users haven\'t joined a building yet.');
      console.log('They need to:');
      console.log('1. Go to Settings or Profile');
      console.log('2. Enter a building join code');
      console.log('3. Join the building');
      console.log('4. Then they can create tickets\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

testTicketCreation();
