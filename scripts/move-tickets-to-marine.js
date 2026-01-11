/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function moveTickets() {
  try {
    await client.connect();
    const db = client.db('fixitnow');
    
    // Get the Marine View Building ID
    const marineBuilding = await db.collection('buildings').findOne({ name: 'Marine View Building' });
    const sunsetBuilding = await db.collection('buildings').findOne({ name: 'Sunset Apartments' });
    
    if (!marineBuilding) {
      console.error('❌ Marine View Building not found');
      return;
    }
    
    console.log(`\n📦 Moving tickets from Sunset Apartments to Marine View Building...`);
    
    // Update all tickets from Sunset to Marine View
    const result = await db.collection('tickets').updateMany(
      { buildingId: sunsetBuilding._id.toString() },
      { $set: { buildingId: marineBuilding._id.toString() } }
    );
    
    console.log(`✅ Moved ${result.modifiedCount} tickets to Marine View Building`);
    
    // Also update users (technicians and residents)
    const usersResult = await db.collection('users').updateMany(
      { buildingId: sunsetBuilding._id.toString() },
      { $set: { buildingId: marineBuilding._id.toString() } }
    );
    
    console.log(`✅ Moved ${usersResult.modifiedCount} users to Marine View Building`);
    
    // Delete the Sunset Apartments building
    await db.collection('buildings').deleteOne({ _id: sunsetBuilding._id });
    console.log(`✅ Removed Sunset Apartments building`);
    
    console.log(`\n✅ All sample data now assigned to Marine View Building!`);
    
  } finally {
    await client.close();
  }
}

moveTickets();
