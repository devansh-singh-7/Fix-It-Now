/**
 * Verify Admin Setup Script
 * 
 * This script verifies the admin user setup in both MongoDB and Firebase
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';
const USER_UID = 'qVBroM4s8kbWuP3ErnaD4a6nezG3';
const USER_EMAIL = 'devanshsingh@gmail.com';

async function verifyAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB\n');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Check MongoDB
    console.log('=== MongoDB Verification ===');
    const user = await usersCollection.findOne({ firebaseUid: USER_UID });
    
    if (user) {
      console.log('✅ User found in MongoDB:');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Building ID: ${user.buildingId || 'None (Super Admin)'}`);
      console.log(`   Is Active: ${user.isActive}`);
      console.log(`   Created At: ${user.createdAt}`);
    } else {
      console.log('❌ User NOT found in MongoDB');
    }
    
    console.log('\n=== Firebase Authentication ===');
    console.log('⚠️  Firebase authentication status cannot be checked from this script.');
    console.log('   To verify Firebase account:');
    console.log('   1. Go to Firebase Console > Authentication');
    console.log(`   2. Look for user: ${USER_EMAIL}`);
    console.log(`   3. Verify UID matches: ${USER_UID}`);
    console.log('\n   If the user does NOT exist in Firebase:');
    console.log('   1. Click "Add User" in Firebase Console');
    console.log(`   2. Email: ${USER_EMAIL}`);
    console.log('   3. Password: Devansh@69');
    console.log(`   4. After creation, verify the UID is: ${USER_UID}`);
    console.log('   5. If UID is different, update MongoDB with the correct UID');
    
    console.log('\n=== Login Instructions ===');
    console.log(`Email: ${USER_EMAIL}`);
    console.log('Password: Devansh@69');
    console.log('\nThe user should be able to:');
    console.log('  ✓ Sign in at /auth/signin');
    console.log('  ✓ Access admin dashboard');
    console.log('  ✓ Create buildings');
    console.log('  ✓ Manage users');
    console.log('  ✓ View all tickets');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
