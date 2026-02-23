import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * Initial setup endpoint to create the super admin account
 * This should only be called once during initial setup
 * After the super admin exists, this endpoint will return an error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secretKey } = body;

    // Simple security check - you should set this in your environment variables
    if (secretKey !== process.env.SETUP_SECRET_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid setup key' 
        },
        { status: 403 }
      );
    }

    const db = await getDatabase();

    // Check if super admin already exists
    const existingSuperAdmin = await db.collection('users').findOne({ 
      email: 'devansh@gmail.com' 
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Super admin account already exists' 
        },
        { status: 400 }
      );
    }

    // Note: You need to create this account in Firebase Auth first
    // This endpoint just creates the MongoDB profile
    // The Firebase UID should be obtained from Firebase Console after creating the user
    
    return NextResponse.json({
      success: true,
      message: 'Please create the Firebase Auth account for devansh@gmail.com first, then create the MongoDB profile using the UID'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Setup failed'
      },
      { status: 500 }
    );
  }
}
