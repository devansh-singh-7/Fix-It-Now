/**
 * Debug Tickets Display Issue
 * This script checks what data the API is returning and why tickets might not be visible
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';

async function debugTicketsDisplay() {
  let client;
  
  try {
    console.log('🔍 DEBUGGING TICKETS DISPLAY ISSUE\n');
    console.log('═══════════════════════════════════════════════════\n');

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // Get all tickets
    console.log('📋 ALL TICKETS IN DATABASE:');
    console.log('───────────────────────────────────────────────────');
    const allTickets = await db.collection('tickets').find({}).toArray();
    console.log(`Total tickets: ${allTickets.length}\n`);

    if (allTickets.length === 0) {
      console.log('❌ No tickets found in database!\n');
      return;
    }

    allTickets.forEach((ticket, index) => {
      console.log(`${index + 1}. Ticket:`);
      console.log(`   ID: ${ticket.id}`);
      console.log(`   Title: ${ticket.title}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Priority: ${ticket.priority || 'N/A'}`);
      console.log(`   Category: ${ticket.category || 'N/A'}`);
      console.log(`   Building ID: ${ticket.buildingId}`);
      console.log(`   Created By: ${ticket.createdBy} (${ticket.createdByName})`);
      console.log(`   Created At: ${ticket.createdAt}`);
      console.log(`   Assigned To: ${ticket.assignedTo || 'Unassigned'}`);
      console.log('');
    });

    // Get users to check their buildingId
    console.log('👥 USERS AND THEIR BUILDINGS:');
    console.log('───────────────────────────────────────────────────');
    const users = await db.collection('users').find({}).toArray();
    
    users.forEach(user => {
      console.log(`- ${user.name || user.email}`);
      console.log(`  UID: ${user.firebaseUid}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Building ID: ${user.buildingId || '❌ NO BUILDING'}`);
      console.log(`  Building Name: ${user.buildingName || 'N/A'}`);
      console.log('');
    });

    // Check what each user would see
    console.log('🔍 WHAT EACH USER SHOULD SEE:');
    console.log('───────────────────────────────────────────────────');
    
    for (const user of users) {
      console.log(`\n${user.name || user.email} (${user.role}):`);
      
      if (!user.buildingId) {
        console.log('  ❌ No building - will see no tickets');
        continue;
      }

      const filter = { buildingId: user.buildingId };
      
      if (user.role === 'technician') {
        filter.assignedTo = user.firebaseUid;
      } else if (user.role === 'resident') {
        filter.createdBy = user.firebaseUid;
      }

      const userTickets = await db.collection('tickets').find(filter).toArray();
      
      console.log(`  Building ID: ${user.buildingId}`);
      console.log(`  Filter: ${JSON.stringify(filter)}`);
      console.log(`  Tickets visible: ${userTickets.length}`);
      
      if (userTickets.length > 0) {
        userTickets.forEach(t => {
          console.log(`    - ${t.title} (${t.status})`);
        });
      } else {
        console.log('    ❌ No tickets match the filter');
        
        // Debug why
        const ticketsInBuilding = await db.collection('tickets').find({ buildingId: user.buildingId }).toArray();
        console.log(`    Building has ${ticketsInBuilding.length} total tickets`);
        
        if (ticketsInBuilding.length > 0 && user.role === 'resident') {
          const createdByUser = ticketsInBuilding.filter(t => t.createdBy === user.firebaseUid);
          console.log(`    Tickets created by this user: ${createdByUser.length}`);
          if (createdByUser.length === 0) {
            console.log(`    👉 User hasn't created any tickets yet`);
          }
        }
        
        if (ticketsInBuilding.length > 0 && user.role === 'technician') {
          const assignedToUser = ticketsInBuilding.filter(t => t.assignedTo === user.firebaseUid);
          console.log(`    Tickets assigned to this technician: ${assignedToUser.length}`);
          if (assignedToUser.length === 0) {
            console.log(`    👉 No tickets assigned to this technician yet`);
          }
        }
      }
    }

    // Check for common issues
    console.log('\n\n🔧 COMMON ISSUES CHECK:');
    console.log('═══════════════════════════════════════════════════\n');

    // Issue 1: BuildingId mismatch
    const uniqueBuildingIds = new Set();
    allTickets.forEach(t => uniqueBuildingIds.add(t.buildingId));
    const buildings = await db.collection('buildings').find({}).toArray();
    
    console.log('1. Building ID Consistency:');
    console.log(`   Ticket building IDs: ${Array.from(uniqueBuildingIds).join(', ')}`);
    console.log(`   Actual building IDs: ${buildings.map(b => b.id).join(', ')}`);
    
    const mismatch = Array.from(uniqueBuildingIds).some(id => !buildings.find(b => b.id === id));
    if (mismatch) {
      console.log('   ⚠️  WARNING: Some tickets have buildingId that doesn\'t match any building!');
    } else {
      console.log('   ✅ All ticket buildingIds match actual buildings');
    }

    // Issue 2: Missing createdBy field
    console.log('\n2. Ticket createdBy Field:');
    const ticketsWithoutCreatedBy = allTickets.filter(t => !t.createdBy);
    console.log(`   Tickets with createdBy: ${allTickets.length - ticketsWithoutCreatedBy.length}`);
    console.log(`   Tickets missing createdBy: ${ticketsWithoutCreatedBy.length}`);
    if (ticketsWithoutCreatedBy.length > 0) {
      console.log('   ⚠️  WARNING: Some tickets are missing createdBy field!');
      ticketsWithoutCreatedBy.forEach(t => {
        console.log(`      - ${t.title} (ID: ${t.id})`);
      });
    } else {
      console.log('   ✅ All tickets have createdBy field');
    }

    // Issue 3: Status field validation
    console.log('\n3. Ticket Status Values:');
    const statusCounts = {};
    allTickets.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Debug complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

debugTicketsDisplay();
