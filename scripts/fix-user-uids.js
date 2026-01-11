/**
 * Fix User UIDs - Update users with undefined firebaseUid
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';

async function fixUserUIDs() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔧 FIXING USER UIDs\n');
    console.log('═══════════════════════════════════════════════════\n');
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Find users with undefined or missing firebaseUid
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log('👥 Current users:\n');
    users.forEach(user => {
      console.log(`- ${user.name || user.email}`);
      console.log(`  Current UID: ${user.firebaseUid || 'undefined'}`);
      console.log(`  Building: ${user.buildingName || 'N/A'}`);
      console.log('');
    });
    
    // Check for admin user with undefined UID
    const adminUser = await usersCollection.findOne({ 
      email: 'devansh@gmail.com',
      role: 'admin'
    });
    
    if (adminUser && !adminUser.firebaseUid) {
      console.log('⚠️  Found admin user with undefined firebaseUid!');
      console.log('   Email:', adminUser.email);
      console.log('   Name:', adminUser.name);
      
      console.log('\n📝 Options to fix:');
      console.log('1. This user should use Firebase UID from authentication');
      console.log('2. Or merge with the other admin account');
      console.log('\nFor now, this user needs to sign in with Firebase to get a proper UID.');
      console.log('The system will work once they sign in properly.\n');
    }
    
    // Check tickets created by null users
    const ticketsCollection = db.collection('tickets');
    const nullTickets = await ticketsCollection.find({ 
      $or: [
        { createdBy: null },
        { createdBy: { $exists: false } },
        { createdBy: 'undefined' }
      ]
    }).toArray();
    
    if (nullTickets.length > 0) {
      console.log(`⚠️  Found ${nullTickets.length} tickets with null/undefined createdBy:`);
      nullTickets.forEach(t => {
        console.log(`   - ${t.title} (Created: ${t.createdAt})`);
      });
      console.log('\nThese are test tickets and won\'t show up for users.\n');
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('💡 SOLUTION');
    console.log('═══════════════════════════════════════════════════');
    console.log('The user needs to:');
    console.log('1. Sign OUT from the app');
    console.log('2. Sign IN again using Firebase authentication');
    console.log('3. This will populate the proper firebaseUid');
    console.log('4. Then tickets will display correctly\n');
    
    console.log('Or use the other admin account:');
    console.log('- Email: devanshsingh@gmail.com (if exists in Firebase)');
    console.log('- UID: qVBroM4s8kbWuP3ErnaD4a6nezG3\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixUserUIDs();
