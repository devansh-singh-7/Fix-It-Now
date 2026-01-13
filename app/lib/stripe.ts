/**
 * Stripe Configuration and Server Client
 * 
 * Server-side Stripe initialization and plan configuration.
 * Uses dynamic price creation for checkout sessions.
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY not found in environment variables');
}

export const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Plan pricing configuration in paise (1 INR = 100 paise)
export const PLAN_PRICING = {
  BASIC: {
    monthly: 49900,    // ₹499/month
    yearly: 399 * 12 * 100,  // ₹399/month billed yearly
    name: 'Basic Plan',
    description: 'Perfect for individual building managers',
    features: [
      '1 Building registration',
      'Up to 50 units',
      'Basic ticket management',
      'Email support',
      'Building code generation',
    ],
  },
  PRO: {
    monthly: 99900,    // ₹999/month
    yearly: 799 * 12 * 100,  // ₹799/month billed yearly
    name: 'Pro Plan',
    description: 'Ideal for property management companies',
    features: [
      'Up to 5 buildings',
      'Unlimited units',
      'Advanced ticket management',
      'Technician management',
      'Priority support',
      'Analytics dashboard',
      'Custom building codes',
    ],
  },
  ENTERPRISE: {
    monthly: 249900,   // ₹2,499/month
    yearly: 1999 * 12 * 100, // ₹1,999/month billed yearly
    name: 'Enterprise Plan',
    description: 'For large organizations with specific needs',
    features: [
      'Unlimited buildings',
      'Unlimited units',
      'All Pro features',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'SLA agreement',
      '24/7 phone support',
    ],
  },
} as const;

export type PlanName = keyof typeof PLAN_PRICING;

// Plan to subscription tier mapping
export const PLAN_TO_TIER: Record<PlanName, 1 | 2 | 3> = {
  ENTERPRISE: 1,
  PRO: 2,
  BASIC: 3,
};

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession({
  planName,
  isYearly,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  planName: PlanName;
  isYearly: boolean;
  userId?: string;
  userEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const plan = PLAN_PRICING[planName];
  const amount = isYearly ? plan.yearly : plan.monthly;
  const billingCycle = isYearly ? 'yearly' : 'monthly';

  // Create checkout session with dynamic pricing
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: isYearly 
            ? Math.round(amount / 12)  // Monthly amount for yearly billing
            : amount,
          recurring: {
            interval: isYearly ? 'year' : 'month',
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    metadata: {
      planName,
      billingCycle,
      userId: userId || '',
      tier: PLAN_TO_TIER[planName].toString(),
    },
    subscription_data: {
      metadata: {
        planName,
        billingCycle,
        userId: userId || '',
        tier: PLAN_TO_TIER[planName].toString(),
      },
    },
  });

  return session;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Create Stripe Customer Portal session for subscription management
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
