import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/app/lib/mongodb';
import type { Announcement, AnnouncementType, AnnouncementPriority, UserRole } from '@/app/lib/types';

/**
 * GET /api/announcements
 * Get announcements for a user (system + building-specific)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('uid');
        const role = searchParams.get('role') as UserRole;
        const buildingId = searchParams.get('buildingId');

        if (!userId || !role) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: uid, role' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        const now = new Date();

        // Build query for active announcements
        // System announcements are visible to all
        // Building announcements are visible only to building members
        const query: Record<string, unknown> = {
            isActive: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        };

        // Get all system announcements + building-specific announcements
        if (buildingId) {
            query.$and = [
                {
                    $or: [
                        { type: 'system' },
                        { type: 'building', buildingId: buildingId }
                    ]
                }
            ];
        } else {
            // User without building only sees system announcements
            query.type = 'system';
        }

        // Fetch announcements sorted by priority and date
        const announcements = await db.collection('announcements')
            .find(query)
            .sort({
                // Sort by priority (urgent first, then warning, then info)
                priority: -1,
                createdAt: -1
            })
            .limit(10)
            .toArray();

        // Transform MongoDB documents to Announcement type
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

        // If no announcements exist, return sample announcements for demo
        if (formattedAnnouncements.length === 0) {
            const sampleAnnouncements: Announcement[] = [
                {
                    id: 'demo-system-1',
                    type: 'system',
                    title: '🚀 New Feature: Real-time Notifications',
                    content: 'We\'ve added real-time push notifications! You\'ll now receive instant updates when your tickets are updated or resolved.',
                    priority: 'info',
                    authorId: 'system',
                    authorName: 'FixItNow Team',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            // Add building announcement if user has a building
            if (buildingId) {
                sampleAnnouncements.push({
                    id: 'demo-building-1',
                    type: 'building',
                    buildingId: buildingId,
                    buildingName: 'Your Building',
                    title: '⚡ Scheduled Power Maintenance',
                    content: 'There will be a brief power outage on Saturday from 2:00 AM to 4:00 AM for electrical maintenance. Please plan accordingly.',
                    priority: 'warning',
                    authorId: 'admin',
                    authorName: 'Building Admin',
                    isActive: true,
                    createdAt: new Date(Date.now() - 86400000), // 1 day ago
                    updatedAt: new Date(Date.now() - 86400000)
                });
            }

            return NextResponse.json({
                success: true,
                data: sampleAnnouncements
            });
        }

        return NextResponse.json({
            success: true,
            data: formattedAnnouncements
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get announcements' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/announcements
 * Create a new announcement
 * Only admin and technician roles can create announcements
 * Admins: can create system and building announcements
 * Technicians: can only create building announcements for their building
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            uid,
            role,
            title,
            content,
            priority,
            type,
            buildingId,
            buildingName,
            authorName,
            expiresAt
        } = body;

        // Validate required fields
        if (!uid || !role) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: uid, role' },
                { status: 400 }
            );
        }

        if (!title || !content || !priority || !type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: title, content, priority, type' },
                { status: 400 }
            );
        }

        // Validate role - only admin and technician can create announcements
        if (role !== 'admin' && role !== 'technician') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Only admin and technician can create announcements' },
                { status: 403 }
            );
        }

        // Technicians can only create building announcements
        if (role === 'technician' && type === 'system') {
            return NextResponse.json(
                { success: false, error: 'Technicians can only create building-specific announcements' },
                { status: 403 }
            );
        }

        // Building announcements require buildingId
        if (type === 'building' && !buildingId) {
            return NextResponse.json(
                { success: false, error: 'Building ID is required for building announcements' },
                { status: 400 }
            );
        }

        // Validate priority
        const validPriorities: AnnouncementPriority[] = ['info', 'warning', 'urgent'];
        if (!validPriorities.includes(priority)) {
            return NextResponse.json(
                { success: false, error: 'Invalid priority. Must be: info, warning, or urgent' },
                { status: 400 }
            );
        }

        // Validate type
        const validTypes: AnnouncementType[] = ['system', 'building'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid type. Must be: system or building' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        const now = new Date();

        // Create announcement document
        const announcementDoc = {
            type,
            buildingId: type === 'building' ? buildingId : null,
            buildingName: type === 'building' ? (buildingName || 'Building') : null,
            title,
            content,
            priority,
            authorId: uid,
            authorName: authorName || 'Unknown',
            isActive: true,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdAt: now,
            updatedAt: now
        };

        const result = await db.collection('announcements').insertOne(announcementDoc);

        const newAnnouncement: Announcement = {
            id: result.insertedId.toString(),
            type: announcementDoc.type,
            buildingId: announcementDoc.buildingId || undefined,
            buildingName: announcementDoc.buildingName || undefined,
            title: announcementDoc.title,
            content: announcementDoc.content,
            priority: announcementDoc.priority,
            authorId: announcementDoc.authorId,
            authorName: announcementDoc.authorName,
            isActive: announcementDoc.isActive,
            expiresAt: announcementDoc.expiresAt || undefined,
            createdAt: announcementDoc.createdAt,
            updatedAt: announcementDoc.updatedAt
        };

        return NextResponse.json({
            success: true,
            data: newAnnouncement
        }, { status: 201 });

    } catch (error) {
        console.error('Create announcement error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create announcement' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/announcements
 * Update an existing announcement
 * Only the author or admin can update
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            uid,
            role,
            announcementId,
            title,
            content,
            priority,
            type,
            buildingId,
            buildingName,
            expiresAt,
            isActive
        } = body;

        // Validate required fields
        if (!uid || !role || !announcementId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: uid, role, announcementId' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Find existing announcement
        let objectId;
        try {
            objectId = new ObjectId(announcementId);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid announcement ID' },
                { status: 400 }
            );
        }

        const existingAnnouncement = await db.collection('announcements').findOne({ _id: objectId });

        if (!existingAnnouncement) {
            return NextResponse.json(
                { success: false, error: 'Announcement not found' },
                { status: 404 }
            );
        }

        // Check authorization - only author or admin can update
        if (existingAnnouncement.authorId !== uid && role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Only the author or admin can update this announcement' },
                { status: 403 }
            );
        }

        // Technicians cannot change a building announcement to system
        if (role === 'technician' && type === 'system') {
            return NextResponse.json(
                { success: false, error: 'Technicians can only manage building-specific announcements' },
                { status: 403 }
            );
        }

        // Build update object with only provided fields
        const updateFields: Record<string, unknown> = {
            updatedAt: new Date()
        };

        if (title !== undefined) updateFields.title = title;
        if (content !== undefined) updateFields.content = content;
        if (priority !== undefined) updateFields.priority = priority;
        if (type !== undefined) updateFields.type = type;
        if (buildingId !== undefined) updateFields.buildingId = buildingId;
        if (buildingName !== undefined) updateFields.buildingName = buildingName;
        if (expiresAt !== undefined) updateFields.expiresAt = expiresAt ? new Date(expiresAt) : null;
        if (isActive !== undefined) updateFields.isActive = isActive;

        await db.collection('announcements').updateOne(
            { _id: objectId },
            { $set: updateFields }
        );

        // Fetch updated document
        const updatedAnnouncement = await db.collection('announcements').findOne({ _id: objectId });

        const formattedAnnouncement: Announcement = {
            id: updatedAnnouncement!._id.toString(),
            type: updatedAnnouncement!.type,
            buildingId: updatedAnnouncement!.buildingId,
            buildingName: updatedAnnouncement!.buildingName,
            title: updatedAnnouncement!.title,
            content: updatedAnnouncement!.content,
            priority: updatedAnnouncement!.priority,
            authorId: updatedAnnouncement!.authorId,
            authorName: updatedAnnouncement!.authorName,
            isActive: updatedAnnouncement!.isActive,
            expiresAt: updatedAnnouncement!.expiresAt,
            createdAt: updatedAnnouncement!.createdAt,
            updatedAt: updatedAnnouncement!.updatedAt
        };

        return NextResponse.json({
            success: true,
            data: formattedAnnouncement
        });

    } catch (error) {
        console.error('Update announcement error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update announcement' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/announcements
 * Delete (deactivate) an announcement
 * Only the author or admin can delete
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const role = searchParams.get('role') as UserRole;
        const announcementId = searchParams.get('id');

        // Validate required fields
        if (!uid || !role || !announcementId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: uid, role, id' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Find existing announcement
        let objectId;
        try {
            objectId = new ObjectId(announcementId);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid announcement ID' },
                { status: 400 }
            );
        }

        const existingAnnouncement = await db.collection('announcements').findOne({ _id: objectId });

        if (!existingAnnouncement) {
            return NextResponse.json(
                { success: false, error: 'Announcement not found' },
                { status: 404 }
            );
        }

        // Check authorization - only author or admin can delete
        if (existingAnnouncement.authorId !== uid && role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Only the author or admin can delete this announcement' },
                { status: 403 }
            );
        }

        // Soft delete by setting isActive to false
        await db.collection('announcements').updateOne(
            { _id: objectId },
            {
                $set: {
                    isActive: false,
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Announcement deleted successfully'
        });

    } catch (error) {
        console.error('Delete announcement error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete announcement' },
            { status: 500 }
        );
    }
}

