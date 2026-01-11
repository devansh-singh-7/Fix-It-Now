import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

// Simple in-memory cache with 30-second TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * GET /api/dashboard/stats
 * 
 * Returns real-time dashboard statistics for a user based on their role
 * - Admin: All tickets in their building (or all if no building specified)
 * - Technician: Only assigned tickets
 * - Resident: Only their own tickets
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const role = searchParams.get('role');
    const buildingId = searchParams.get('buildingId');

    console.log('📊 Dashboard stats request:', { uid, role, buildingId });

    if (!uid || !role) {
      console.error('❌ Missing parameters:', { uid, role });
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: uid, role'
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `stats:${uid}:${role}:${buildingId || 'none'}`;
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('📊 Returning cached stats for', cacheKey);
      return NextResponse.json(cached);
    }

    const db = await getDatabase();
    const ticketsCollection = db.collection('tickets');

    // Build filter based on role
    const filter: Record<string, unknown> = {};

    // Only add buildingId filter if it's a valid value
    if (buildingId && buildingId !== 'null' && buildingId !== 'undefined' && buildingId !== '') {
      filter.buildingId = buildingId;
    }

    if (role === 'technician') {
      filter.assignedTo = uid;
    } else if (role === 'resident') {
      filter.createdBy = uid;
    }
    // Admin sees all tickets (filtered by building if specified, otherwise all)

    console.log('🔍 Query filter:', filter);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Single Aggregation Query using $facet
    const [result] = await ticketsCollection.aggregate([
      { $match: filter },
      {
        $facet: {
          // Current Totals
          total: [{ $count: "count" }],
          open: [{ $match: { status: "open" } }, { $count: "count" }],
          inProgress: [{ $match: { status: { $in: ['assigned', 'accepted', 'in_progress'] } } }, { $count: "count" }],
          completed: [{ $match: { status: "completed" } }, { $count: "count" }],

          // Last Month Totals (for trends)
          totalLastMonth: [{ $match: { createdAt: { $lt: lastMonth } } }, { $count: "count" }],
          openLastMonth: [{ $match: { status: "open", createdAt: { $lt: lastMonth } } }, { $count: "count" }],
          inProgressLastMonth: [{ $match: { status: { $in: ['assigned', 'accepted', 'in_progress'] }, createdAt: { $lt: lastMonth } } }, { $count: "count" }],
          completedLastMonth: [{ $match: { status: "completed", createdAt: { $lt: lastMonth } } }, { $count: "count" }],

          // Recent Tickets List
          recentTickets: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "firebaseUid",
                as: "assignedTechnician"
              }
            },
            {
              $unwind: {
                path: "$assignedTechnician",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                id: 1,
                title: 1,
                description: 1,
                status: 1,
                priority: 1,
                category: 1,
                location: 1,
                buildingName: 1,
                createdByName: 1,
                assignedToName: 1,
                assignedTechnicianPhone: "$assignedTechnician.phoneNumber",
                createdAt: 1,
                updatedAt: 1
              }
            }
          ]
        }
      }
    ]).toArray();

    // Helper to extract count from facet result (which is an array like [{ count: 5 }] or [])
    const getCount = (arr: any[]) => arr.length > 0 ? arr[0].count : 0;

    const stats = {
      total: getCount(result.total),
      open: getCount(result.open),
      inProgress: getCount(result.inProgress),
      completed: getCount(result.completed),
      
      totalLastMonth: getCount(result.totalLastMonth),
      openLastMonth: getCount(result.openLastMonth),
      inProgressLastMonth: getCount(result.inProgressLastMonth),
      completedLastMonth: getCount(result.completedLastMonth),
    };

    const recentTickets = result.recentTickets || [];

    console.log('📈 Stats calculated via Aggregation:', stats);
    console.log('🎫 Recent tickets found:', recentTickets.length);

    // Calculate percentage changes
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const responseData = {
      success: true,
      data: {
        stats: {
          total: {
            value: stats.total,
            trend: calculateTrend(stats.total, stats.totalLastMonth)
          },
          open: {
            value: stats.open,
            trend: calculateTrend(stats.open, stats.openLastMonth)
          },
          inProgress: {
            value: stats.inProgress,
            trend: calculateTrend(stats.inProgress, stats.inProgressLastMonth)
          },
          completed: {
            value: stats.completed,
            trend: calculateTrend(stats.completed, stats.completedLastMonth)
          }
        },
        recentTickets: recentTickets.map((ticket: any) => ({
          ...ticket,
          // Ensure dates are Date objects or strings as expected by frontend
          created_at: ticket.createdAt,
          updated_at: ticket.updatedAt,
          building: ticket.buildingName || 'Unknown',
          createdBy: ticket.createdByName,
          assignedTo: ticket.assignedToName,
          assigned_technician_phone: ticket.assignedTechnicianPhone
        })),
        timestamp: new Date().toISOString()
      }
    };

    // Cache the response
    setCachedData(cacheKey, responseData);
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
