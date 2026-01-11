import { NextResponse } from 'next/server';
import { createTicket } from '@/app/lib/database';
import type { TicketCategory, TicketPriority } from '@/app/lib/types';
import { createTicketSchema } from '@/app/lib/schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Zod Validation
    const validation = createTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      priority,
      status,
      location,
      contactPhone,
      imageUrls,
      imagePublicIds,
      createdByName,
      buildingId,
      uid
    } = validation.data;

    // Rate Limiting: 10 tickets per hour per user
    if (uid) {
      const { rateLimit } = await import('@/app/lib/rateLimit');
      const limitResult = await rateLimit(`ticket_create:${uid}`, 10, 60 * 60 * 1000); // 1 hour window

      if (!limitResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            details: `You can only create 10 tickets per hour. Please try again later.`,
            retryAfter: Math.ceil((limitResult.reset - Date.now()) / 1000)
          },
          { status: 429 }
        );
      }
    }

    // Create ticket
    const ticket = await createTicket({
      title,
      description,
      category: category as TicketCategory,
      priority: priority as TicketPriority,
      status: status || 'open',
      location,
      contactPhone,
      imageUrls: imageUrls || [],
      imagePublicIds: imagePublicIds || [],
      createdByName,
      buildingId,
    }, uid);

    return NextResponse.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create ticket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
