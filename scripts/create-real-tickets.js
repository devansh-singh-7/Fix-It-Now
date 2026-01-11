/**
 * Create Real Ticket for Current User
 * This creates a proper ticket that will show in the dashboard
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';

async function createRealTicket() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🎫 CREATING REAL TICKET FOR USER\n');
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Use Chris Harris who has proper UID and building
    const user = await db.collection('users').findOne({ 
      firebaseUid: 'OgnN6C2mtnawqeHZHZzaheywJ5y1'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`Creating ticket for: ${user.name}`);
    console.log(`Building: ${user.buildingName}\n`);
    
    const ticket = {
      id: Date.now().toString(),
      title: 'Broken Ceiling Fan in Living Room',
      description: 'The ceiling fan in the living room has stopped working. It makes a clicking sound when turned on but the blades do not rotate.',
      category: 'electrical',
      priority: 'medium',
      status: 'open',
      location: user.buildingName,
      contactPhone: '555-9876',
      imageUrls: [],
      createdByName: user.name,
      buildingId: user.buildingId,
      createdBy: user.firebaseUid,
      timeline: [{
        status: 'open',
        timestamp: new Date(),
        by: user.firebaseUid,
        userName: user.name,
        note: 'Ticket created'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('tickets').insertOne(ticket);
    console.log('✅ Real ticket created!');
    console.log(`   ID: ${ticket.id}`);
    console.log(`   Title: ${ticket.title}\n`);
    
    // Also create one for Devansh Singh (admin)
    const admin = await db.collection('users').findOne({ 
      firebaseUid: 'qVBroM4s8kbWuP3ErnaD4a6nezG3'
    });
    
    if (admin) {
      const adminTicket = {
        id: (Date.now() + 1).toString(),
        title: 'Water Leak in Basement',
        description: 'There is a water leak coming from the ceiling of the basement. Appears to be from the bathroom above.',
        category: 'plumbing',
        priority: 'high',
        status: 'open',
        location: admin.buildingName,
        contactPhone: '555-5432',
        imageUrls: [],
        createdByName: admin.name,
        buildingId: admin.buildingId,
        createdBy: admin.firebaseUid,
        timeline: [{
          status: 'open',
          timestamp: new Date(),
          by: admin.firebaseUid,
          userName: admin.name,
          note: 'Ticket created'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('tickets').insertOne(adminTicket);
      console.log('✅ Admin ticket created!');
      console.log(`   ID: ${adminTicket.id}`);
      console.log(`   Title: ${adminTicket.title}\n`);
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('Now refresh the dashboard to see the tickets!');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createRealTicket();
