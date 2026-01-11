import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * GET /api/debug/user-tickets
 * Debug endpoint to check user profile and matching tickets
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({
                success: false,
                error: 'Please provide uid parameter, e.g., ?uid=YOUR_UID'
            });
        }

        const db = await getDatabase();

        // Get user profile
        const user = await db.collection('users').findOne({ firebaseUid: uid });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found with firebaseUid: ' + uid,
                hint: 'Check if the user exists in the database'
            });
        }

        // Get user's buildingId
        const buildingId = user.buildingId;

        // Count tickets for this building
        const ticketsInBuilding = await db.collection('tickets')
            .find({ buildingId })
            .toArray();

        // Count tickets created by this user
        const ticketsByUser = await db.collection('tickets')
            .find({ createdBy: uid })
            .toArray();

        // Count tickets assigned to this user (if technician)
        const ticketsAssigned = await db.collection('tickets')
            .find({ assignedTo: uid })
            .toArray();

        return NextResponse.json({
            success: true,
            user: {
                uid: user.firebaseUid,
                name: user.name || user.displayName,
                email: user.email,
                role: user.role,
                buildingId: user.buildingId
            },
            ticketCounts: {
                inBuilding: ticketsInBuilding.length,
                createdByUser: ticketsByUser.length,
                assignedToUser: ticketsAssigned.length
            },
            ticketsInBuilding: ticketsInBuilding.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                createdBy: t.createdBy,
                assignedTo: t.assignedTo
            })),
            explanation: user.role === 'admin'
                ? `As admin, you should see ${ticketsInBuilding.length} tickets`
                : user.role === 'technician'
                    ? `As technician, you should see ${ticketsAssigned.length} assigned tickets`
                    : `As resident, you should see ${ticketsByUser.length} tickets you created`
        });
    } catch (error) {
        console.error('User tickets check error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
