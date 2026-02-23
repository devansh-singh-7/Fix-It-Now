/**
 * API Route: Create User in MongoDB
 * 
 * This endpoint is called after Firebase Authentication to create/update
 * the user profile in MongoDB with role and additional metadata.
 * 
 * POST /api/users/create
 * Body: { uid, email, displayName, role, buildingId, buildingName }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

// Super Admin configuration - automatically grant admin role to this email
const SUPER_ADMIN_EMAIL = 'devanshsingh@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name, displayName, role, phoneNumber, buildingId, buildingName } = body;

    // Support both 'name' and 'displayName' for backwards compatibility
    const userName = name || displayName;
    // Use firebaseUid as the database field name to match the index
    const firebaseUid = uid;

    // Automatically assign admin role if this is the super admin email
    let userRole = role;
    if (email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      userRole = 'admin';
      console.log(`🔐 Super admin email detected (${email}). Automatically granting admin role.`);
    }

    // Validate required fields
    if (!firebaseUid || !userName || !userRole) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, name (or displayName), role' },
        { status: 400 }
      );
    }

    if (!email && !phoneNumber) {
      return NextResponse.json(
        { error: 'Either email or phoneNumber must be provided' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'technician', 'resident'];
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, technician, or resident' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    // Check if user with this email already exists (prevent duplicate accounts)
    // but allow claiming of "pending" accounts
    if (email) {
      const existingEmailUser = await usersCollection.findOne({ email });
      
      if (existingEmailUser && existingEmailUser.firebaseUid !== firebaseUid) {
        // If the existing user is a "pending" user (created by admin), allow claiming the profile
        if (typeof existingEmailUser.firebaseUid === 'string' && existingEmailUser.firebaseUid.startsWith('pending_')) {
          console.log(`🔓 User ${firebaseUid} claiming pending profile ${existingEmailUser.firebaseUid} (${email})`);
          
          // Update the pending profile with the real Firebase UID
          await usersCollection.updateOne(
            { email },
            { 
              $set: { 
                firebaseUid: firebaseUid,
                updatedAt: new Date(),
              } 
            }
          );
          
          if (phoneNumber) {
             // If signing up with phone too, update it
             await usersCollection.updateOne({ email }, { $set: { phoneNumber } });
          }

          const claimedUser = await usersCollection.findOne({ firebaseUid });
          
          return NextResponse.json({
            message: 'User profile claimed successfully',
            user: {
              uid: claimedUser!.firebaseUid,
              email: claimedUser!.email,
              phoneNumber: claimedUser!.phoneNumber,
              name: claimedUser!.name,
              role: claimedUser!.role,
              buildingId: claimedUser!.buildingId,
              buildingName: claimedUser!.buildingName,
            },
          });
        }

        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Check if user with this phone number already exists
    if (phoneNumber) {
      const existingPhoneUser = await usersCollection.findOne({ phoneNumber });
      
      if (existingPhoneUser && existingPhoneUser.firebaseUid !== firebaseUid) {
         // Allow claiming via phone number as well
        if (typeof existingPhoneUser.firebaseUid === 'string' && existingPhoneUser.firebaseUid.startsWith('pending_')) {
          console.log(`🔓 User ${firebaseUid} claiming pending profile ${existingPhoneUser.firebaseUid} by PHONE (${phoneNumber})`);
          
          await usersCollection.updateOne(
            { phoneNumber },
            { 
              $set: { 
                firebaseUid: firebaseUid,
                updatedAt: new Date(),
              } 
            }
          );
          
          if (email) {
              await usersCollection.updateOne({ phoneNumber }, { $set: { email } });
          }

          const claimedUser = await usersCollection.findOne({ firebaseUid });
          return NextResponse.json({
            message: 'User profile claimed successfully via phone',
            user: {
              uid: claimedUser!.firebaseUid,
              email: claimedUser!.email,
              phoneNumber: claimedUser!.phoneNumber,
              name: claimedUser!.name,
              role: claimedUser!.role,
              buildingId: claimedUser!.buildingId,
              buildingName: claimedUser!.buildingName,
            },
          });
        }

        return NextResponse.json(
          { error: 'An account with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Check if user already exists by firebaseUid
    const existingUser = await usersCollection.findOne({ firebaseUid });

    if (existingUser) {
      // Update existing user
      const updateData: Record<string, unknown> = {
        name: userName,
        role: userRole,
        updatedAt: new Date(),
      };
      
      if (email) updateData.email = email;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (buildingId) updateData.buildingId = buildingId;
      if (buildingName) updateData.buildingName = buildingName;

      await usersCollection.updateOne(
        { firebaseUid },
        { $set: updateData }
      );

      // ----------------------------------------------------------------------
      // DENORMALIZATION SYNC: Propagate name changes to related collections
      // ----------------------------------------------------------------------
      if (userName && existingUser.name !== userName) {
        console.log(`🔄 User ${firebaseUid} changed name from "${existingUser.name}" to "${userName}". Propagating changes...`);
        
        const ticketsCollection = db.collection('tickets');
        
        // 1. Update tickets where this user is the Assigned Technician
        const assignResult = await ticketsCollection.updateMany(
          { assignedTo: firebaseUid },
          { $set: { assignedToName: userName } }
        );
        
        // 2. Update tickets created by this user
        const createResult = await ticketsCollection.updateMany(
          { createdBy: firebaseUid },
          { $set: { createdByName: userName } }
        );
        
        console.log(`✅ Propagated name change to ${assignResult.modifiedCount} assigned tickets and ${createResult.modifiedCount} created tickets.`);
      }
      // ----------------------------------------------------------------------

      return NextResponse.json({
        message: 'User updated successfully',
        user: {
          uid: firebaseUid,
          email,
          phoneNumber,
          name: userName,
          role: userRole,
          buildingId,
          buildingName,
        },
      });
    }

    // Create new user document
    const newUser: Record<string, unknown> = {
      firebaseUid,
      name: userName,
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    
    if (email) newUser.email = email;
    if (phoneNumber) newUser.phoneNumber = phoneNumber;
    if (buildingId) newUser.buildingId = buildingId;
    if (buildingName) newUser.buildingName = buildingName;

    await usersCollection.insertOne(newUser);

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        uid: firebaseUid,
        email,
        phoneNumber,
        name: userName,
        role: userRole,
        buildingId,
        buildingName,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user in database' },
      { status: 500 }
    );
  }
}
