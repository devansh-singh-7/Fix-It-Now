import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * GET /api/technicians/available
 * Get all technicians that can be assigned to a building
 * Query params:
 *   - excludeBuildingId: Exclude technicians already assigned to this building
 */
export async function GET(request: NextRequest) {
    try {
        const uid = request.headers.get('x-user-id');
        const { searchParams } = new URL(request.url);
        const excludeBuildingId = searchParams.get('excludeBuildingId');

        if (!uid) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const db = await getDatabase();

        // Build query to find technicians
        // Include: 
        //   - Users with role 'technician' without a building (unassigned)
        //   - Users with role 'technician' assigned to a different building
        const query: Record<string, unknown> = {
            role: 'technician',
            isActive: { $ne: false }, // Exclude inactive users
        };

        // If we want to exclude technicians already in a specific building
        if (excludeBuildingId) {
            query.buildingId = { $ne: excludeBuildingId };
        }

        const technicians = await db.collection('users')
            .find(query)
            .project({
                firebaseUid: 1,
                name: 1,
                displayName: 1,
                email: 1,
                phoneNumber: 1,
                buildingId: 1,
                buildingName: 1,
                isPending: 1,
            })
            .sort({ name: 1 })
            .toArray();

        return NextResponse.json({
            success: true,
            data: technicians.map(tech => ({
                uid: tech.firebaseUid || `pending_${tech.email}`,
                name: tech.name || tech.displayName || 'Unknown',
                email: tech.email,
                phoneNumber: tech.phoneNumber,
                currentBuilding: tech.buildingName || null,
                isUnassigned: !tech.buildingId,
                isPending: tech.isPending || false,
            }))
        });
    } catch (error) {
        console.error('Error getting available technicians:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get technicians' },
            { status: 500 }
        );
    }
}
