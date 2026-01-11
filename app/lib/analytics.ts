/**
 * Analytics and Reporting Functions
 * 
 * MongoDB aggregation pipelines for admin analytics dashboard.
 * Provides ticket statistics, technician performance, and AI predictions.
 */

import { getDatabase } from './mongodb';

/**
 * Ticket statistics for a building
 */
export interface TicketStats {
  total: number;
  open: number;
  assigned: number;
  accepted: number;
  inProgress: number;
  completed: number;
  byCategory: {
    category: string;
    count: number;
  }[];
  byPriority: {
    priority: string;
    count: number;
  }[];
  avgCompletionTime?: number; // in hours
  trend: {
    date: string;
    count: number;
  }[];
}

/**
 * Technician performance metrics
 */
export interface TechnicianPerformance {
  uid: string;
  name: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  avgCompletionTime: number; // in hours
  completionRate: number; // percentage
  avgRating?: number;
  ticketsByCategory: {
    category: string;
    count: number;
  }[];
}

/**
 * AI prediction summary
 */
export interface PredictionSummary {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  byModel: {
    model: string;
    count: number;
    avgProbability: number;
  }[];
  recentPredictions: {
    id: string;
    ticketId?: string;
    riskBucket: string;
    failureProbability: number;
    recommendedAction: string;
    createdAt: Date;
  }[];
}

/**
 * Invoice analytics
 */
export interface InvoiceAnalytics {
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  cancelledAmount: number;
  totalInvoices: number;
  avgInvoiceAmount: number;
  revenueByMonth: {
    month: string;
    revenue: number;
  }[];
}

/**
 * Get comprehensive ticket statistics for a building or all buildings
 * @param buildingId - Building ID to filter by, or null for global statistics
 */
export async function getTicketStatistics(buildingId: string | null): Promise<TicketStats> {
  try {
    const db = await getDatabase();
    const ticketsCollection = db.collection('tickets');

    // Build match query - if buildingId is null, match all tickets
    const matchQuery = buildingId ? { buildingId } : {};

    // Get status counts
    const statusCounts = await ticketsCollection.aggregate([
      { $match: matchQuery },
      { 
        $group: { 
          _id: '$status', 
          count: { $sum: 1 } 
        } 
      }
    ]).toArray();

    // Get category distribution
    const categoryDistribution = await ticketsCollection.aggregate([
      { $match: matchQuery },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get priority distribution
    const priorityDistribution = await ticketsCollection.aggregate([
      { $match: matchQuery },
      { 
        $group: { 
          _id: '$priority', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Calculate average completion time
    const completionTimeResult = await ticketsCollection.aggregate([
      { 
        $match: { 
          ...matchQuery,
          status: 'completed',
          completedAt: { $exists: true }
        } 
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              3600000 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$completionTime' }
        }
      }
    ]).toArray();

    // Get ticket trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendData = await ticketsCollection.aggregate([
      { 
        $match: { 
          ...matchQuery,
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$createdAt' 
            } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Build response
    const statusMap = new Map(statusCounts.map(s => [s._id, s.count]));
    const total = statusCounts.reduce((sum, s) => sum + s.count, 0);

    return {
      total,
      open: statusMap.get('open') || 0,
      assigned: statusMap.get('assigned') || 0,
      accepted: statusMap.get('accepted') || 0,
      inProgress: statusMap.get('in_progress') || 0,
      completed: statusMap.get('completed') || 0,
      byCategory: categoryDistribution.map(c => ({
        category: c._id,
        count: c.count
      })),
      byPriority: priorityDistribution.map(p => ({
        priority: p._id,
        count: p.count
      })),
      avgCompletionTime: completionTimeResult[0]?.avgTime || 0,
      trend: trendData.map(t => ({
        date: t._id,
        count: t.count
      }))
    };
  } catch (error) {
    console.error('Error getting ticket statistics:', error);
    throw error;
  }
}

/**
 * Get technician performance metrics
 * @param buildingId - Building ID to filter by, or null for global statistics
 */
export async function getTechnicianPerformance(buildingId: string | null): Promise<TechnicianPerformance[]> {
  try {
    const db = await getDatabase();
    
    // Build match query
    const matchQuery = buildingId 
      ? { buildingId, assignedTo: { $exists: true, $ne: null } }
      : { assignedTo: { $exists: true, $ne: null } };
    
    // Aggregate ticket data by technician
    const performance = await db.collection('tickets').aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$assignedTo',
          techName: { $first: '$assignedToName' },
          totalAssigned: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { 
              $cond: [
                { $in: ['$status', ['assigned', 'accepted', 'in_progress']] }, 
                1, 
                0
              ] 
            }
          },
          tickets: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          uid: '$_id',
          name: '$techName',
          totalAssigned: 1,
          completed: 1,
          inProgress: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completed', '$totalAssigned'] },
              100
            ]
          },
          tickets: 1
        }
      },
      { $sort: { completed: -1 } }
    ]).toArray();

    // Calculate completion times and category distribution
    const result: TechnicianPerformance[] = [];

    for (const tech of performance) {
      const completedTickets = tech.tickets.filter((t: Record<string, unknown>) => 
        t.status === 'completed' && t.createdAt && t.completedAt
      );

      let avgCompletionTime = 0;
      if (completedTickets.length > 0) {
        const totalTime = completedTickets.reduce((sum: number, t: Record<string, unknown>) => {
          const diff = new Date(t.completedAt as Date).getTime() - new Date(t.createdAt as Date).getTime();
          return sum + (diff / 3600000); // Convert to hours
        }, 0);
        avgCompletionTime = totalTime / completedTickets.length;
      }

      // Category distribution
      const categoryMap = new Map<string, number>();
      tech.tickets.forEach((t: Record<string, unknown>) => {
        const count = categoryMap.get(t.category as string) || 0;
        categoryMap.set(t.category as string, count + 1);
      });

      result.push({
        uid: tech.uid,
        name: tech.name || 'Unknown',
        totalAssigned: tech.totalAssigned,
        completed: tech.completed,
        inProgress: tech.inProgress,
        avgCompletionTime,
        completionRate: tech.completionRate,
        ticketsByCategory: Array.from(categoryMap.entries()).map(([category, count]) => ({
          category,
          count
        }))
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting technician performance:', error);
    throw error;
  }
}

/**
 * Get AI prediction summary
 * @param buildingId - Building ID to filter by, or null for global statistics
 */
export async function getPredictionSummary(buildingId: string | null): Promise<PredictionSummary> {
  try {
    const db = await getDatabase();
    const predictionsCollection = db.collection('predictions');

    const matchQuery = buildingId ? { buildingId } : {};

    // Get risk distribution
    const riskDistribution = await predictionsCollection.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$prediction.riskBucket',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get model statistics
    const modelStats = await predictionsCollection.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$model',
          count: { $sum: 1 },
          avgProbability: { $avg: '$prediction.failureProbability' }
        }
      }
    ]).toArray();

    // Get recent high-risk predictions
    const recentPredictions = await predictionsCollection.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          id: 1,
          ticketId: 1,
          riskBucket: '$prediction.riskBucket',
          failureProbability: '$prediction.failureProbability',
          recommendedAction: '$prediction.recommendedAction',
          createdAt: 1
        }
      }
    ]).toArray();

    const riskMap = new Map(riskDistribution.map(r => [r._id, r.count]));
    const total = riskDistribution.reduce((sum, r) => sum + r.count, 0);

    return {
      total,
      highRisk: riskMap.get('high') || 0,
      mediumRisk: riskMap.get('medium') || 0,
      lowRisk: riskMap.get('low') || 0,
      byModel: modelStats.map(m => ({
        model: m._id,
        count: m.count,
        avgProbability: m.avgProbability
      })),
      recentPredictions: recentPredictions.map(p => ({
        id: p.id,
        ticketId: p.ticketId,
        riskBucket: p.riskBucket,
        failureProbability: p.failureProbability,
        recommendedAction: p.recommendedAction,
        createdAt: p.createdAt
      }))
    };
  } catch (error) {
    console.error('Error getting prediction summary:', error);
    throw error;
  }
}

