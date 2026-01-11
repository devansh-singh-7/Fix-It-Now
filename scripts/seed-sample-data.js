/* eslint-disable @typescript-eslint/no-require-imports */
// Script to seed sample data for testing and demo purposes
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'fixitnow';

async function seedSampleData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);

    // Get the admin user (should exist)
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    console.log(`✅ Found admin user: ${adminUser.name}`);

    // Create sample building if none exists
    let building = await db.collection('buildings').findOne({ adminId: adminUser._id.toString() });
    
    if (!building) {
      console.log('📦 Creating sample building...');
      const buildingResult = await db.collection('buildings').insertOne({
        name: 'Sunset Apartments',
        address: '123 Main Street, Downtown City, CA 90210',
        adminId: adminUser._id.toString(),
        joinCode: 'SUN-123-APT',
        createdAt: new Date('2025-12-01'),
        updatedAt: new Date('2025-12-01'),
        isActive: true,
        totalUnits: 50,
        floors: 5
      });
      building = await db.collection('buildings').findOne({ _id: buildingResult.insertedId });
      console.log(`✅ Created building: ${building.name} (Join Code: ${building.joinCode})`);
    } else {
      console.log(`✅ Using existing building: ${building.name}`);
    }

    // Update admin user with buildingId
    await db.collection('users').updateOne(
      { _id: adminUser._id },
      { $set: { buildingId: building._id.toString() } }
    );
    console.log('✅ Updated admin user with buildingId');

    // Create sample technicians
    console.log('👷 Creating sample technicians...');
    const technicians = [
      {
        firebaseUid: 'tech_' + Date.now() + '_1',
        name: 'John Smith',
        email: 'john.smith@fixitnow.com',
        role: 'technician',
        buildingId: building._id.toString(),
        specialties: ['HVAC', 'Electrical'],
        isActive: true,
        createdAt: new Date('2025-12-05'),
        updatedAt: new Date('2025-12-05')
      },
      {
        firebaseUid: 'tech_' + Date.now() + '_2',
        name: 'Maria Garcia',
        email: 'maria.garcia@fixitnow.com',
        role: 'technician',
        buildingId: building._id.toString(),
        specialties: ['Plumbing', 'General Maintenance'],
        isActive: true,
        createdAt: new Date('2025-12-06'),
        updatedAt: new Date('2025-12-06')
      },
      {
        firebaseUid: 'tech_' + Date.now() + '_3',
        name: 'David Chen',
        email: 'david.chen@fixitnow.com',
        role: 'technician',
        buildingId: building._id.toString(),
        specialties: ['Electrical', 'Appliances'],
        isActive: true,
        createdAt: new Date('2025-12-07'),
        updatedAt: new Date('2025-12-07')
      }
    ];

    const techResult = await db.collection('users').insertMany(technicians);
    const techIds = Object.values(techResult.insertedIds);
    console.log(`✅ Created ${techIds.length} technicians`);

    // Create sample residents
    console.log('🏠 Creating sample residents...');
    const residents = [
      {
        firebaseUid: 'resident_' + Date.now() + '_1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        role: 'resident',
        buildingId: building._id.toString(),
        unit: '201',
        isActive: true,
        createdAt: new Date('2025-11-15'),
        updatedAt: new Date('2025-11-15')
      },
      {
        firebaseUid: 'resident_' + Date.now() + '_2',
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        role: 'resident',
        buildingId: building._id.toString(),
        unit: '305',
        isActive: true,
        createdAt: new Date('2025-11-20'),
        updatedAt: new Date('2025-11-20')
      },
      {
        firebaseUid: 'resident_' + Date.now() + '_3',
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        role: 'resident',
        buildingId: building._id.toString(),
        unit: '412',
        isActive: true,
        createdAt: new Date('2025-12-01'),
        updatedAt: new Date('2025-12-01')
      }
    ];

    const residentResult = await db.collection('users').insertMany(residents);
    const residentIds = Object.values(residentResult.insertedIds);
    console.log(`✅ Created ${residentIds.length} residents`);

    // Create sample tickets with various statuses
    console.log('🎫 Creating sample tickets...');
    const tickets = [
      {
        title: 'AC not cooling in Unit 201',
        description: 'The air conditioning system is running but not cooling properly. Room temperature is around 78°F even with AC on full blast.',
        category: 'HVAC',
        priority: 'high',
        status: 'open',
        location: 'Unit 201',
        buildingId: building._id.toString(),
        createdBy: residentIds[0].toString(),
        createdByName: 'Sarah Johnson',
        createdAt: new Date('2026-01-01T09:30:00'),
        updatedAt: new Date('2026-01-01T09:30:00')
      },
      {
        title: 'Leaking faucet in bathroom',
        description: 'Kitchen faucet has been dripping continuously for 2 days. Water bill is going up.',
        category: 'Plumbing',
        priority: 'medium',
        status: 'assigned',
        location: 'Unit 305',
        buildingId: building._id.toString(),
        createdBy: residentIds[1].toString(),
        createdByName: 'Michael Brown',
        assignedTo: techIds[1].toString(),
        assignedToName: 'Maria Garcia',
        createdAt: new Date('2025-12-30T14:15:00'),
        updatedAt: new Date('2026-01-01T08:00:00')
      },
      {
        title: 'Broken washing machine',
        description: 'Washing machine making loud banging noise during spin cycle. Unable to complete laundry.',
        category: 'Appliances',
        priority: 'high',
        status: 'in_progress',
        location: 'Unit 412',
        buildingId: building._id.toString(),
        createdBy: residentIds[2].toString(),
        createdByName: 'Emily Davis',
        assignedTo: techIds[2].toString(),
        assignedToName: 'David Chen',
        createdAt: new Date('2025-12-28T16:45:00'),
        updatedAt: new Date('2025-12-31T10:30:00')
      },
      {
        title: 'Light fixture not working',
        description: 'Bedroom ceiling light stopped working. Changed bulb but still not working.',
        category: 'Electrical',
        priority: 'medium',
        status: 'completed',
        location: 'Unit 201',
        buildingId: building._id.toString(),
        createdBy: residentIds[0].toString(),
        createdByName: 'Sarah Johnson',
        assignedTo: techIds[0].toString(),
        assignedToName: 'John Smith',
        createdAt: new Date('2025-12-20T11:00:00'),
        updatedAt: new Date('2025-12-21T15:00:00'),
        completedAt: new Date('2025-12-21T15:00:00')
      },
      {
        title: 'Broken door lock',
        description: 'Front door lock is jammed. Having difficulty locking and unlocking.',
        category: 'Security',
        priority: 'high',
        status: 'completed',
        location: 'Unit 305',
        buildingId: building._id.toString(),
        createdBy: residentIds[1].toString(),
        createdByName: 'Michael Brown',
        assignedTo: techIds[1].toString(),
        assignedToName: 'Maria Garcia',
        createdAt: new Date('2025-12-18T08:30:00'),
        updatedAt: new Date('2025-12-19T14:00:00'),
        completedAt: new Date('2025-12-19T14:00:00')
      },
      {
        title: 'Window won\'t close properly',
        description: 'Living room window is stuck half-open. Can\'t close it all the way.',
        category: 'General Maintenance',
        priority: 'low',
        status: 'open',
        location: 'Unit 412',
        buildingId: building._id.toString(),
        createdBy: residentIds[2].toString(),
        createdByName: 'Emily Davis',
        createdAt: new Date('2025-12-25T10:00:00'),
        updatedAt: new Date('2025-12-25T10:00:00')
      },
      {
        title: 'Water heater temperature issues',
        description: 'Water not getting hot enough for showers. Takes very long to heat up.',
        category: 'Plumbing',
        priority: 'medium',
        status: 'in_progress',
        location: 'Unit 201',
        buildingId: building._id.toString(),
        createdBy: residentIds[0].toString(),
        createdByName: 'Sarah Johnson',
        assignedTo: techIds[1].toString(),
        assignedToName: 'Maria Garcia',
        createdAt: new Date('2025-12-27T07:30:00'),
        updatedAt: new Date('2025-12-29T09:00:00')
      },
      {
        title: 'Smoke detector beeping',
        description: 'Smoke detector in hallway beeping intermittently. Changed battery but still beeping.',
        category: 'Safety',
        priority: 'high',
        status: 'assigned',
        location: 'Unit 305',
        buildingId: building._id.toString(),
        createdBy: residentIds[1].toString(),
        createdByName: 'Michael Brown',
        assignedTo: techIds[0].toString(),
        assignedToName: 'John Smith',
        createdAt: new Date('2025-12-31T19:00:00'),
        updatedAt: new Date('2026-01-01T07:30:00')
      },
      {
        title: 'Garbage disposal not working',
        description: 'Kitchen garbage disposal hums but doesn\'t grind. Tried reset button.',
        category: 'Appliances',
        priority: 'low',
        status: 'completed',
        location: 'Unit 412',
        buildingId: building._id.toString(),
        createdBy: residentIds[2].toString(),
        createdByName: 'Emily Davis',
        assignedTo: techIds[2].toString(),
        assignedToName: 'David Chen',
        createdAt: new Date('2025-12-15T13:20:00'),
        updatedAt: new Date('2025-12-16T10:00:00'),
        completedAt: new Date('2025-12-16T10:00:00')
      },
      {
        title: 'Thermostat display blank',
        description: 'Thermostat screen is completely blank. AC/heating still working but can\'t adjust temperature.',
        category: 'HVAC',
        priority: 'medium',
        status: 'open',
        location: 'Unit 201',
        buildingId: building._id.toString(),
        createdBy: residentIds[0].toString(),
        createdByName: 'Sarah Johnson',
        createdAt: new Date('2026-01-02T08:00:00'),
        updatedAt: new Date('2026-01-02T08:00:00')
      }
    ];

    await db.collection('tickets').insertMany(tickets);
    console.log(`✅ Created ${tickets.length} sample tickets`);

    // Calculate and display statistics
    console.log('\n📊 Sample Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🏢 Building: ${building.name}`);
    console.log(`📍 Address: ${building.address}`);
    console.log(`🔑 Join Code: ${building.joinCode}`);
    console.log(`\n👤 Users:`);
    console.log(`   • 1 Admin: ${adminUser.name}`);
    console.log(`   • ${techIds.length} Technicians`);
    console.log(`   • ${residentIds.length} Residents`);
    console.log(`\n🎫 Tickets:`);
    const statusCounts = {
      open: tickets.filter(t => t.status === 'open').length,
      assigned: tickets.filter(t => t.status === 'assigned').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      completed: tickets.filter(t => t.status === 'completed').length
    };
    console.log(`   • Total: ${tickets.length}`);
    console.log(`   • Open: ${statusCounts.open}`);
    console.log(`   • Assigned: ${statusCounts.assigned}`);
    console.log(`   • In Progress: ${statusCounts.in_progress}`);
    console.log(`   • Completed: ${statusCounts.completed}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Sample data seeded successfully!');
    console.log('🚀 You can now login and view the dashboard with populated data.');

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
  } finally {
    await client.close();
  }
}

seedSampleData();
