import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { updateUserSubscription } from '@/app/lib/database';
import { getDatabase } from '@/app/lib/mongodb';
import Stripe from 'stripe';

/**
 * Update user's Stripe customer ID and subscription details in database
 */
async function updateUserStripeData(
  userId: string,
  stripeCustomerId: string,
  subscriptionId: string,
  subscriptionStatus: string
) {
  try {
    const db = await getDatabase();
    await db.collection('users').updateOne(
      { firebaseUid: userId },
      {
        $set: {
          stripeCustomerId,
          subscriptionId,
          subscriptionStatus,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Updated Stripe data for user ${userId}`);
  } catch (error) {
    console.error('Error updating user Stripe data:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Checkout session completed:', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata,
        });

        const metadata = session.metadata;
        if (!metadata) {
          console.error('No metadata in checkout session');
          break;
        }

        const { planName, billingCycle, userId, tier } = metadata;
        
        if (userId) {
          // Update user's subscription in database
          const plan = planName as 'BASIC' | 'PRO' | 'ENTERPRISE';
          const tierNum = parseInt(tier) as 1 | 2 | 3;
          const isYearly = billingCycle === 'yearly';

          await updateUserSubscription(userId, plan, tierNum, isYearly);

          // Store Stripe customer and subscription IDs
          if (session.customer && session.subscription) {
            await updateUserStripeData(
              userId,
              session.customer as string,
              session.subscription as string,
              'active'
            );
          }

          console.log(`Subscription activated for user ${userId}: ${plan} (Tier ${tierNum})`);
        } else {
          console.log('No userId in metadata - user will need to link subscription after signup');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        
        // Update subscription status in database if needed
        const metadata = subscription.metadata;
        if (metadata?.userId) {
          const db = await getDatabase();
          await db.collection('users').updateOne(
            { firebaseUid: metadata.userId },
            {
              $set: {
                subscriptionStatus: subscription.status,
                updatedAt: new Date(),
              },
            }
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription cancelled:', subscription.id);
        
        // Mark subscription as cancelled in database
        const metadata = subscription.metadata;
        if (metadata?.userId) {
          const db = await getDatabase();
          await db.collection('users').updateOne(
            { firebaseUid: metadata.userId },
            {
              $set: {
                subscriptionStatus: 'canceled',
                updatedAt: new Date(),
              },
            }
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed for invoice:', invoice.id);
        
        // Could notify user or update status
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
