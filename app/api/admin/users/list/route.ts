import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * GET /api/admin/users/list
 * 
 * Fetch all users for admin management
 * Requires admin authentication
 */
export async function GET() {
  try {
    const db = await getDatabase();
    
    // Fetch all users from MongoDB
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`[Admin Users List] Found ${users.length} users in database`);

    // Transform the data
    const transformedUsers = users.map(user => {
      const transformed = {
        uid: user.firebaseUid || user.uid || '',
        name: user.name || user.displayName || 'Unknown User',
        email: user.email || 'No email',
        role: user.role || 'resident',
        buildingId: user.buildingId || null,
        buildingName: user.buildingName || null,
        isActive: user.isActive !== undefined ? user.isActive : true,
        awaitApproval: user.awaitApproval || false,
        createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
      };
      console.log(`[Admin Users List] User: ${transformed.name} (${transformed.email}) - Role: ${transformed.role}`);
      return transformed;
    });

    console.log(`[Admin Users List] Returning ${transformedUsers.length} transformed users`);

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      count: transformedUsers.length,
      message: `Found ${transformedUsers.length} users`
    });

  } catch (error) {
    console.error('[Admin Users List] Error fetching users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        data: []
      },
      { status: 500 }
    );
  }
}
