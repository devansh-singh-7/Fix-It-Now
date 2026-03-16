import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import { requireAdminOrOwner } from '@/app/lib/server-auth';
import { isSuperAdmin } from '@/app/lib/database';

/**
 * GET /api/buildings/list
 * 
 * Returns all active buildings for the building selector
 * - Super admins see ALL buildings
 * - Regular admins see only their buildings
 */
export async function GET(request: Request) {
  try {
    const authResult = await requireAdminOrOwner(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const db = await getDatabase();
    
    // Check if user is super admin
    const isSuper = await isSuperAdmin(authResult.user.uid);
    
    // Build query - super admins see all buildings, regular admins see only their buildings
    const query: Record<string, unknown> = {
      isActive: { $ne: false }
    };
    
    if (!isSuper) {
      query.adminId = authResult.user.uid;
    }
    
    console.log('Buildings list query:', { isSuperAdmin: isSuper, uid: authResult.user.uid, query });
    
    const buildings = await db.collection('buildings')
      .find(query)
      .project({
        _id: 1,
        id: 1,
        name: 1,
        address: 1,
        state: 1,
        area: 1,
      })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: buildings.map(b => ({
        id: b.id || b._id.toString(),
        name: b.name,
        address: b.address,
        state: b.state,
        area: b.area,
      }))
    });
  } catch (error) {
    console.error('Error fetching buildings list:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch buildings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
