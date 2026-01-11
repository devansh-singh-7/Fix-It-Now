/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkTickets() {
  try {
    await client.connect();
    const db = client.db('fixitnow');
    
    const buildings = await db.collection('buildings').find().toArray();
    const tickets = await db.collection('tickets').find().toArray();
    
    console.log('\n🏢 Buildings:');
    buildings.forEach(b => {
      console.log(`  - ${b.name} (ID: ${b._id})`);
    });
    
    console.log('\n🎫 Tickets by Building:');
    const grouped = {};
    tickets.forEach(t => {
      if (!grouped[t.buildingId]) grouped[t.buildingId] = 0;
      grouped[t.buildingId]++;
    });
    
    Object.entries(grouped).forEach(([bid, count]) => {
      const building = buildings.find(b => b._id.toString() === bid);
      console.log(`  - ${building ? building.name : 'Unknown'} (${bid}): ${count} tickets`);
    });
    
  } finally {
    await client.close();
  }
}

checkTickets();
