import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * POST /api/debug/fix-role
 * Fix user role to admin for debugging
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uid, newRole } = body;

        if (!uid || !newRole) {
            return NextResponse.json(
                { success: false, error: 'Missing uid or newRole' },
                { status: 400 }
            );
        }

        const db = await getDatabase();

        // Update user role
        const result = await db.collection('users').updateOne(
            { firebaseUid: uid },
            { $set: { role: newRole, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Role updated to ${newRole}`,
            matched: result.matchedCount,
            modified: result.modifiedCount
        });
    } catch (error) {
        console.error('Fix role error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update role' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/debug/fix-role
 * Display user info for debugging
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        const db = await getDatabase();

        if (uid) {
            const user = await db.collection('users').findOne({ firebaseUid: uid });
            return NextResponse.json({
                success: true,
                user: user ? {
                    uid: user.firebaseUid,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    buildingId: user.buildingId
                } : null
            });
        }

        // Return all users
        const users = await db.collection('users').find({}).limit(10).toArray();
        return NextResponse.json({
            success: true,
            users: users.map(u => ({
                uid: u.firebaseUid,
                email: u.email,
                name: u.name,
                role: u.role,
                buildingId: u.buildingId
            }))
        });
    } catch (error) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get users' },
            { status: 500 }
        );
    }
}
