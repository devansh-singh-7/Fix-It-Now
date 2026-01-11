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

    // If no buildingId provided, return global analytics across all buildings
    if (!buildingId) {
      const [ticketStats, technicianPerformance, predictionSummary, invoiceAnalytics, healthScore] =
        await Promise.all([
          getTicketStatistics(null),
          getTechnicianPerformance(null),
          getPredictionSummary(null),
          getInvoiceAnalytics(null),
          getBuildingHealthScore(null),
        ]);

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
    const [ticketStats, technicianPerformance, predictionSummary, invoiceAnalytics, healthScore] =
      await Promise.all([
        getTicketStatistics(buildingId),
        getTechnicianPerformance(buildingId),
        getPredictionSummary(buildingId),
        getInvoiceAnalytics(buildingId),
        getBuildingHealthScore(buildingId),
      ]);

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
    console.error('Analytics overview error:', error);
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
