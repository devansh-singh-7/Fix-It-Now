import { NextRequest, NextResponse } from "next/server";

// Plan pricing in paise (1 INR = 100 paise)
const PLAN_PRICES = {
    BASIC: { monthly: 49900, yearly: 399 * 12 * 100 },
    PRO: { monthly: 99900, yearly: 799 * 12 * 100 },
    ENTERPRISE: { monthly: 249900, yearly: 1999 * 12 * 100 },
};

// Generate a mock order ID
function generateMockOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MOCK_ORDER_${timestamp}_${random}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planName, isYearly } = body;

        // Validate plan name
        if (!planName || !PLAN_PRICES[planName as keyof typeof PLAN_PRICES]) {
            return NextResponse.json(
                { error: "Invalid plan name" },
                { status: 400 }
            );
        }

        const planPrices = PLAN_PRICES[planName as keyof typeof PLAN_PRICES];
        const amount = isYearly ? planPrices.yearly : planPrices.monthly;

        // Create mock order (simulating payment gateway)
        // In production, this would call a real payment provider
        const mockOrder = {
            id: generateMockOrderId(),
            amount: amount,
            currency: "INR",
            receipt: `order_${Date.now()}`,
            status: "created",
            notes: {
                planName,
                billingCycle: isYearly ? "yearly" : "monthly",
            },
        };

        // Simulate network delay for realistic demo experience
        await new Promise((resolve) => setTimeout(resolve, 500));

        return NextResponse.json({
            orderId: mockOrder.id,
            amount: mockOrder.amount,
            currency: mockOrder.currency,
            planName,
            isYearly,
            // Mock indicator for demo purposes
            isMockPayment: true,
        });
    } catch (error) {
        console.error("Error creating mock order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}
