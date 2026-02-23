import { NextRequest, NextResponse } from "next/server";
import { updateUserSubscription } from "@/app/lib/database";
import type { SubscriptionTier } from "@/app/lib/types";

// Plan to tier mapping
const PLAN_TO_TIER: Record<string, SubscriptionTier> = {
    'ENTERPRISE': 1,
    'PRO': 2,
    'BASIC': 3,
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            orderId,
            paymentId,
            planName,
            isYearly,
            userId  // Firebase UID of the user
        } = body;

        // Validate required fields for mock payment
        if (!orderId || !paymentId) {
            return NextResponse.json(
                { error: "Missing payment verification fields" },
                { status: 400 }
            );
        }

        // Mock verification - in a real system, this would verify with the payment provider
        // For demo purposes, we accept all payments that have the MOCK_ prefix
        const isMockOrder = orderId.startsWith("MOCK_ORDER_");
        const isMockPayment = paymentId.startsWith("MOCK_PAY_");

        if (!isMockOrder || !isMockPayment) {
            return NextResponse.json(
                { error: "Invalid payment credentials - demo mode only accepts mock payments" },
                { status: 400 }
            );
        }

        // Validate plan name
        const plan = planName?.toUpperCase() as 'BASIC' | 'PRO' | 'ENTERPRISE';
        if (!plan || !PLAN_TO_TIER[plan]) {
            return NextResponse.json(
                { error: "Invalid plan name" },
                { status: 400 }
            );
        }

        // Simulate verification delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Save subscription to database if userId is provided
        let subscriptionSaved = false;
        if (userId) {
            const tier = PLAN_TO_TIER[plan];
            const result = await updateUserSubscription(userId, plan, tier, isYearly || false);

            if (result.success) {
                subscriptionSaved = true;
                console.log(`Subscription saved for user ${userId}: ${plan} (Tier ${tier})`);
            } else {
                console.error(`Failed to save subscription: ${result.error}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified successfully (Demo Mode)",
            paymentId,
            orderId,
            planName: plan,
            subscriptionTier: PLAN_TO_TIER[plan],
            isYearly,
            isMockPayment: true,
            subscriptionSaved,
        });
    } catch (error) {
        console.error("Error verifying mock payment:", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
