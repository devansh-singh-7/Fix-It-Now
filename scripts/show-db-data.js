/**
 * Script to show all data in MongoDB database
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/fixitnow';

async function showData() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db('fixitnow');

        // Show Users
        console.log('═══════════════════════════════════════════════════');
        console.log('👤 USERS');
        console.log('═══════════════════════════════════════════════════');
        const users = await db.collection('users').find({}).toArray();
        console.log(`Total users: ${users.length}\n`);

        users.forEach((u, i) => {
            console.log(`--- User ${i + 1} ---`);
            console.log(`  firebaseUid: ${u.firebaseUid}`);
            console.log(`  email: ${u.email || 'N/A'}`);
            console.log(`  name: ${u.name || u.displayName || 'N/A'}`);
            console.log(`  role: ${u.role}`);
            console.log(`  buildingId: ${u.buildingId || 'NOT SET'}`);
            console.log(`  buildingName: ${u.buildingName || 'NOT SET'}`);
            console.log(`  isActive: ${u.isActive}`);
            console.log('');
        });

        // Show Buildings
        console.log('═══════════════════════════════════════════════════');
        console.log('🏢 BUILDINGS');
        console.log('═══════════════════════════════════════════════════');
        const buildings = await db.collection('buildings').find({}).toArray();
        console.log(`Total buildings: ${buildings.length}\n`);

        buildings.forEach((b, i) => {
            console.log(`--- Building ${i + 1} ---`);
            console.log(`  id: ${b.id}`);
            console.log(`  name: ${b.name}`);
            console.log(`  address: ${b.address}`);
            console.log(`  joinCode: ${b.joinCode}`);
            console.log(`  adminId: ${b.adminId}`);
            console.log(`  isActive: ${b.isActive}`);
            console.log('');
        });

        // Show Tickets
        console.log('═══════════════════════════════════════════════════');
        console.log('🎫 TICKETS');
        console.log('═══════════════════════════════════════════════════');
        const tickets = await db.collection('tickets').find({}).sort({ createdAt: -1 }).toArray();
        console.log(`Total tickets: ${tickets.length}\n`);

        tickets.forEach((t, i) => {
            console.log(`--- Ticket ${i + 1} ---`);
            console.log(`  id: ${t.id}`);
            console.log(`  title: ${t.title}`);
            console.log(`  status: ${t.status}`);
            console.log(`  priority: ${t.priority}`);
            console.log(`  category: ${t.category}`);
            console.log(`  createdBy: ${t.createdBy}`);
            console.log(`  createdByName: ${t.createdByName}`);
            console.log(`  buildingId: ${t.buildingId}`);
            console.log(`  assignedTo: ${t.assignedTo || 'NOT ASSIGNED'}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════');
        console.log('📊 SUMMARY');
        console.log('═══════════════════════════════════════════════════');
        console.log(`Users: ${users.length}`);
        console.log(`Buildings: ${buildings.length}`);
        console.log(`Tickets: ${tickets.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n👋 Connection closed');
    }
}

showData();
