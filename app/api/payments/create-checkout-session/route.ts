import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, PlanName } from '@/app/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planName, isYearly, userId, userEmail } = body;

    // Validate plan name
    const validPlans: PlanName[] = ['BASIC', 'PRO', 'ENTERPRISE'];
    if (!planName || !validPlans.includes(planName.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid plan name. Must be BASIC, PRO, or ENTERPRISE.' },
        { status: 400 }
      );
    }

    // Construct URLs based on request origin
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const successUrl = `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/payment/cancelled`;

    // Create Stripe Checkout session
    const session = await createCheckoutSession({
      planName: planName.toUpperCase() as PlanName,
      isYearly: Boolean(isYearly),
      userId,
      userEmail,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Handle Stripe-specific errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
