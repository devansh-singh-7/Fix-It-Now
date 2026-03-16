import { NextResponse } from 'next/server';
import {
  getTicketStatistics,
  getTechnicianPerformance,
  getPredictionSummary,
  getInvoiceAnalytics,
  getBuildingHealthScore,
} from '@/app/lib/analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    console.log('[Analytics API] Request received:', {
      buildingId,
      hasAuth: request.headers.get('authorization') ? 'yes' : 'no'
    });

    // If no buildingId provided, return global analytics across all buildings
    if (!buildingId || buildingId === 'all') {
      console.log('[Analytics API] Fetching global analytics for all buildings');
      
      const [ticketStats, technicianPerformance, predictionSummary, invoiceAnalytics, healthScore] =
        await Promise.all([
          getTicketStatistics(null),
          getTechnicianPerformance(null),
          getPredictionSummary(null),
          getInvoiceAnalytics(null),
          getBuildingHealthScore(null),
        ]);

      console.log('[Analytics API] Global data fetched:', {
        tickets: ticketStats.total,
        technicians: technicianPerformance.length,
        predictions: predictionSummary.total
      });

      return NextResponse.json({
        success: true,
        data: {
          buildingId: null, // Global analytics
          healthScore,
          tickets: ticketStats,
          technicians: technicianPerformance,
          predictions: predictionSummary,
          invoices: invoiceAnalytics,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Fetch all analytics in parallel for specific building
    console.log('[Analytics API] Fetching analytics for building:', buildingId);
    
    const [ticketStats, technicianPerformance, predictionSummary, invoiceAnalytics, healthScore] =
      await Promise.all([
        getTicketStatistics(buildingId),
        getTechnicianPerformance(buildingId),
        getPredictionSummary(buildingId),
        getInvoiceAnalytics(buildingId),
        getBuildingHealthScore(buildingId),
      ]);

    console.log('[Analytics API] Building data fetched:', {
      buildingId,
      tickets: ticketStats.total,
      technicians: technicianPerformance.length,
      predictions: predictionSummary.total
    });

    return NextResponse.json({
      success: true,
      data: {
        buildingId,
        healthScore,
        tickets: ticketStats,
        technicians: technicianPerformance,
        predictions: predictionSummary,
        invoices: invoiceAnalytics,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
