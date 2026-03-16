import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

// Simple in-memory cache with 30-second TTL
const cache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: Record<string, unknown>) {
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
    } else if (role === 'owner') {
      // Building owners see all tickets for their building (like admin)
      // filter.buildingId should already be set above
    }
    // Admin sees all tickets (filtered by building if specified, otherwise all)

    console.log('🔍 Query filter:', filter);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get last 7 days for trend chart (including today)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const inProgressStatuses = ['assigned', 'accepted', 'in_progress'];

    const [
      total,
      open,
      inProgress,
      completed,
      totalLastMonth,
      openLastMonth,
      inProgressLastMonth,
      completedLastMonth,
      recentTickets,
      trendTickets,
    ] = await Promise.all([
      ticketsCollection.countDocuments(filter),
      ticketsCollection.countDocuments({ ...filter, status: 'open' }),
      ticketsCollection.countDocuments({ ...filter, status: { $in: inProgressStatuses } }),
      ticketsCollection.countDocuments({ ...filter, status: 'completed' }),
      ticketsCollection.countDocuments({ ...filter, createdAt: { $lt: lastMonth } }),
      ticketsCollection.countDocuments({ ...filter, status: 'open', createdAt: { $lt: lastMonth } }),
      ticketsCollection.countDocuments({
        ...filter,
        status: { $in: inProgressStatuses },
        createdAt: { $lt: lastMonth },
      }),
      ticketsCollection.countDocuments({ ...filter, status: 'completed', createdAt: { $lt: lastMonth } }),
      ticketsCollection
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .project({
          _id: 1,
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
          assignedTechnicianPhone: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .toArray(),
      ticketsCollection
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(2000)
        .project({ _id: 0, createdAt: 1, status: 1 })
        .toArray(),
    ]);

    const stats = {
      total,
      open,
      inProgress,
      completed,
      totalLastMonth,
      openLastMonth,
      inProgressLastMonth,
      completedLastMonth,
    };

    // Process last 7 days data for charts in JS to tolerate legacy date formats.
    const dates: string[] = [];
    const dateIndexMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dateIndexMap[key] = dates.length;
      dates.push(key);
    }

    const totalData = new Array(7).fill(0);
    const openData = new Array(7).fill(0);
    const inProgressData = new Array(7).fill(0);
    const completedData = new Array(7).fill(0);

    trendTickets.forEach((ticket: Record<string, unknown>) => {
      const rawDate = ticket.createdAt;
      let createdAt: Date | null = null;

      if (rawDate instanceof Date) {
        createdAt = rawDate;
      } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          createdAt = parsed;
        }
      }

      if (!createdAt || createdAt < last7Days) {
        return;
      }

      const key = createdAt.toISOString().split('T')[0];
      const index = dateIndexMap[key];
      if (index === undefined) {
        return;
      }

      const status = String(ticket.status || '');
      totalData[index] += 1;
      if (status === 'open') {
        openData[index] += 1;
      } else if (inProgressStatuses.includes(status)) {
        inProgressData[index] += 1;
      } else if (status === 'completed') {
        completedData[index] += 1;
      }
    });

    const chartData = {
      labels: dates.map((d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      totalData,
      openData,
      inProgressData,
      completedData,
    };

    console.log('📈 Stats calculated:', stats);
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
            trend: calculateTrend(stats.total, stats.totalLastMonth),
            chartData: chartData.totalData
          },
          open: {
            value: stats.open,
            trend: calculateTrend(stats.open, stats.openLastMonth),
            chartData: chartData.openData
          },
          inProgress: {
            value: stats.inProgress,
            trend: calculateTrend(stats.inProgress, stats.inProgressLastMonth),
            chartData: chartData.inProgressData
          },
          completed: {
            value: stats.completed,
            trend: calculateTrend(stats.completed, stats.completedLastMonth),
            chartData: chartData.completedData
          }
        },
        chartLabels: chartData.labels,
        recentTickets: recentTickets.map((ticket: Record<string, unknown>) => ({
          ...ticket,
          id: ticket.id || String(ticket._id || ''),
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConnectionError = message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('querySrv') ||
      message.includes('connect') ||
      message.includes('topology') ||
      message.includes('ServerSelectionTimeout');

    console.error('Dashboard stats error:', message);

    return NextResponse.json(
      {
        success: false,
        error: isConnectionError
          ? 'Database connection failed. The MongoDB cluster may be paused or unreachable.'
          : 'Failed to fetch dashboard statistics',
        details: message,
        connectionError: isConnectionError,
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
