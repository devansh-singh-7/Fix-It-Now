/**
 * Grant Admin Role Script
 * 
 * This script grants admin role to a specific user by their Firebase UID.
 * Usage: node scripts/grant-admin.js
 */

import { MongoClient } from 'mongodb';

// Default to local MongoDB if not set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'fixitnow';

// User to grant admin role
const USER_UID = 'qVBroM4s8kbWuP3ErnaD4a6nezG3';
const USER_EMAIL = 'devanshsingh@gmail.com';

async function grantAdminRole() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // First, check if user exists
    console.log(`\nSearching for user with UID: ${USER_UID}...`);
    const existingUser = await usersCollection.findOne({ 
      firebaseUid: USER_UID 
    });
    
    if (existingUser) {
      console.log('User found in database:');
      console.log(`  Name: ${existingUser.name}`);
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Current Role: ${existingUser.role}`);
      console.log(`  Building ID: ${existingUser.buildingId || 'None (Super Admin)'}`);
      
      // Update user to admin role
      console.log('\nUpdating user role to admin...');
      const result = await usersCollection.updateOne(
        { firebaseUid: USER_UID },
        { 
          $set: { 
            role: 'admin',
            buildingId: null,  // Super admin has no building
            buildingName: null,
            awaitApproval: false,
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Successfully granted admin role!');
        
        // Verify the update
        const updatedUser = await usersCollection.findOne({ firebaseUid: USER_UID });
        console.log('\nUpdated user details:');
        console.log(`  Name: ${updatedUser.name}`);
        console.log(`  Email: ${updatedUser.email}`);
        console.log(`  Role: ${updatedUser.role}`);
        console.log(`  Building ID: ${updatedUser.buildingId || 'None (Super Admin)'}`);
        console.log(`  Is Active: ${updatedUser.isActive}`);
      } else {
        console.log('⚠️  User already has admin role or no changes needed');
      }
    } else {
      console.log(`❌ User not found with UID: ${USER_UID}`);
      console.log('\nSearching by email instead...');
      
      const userByEmail = await usersCollection.findOne({ email: USER_EMAIL });
      
      if (userByEmail) {
        console.log('User found by email:');
        console.log(`  Name: ${userByEmail.name}`);
        console.log(`  Email: ${userByEmail.email}`);
        console.log(`  Firebase UID: ${userByEmail.firebaseUid}`);
        console.log(`  Current Role: ${userByEmail.role}`);
        
        console.log('\n⚠️  WARNING: The Firebase UID does not match!');
        console.log(`  Expected: ${USER_UID}`);
        console.log(`  Found: ${userByEmail.firebaseUid}`);
        console.log('\nPlease update the USER_UID constant in this script with the correct UID.');
      } else {
        console.log(`❌ User not found by email either: ${USER_EMAIL}`);
        console.log('\nThe user might need to be created first. Creating user profile...');
        
        // Create the user profile
        const newUser = {
          firebaseUid: USER_UID,
          name: 'Devansh Singh',
          email: USER_EMAIL,
          role: 'admin',
          buildingId: null,  // Super admin has no building
          buildingName: null,
          awaitApproval: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await usersCollection.insertOne(newUser);
        console.log('✅ User profile created with admin role!');
        console.log('\nUser details:');
        console.log(`  Name: ${newUser.name}`);
        console.log(`  Email: ${newUser.email}`);
        console.log(`  Role: ${newUser.role}`);
        console.log(`  Firebase UID: ${newUser.firebaseUid}`);
      }
    }
    
    console.log('\n✅ Operation completed successfully!');
    console.log('\nThe user can now:');
    console.log('  - Access admin dashboard');
    console.log('  - Create buildings');
    console.log('  - Manage users');
    console.log('  - Create other admin accounts (if super admin email matches)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
grantAdminRole()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
