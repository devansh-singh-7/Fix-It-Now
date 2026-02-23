import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import type { Announcement } from '@/app/lib/types';

/**
 * GET /api/announcements/admin
 * Get ALL announcements for admin management (including inactive)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('uid');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameter: uid' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Verify user is admin
        const user = await db.collection('users').findOne({ uid: userId });
        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        // Fetch all announcements (active and inactive)
        const announcements = await db.collection('announcements')
            .find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        const formattedAnnouncements: Announcement[] = announcements.map(doc => ({
            id: doc._id.toString(),
            type: doc.type,
            buildingId: doc.buildingId,
            buildingName: doc.buildingName,
            title: doc.title,
            content: doc.content,
            priority: doc.priority,
            authorId: doc.authorId,
            authorName: doc.authorName,
            isActive: doc.isActive,
            expiresAt: doc.expiresAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }));

        return NextResponse.json({
            success: true,
            data: formattedAnnouncements
        });

    } catch (error) {
        console.error('Get admin announcements error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get announcements' },
            { status: 500 }
        );
    }
}
