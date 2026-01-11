/**
 * Setup Admin User Script
 * 
 * This script sets up the admin user with proper credentials and permissions.
 * 
 * Usage: node scripts/setup-admin-user.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb');

// Try to load dotenv if available
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  console.log('ℹ️  dotenv not found, using environment variables or defaults');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fixitnow';

// Admin user configuration
const ADMIN_USER = {
  email: 'devanshsingh@gmail.com',
  name: 'Devansh Singh',
  role: 'admin',
  isActive: true,
};

async function setupAdminUser() {
  let client;
  
  try {
    console.log('\n🔧 Setting up Admin User\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: ADMIN_USER.email });
    
    if (existingUser) {
      console.log('👤 User already exists in database');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Firebase UID: ${existingUser.firebaseUid || 'Not set yet'}\n`);
      
      // Update role to admin if not already
      if (existingUser.role !== 'admin') {
        await db.collection('users').updateOne(
          { email: ADMIN_USER.email },
          { 
            $set: { 
              role: 'admin',
              updatedAt: new Date()
            } 
          }
        );
        console.log('✅ Updated user role to admin\n');
      } else {
        console.log('✅ User already has admin role\n');
      }
    } else {
      console.log('⚠️  User does not exist in database yet\n');
      console.log('📝 You need to create this user through the signup page first.\n');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Setup Instructions:\n');
    console.log('1. Start your app: npm run dev');
    console.log('2. Go to: http://localhost:3000/auth/signup');
    console.log('3. Sign up with these credentials:');
    console.log(`   Email: ${ADMIN_USER.email}`);
    console.log('   Password: Devansh@69');
    console.log('   Name: Devansh Singh\n');
    console.log('4. After signup, run this script again to grant admin privileges');
    console.log('5. Sign out and sign back in to see admin features\n');
    
    console.log('🔐 Super Admin Configuration:');
    console.log(`   Email: ${ADMIN_USER.email}`);
    console.log('   This email is configured as super admin in the system\n');
    
    if (existingUser && existingUser.role === 'admin') {
      console.log('✅ Admin user is ready! You can now sign in.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB\n');
    }
  }
}

// Run the script
setupAdminUser();