/**
 * Get invoice analytics
 * @param buildingId - Building ID to filter by, or null for global statistics
 */
export async function getInvoiceAnalytics(buildingId: string | null): Promise<InvoiceAnalytics> {
  try {
    const db = await getDatabase();
    const invoicesCollection = db.collection('invoices');

    const matchQuery = buildingId ? { buildingId } : {};

    // Get revenue by status
    const revenueByStatus = await invoicesCollection.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get monthly revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await invoicesCollection.aggregate([
      { 
        $match: { 
          ...matchQuery,
          createdAt: { $gte: twelveMonthsAgo }
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m', 
              date: '$createdAt' 
            } 
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    // Calculate totals
    const statusMap = new Map(revenueByStatus.map(r => [r._id, r.totalAmount]));
    const totalInvoices = revenueByStatus.reduce((sum, r) => sum + r.count, 0);
    const totalRevenue = revenueByStatus.reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      totalRevenue,
      pendingAmount: statusMap.get('pending') || 0,
      paidAmount: statusMap.get('paid') || 0,
      cancelledAmount: statusMap.get('cancelled') || 0,
      totalInvoices,
      avgInvoiceAmount: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
      revenueByMonth: monthlyRevenue.map(m => ({
        month: m._id,
        revenue: m.revenue
      }))
    };
  } catch (error) {
    console.error('Error getting invoice analytics:', error);
    throw error;
  }
}

/**
 * Get overall building health score (0-100)
 * @param buildingId - Building ID to filter by, or null for global score
 */
export async function getBuildingHealthScore(buildingId: string | null): Promise<number> {
  try {
    const [ticketStats, predictions] = await Promise.all([
      getTicketStatistics(buildingId),
      getPredictionSummary(buildingId)
    ]);

    // Calculate score based on:
    // 1. Ticket completion rate (40%)
    // 2. Open ticket ratio (30%)
    // 3. High-risk predictions (30%)

    const completionRate = ticketStats.total > 0 
      ? (ticketStats.completed / ticketStats.total) * 100 
      : 100;
    
    const openTicketRatio = ticketStats.total > 0
      ? ((ticketStats.open + ticketStats.assigned) / ticketStats.total) * 100
      : 0;

    const highRiskRatio = predictions.total > 0
      ? (predictions.highRisk / predictions.total) * 100
      : 0;

    // Weight the scores
    const score = 
      (completionRate * 0.4) + 
      ((100 - openTicketRatio) * 0.3) + 
      ((100 - highRiskRatio) * 0.3);

    return Math.round(Math.max(0, Math.min(100, score)));
  } catch (error) {
    console.error('Error calculating building health score:', error);
    return 0;
  }
}
