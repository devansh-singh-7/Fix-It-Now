"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Loader2, CreditCard, X, Shield, Zap } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

interface PricingPlan {
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    description: string;
    buttonText: string;
    href: string;
    isPopular: boolean;
}

interface PricingProps {
    plans: PricingPlan[];
    title?: string;
    description?: string;
}

// Mock Payment Modal Component
function MockPaymentModal({
    isOpen,
    onClose,
    onSuccess,
    plan,
    amount,
    isYearly,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plan: PricingPlan;
    amount: number;
    isYearly: boolean;
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<"form" | "processing" | "success">("form");

    const handlePayment = async () => {
        setIsProcessing(true);
        setStep("processing");

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setStep("success");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        onSuccess();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-white" />
                            <span className="text-white font-semibold">Demo Payment</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                            disabled={isProcessing}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {step === "form" && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {/* Plan Summary */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Plan</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {plan.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Billing</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {isYearly ? "Yearly" : "Monthly"}
                                        </span>
                                    </div>
                                    <hr className="my-3 border-gray-200 dark:border-gray-700" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Total</span>
                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            ₹{(amount / 100).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Demo Notice */}
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <div>
                                            <p className="text-amber-800 dark:text-amber-200 font-medium text-sm">
                                                Demo Mode Active
                                            </p>
                                            <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                                                This is a simulated payment. No real charges will be made.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mock Card Form (Visual Only) */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Card Number
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value="4242 4242 4242 4242"
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Expiry
                                            </label>
                                            <input
                                                type="text"
                                                value="12/28"
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                CVV
                                            </label>
                                            <input
                                                type="text"
                                                value="123"
                                                readOnly
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <button
                                    onClick={handlePayment}
                                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Shield className="h-4 w-4" />
                                    Pay ₹{(amount / 100).toLocaleString()}
                                </button>
                            </motion.div>
                        )}

                        {step === "processing" && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="py-12 text-center"
                            >
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Processing Payment
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Please wait while we verify your demo payment...
                                </p>
                            </motion.div>
                        )}

                        {step === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="py-12 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                    className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                                >
                                    <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
                                </motion.div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Payment Successful!
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Redirecting you to complete signup...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

export function Pricing({
    plans,
    title = "Simple, Transparent Pricing",
    description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
    const [isMonthly, setIsMonthly] = useState(true);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [orderData, setOrderData] = useState<{ amount: number } | null>(null);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const switchRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();

    const handleToggle = (checked: boolean) => {
        setIsMonthly(!checked);
        if (checked && switchRef.current) {
            const rect = switchRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            confetti({
                particleCount: 50,
                spread: 60,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight,
                },
                colors: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"],
                ticks: 200,
                gravity: 1.2,
                decay: 0.94,
                startVelocity: 30,
                shapes: ["circle"],
            });
        }
    };

    const handlePayment = useCallback(async (plan: PricingPlan) => {
        // Skip payment for "Contact Sales" type buttons
        if (plan.buttonText === "Contact Sales") {
            router.push(plan.href);
            return;
        }

        setLoadingPlan(plan.name);

        try {
            // Create order on backend
            const response = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planName: plan.name,
                    isYearly: !isMonthly,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create order");
            }

            const data = await response.json();

            // Store order data and show payment modal
            setSelectedPlan(plan);
            setOrderData(data);
            setShowPaymentModal(true);
        } catch (error) {
            console.error("Payment error:", error);
            alert("Failed to initiate payment. Please try again.");
        } finally {
            setLoadingPlan(null);
        }
    }, [isMonthly, router]);

    const handlePaymentSuccess = async () => {
        if (!selectedPlan || !orderData) return;

        try {
            // Generate mock payment ID
            const mockPaymentId = `MOCK_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Get user ID from localStorage if logged in
            let userId: string | undefined;
            if (typeof window !== 'undefined') {
                const userProfile = localStorage.getItem('userProfile');
                if (userProfile) {
                    const profile = JSON.parse(userProfile);
                    userId = profile.uid || profile.firebaseUid;
                }
            }

            // Verify payment on backend
            const verifyResponse = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: (orderData as { orderId?: string }).orderId || `MOCK_ORDER_${Date.now()}`,
                    paymentId: mockPaymentId,
                    planName: selectedPlan.name,
                    isYearly: !isMonthly,
                    userId,  // Pass userId to save subscription to database
                }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
                // Update localStorage with subscription info
                if (typeof window !== 'undefined') {
                    const userProfile = localStorage.getItem('userProfile');
                    if (userProfile) {
                        const profile = JSON.parse(userProfile);
                        profile.subscriptionPlan = verifyData.planName;
                        profile.subscriptionTier = verifyData.subscriptionTier;
                        localStorage.setItem('userProfile', JSON.stringify(profile));
                    }
                }

                // Payment successful - celebrate!
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ["#22c55e", "#16a34a", "#15803d"],
                });

                setShowPaymentModal(false);

                // If user is logged in, go to dashboard; otherwise go to signup
                if (userId) {
                    router.push("/dashboard");
                } else {
                    router.push("/auth/signup?plan=" + selectedPlan.name.toLowerCase());
                }
            } else {
                alert("Payment verification failed. Please contact support.");
                setShowPaymentModal(false);
            }
        } catch {
            alert("Error verifying payment. Please contact support.");
            setShowPaymentModal(false);
        }
    };

    return (
        <div className="container py-20">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-gray-900 dark:text-white">
                    {title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg whitespace-pre-line max-w-2xl mx-auto">
                    {description}
                </p>
            </div>

            <div className="flex justify-center mb-10">
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            ref={switchRef as React.Ref<HTMLButtonElement>}
                            checked={!isMonthly}
                            onCheckedChange={handleToggle}
                            className="relative"
                        />
                    </Label>
                </label>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                    Annual billing <span className="text-blue-600 dark:text-blue-400">(Save 20%)</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-4 max-w-6xl mx-auto">
                {plans.map((plan, index) => (
                    <motion.div
                        key={index}
                        initial={{ y: 50, opacity: 1 }}
                        whileInView={
                            isDesktop
                                ? {
                                    y: plan.isPopular ? -20 : 0,
                                    opacity: 1,
                                    x: index === 2 ? -30 : index === 0 ? 30 : 0,
                                    scale: index === 0 || index === 2 ? 0.94 : 1.0,
                                }
                                : {}
                        }
                        viewport={{ once: true }}
                        transition={{
                            duration: 1.6,
                            type: "spring",
                            stiffness: 100,
                            damping: 30,
                            delay: 0.4,
                            opacity: { duration: 0.5 },
                        }}
                        className={cn(
                            `rounded-2xl border p-6 bg-white dark:bg-gray-900 text-center lg:flex lg:flex-col lg:justify-center relative`,
                            plan.isPopular ? "border-blue-600 border-2 shadow-lg shadow-blue-500/10" : "border-gray-200 dark:border-gray-800",
                            "flex flex-col",
                            !plan.isPopular && "mt-5",
                            index === 0 || index === 2
                                ? "z-0 transform translate-x-0 translate-y-0"
                                : "z-10",
                            index === 0 && "origin-right",
                            index === 2 && "origin-left"
                        )}
                    >
                        {plan.isPopular && (
                            <div className="absolute top-0 right-0 bg-blue-600 py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                                <Star className="text-white h-4 w-4 fill-current" />
                                <span className="text-white ml-1 font-sans font-semibold text-sm">
                                    Popular
                                </span>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col">
                            <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
                                {plan.name}
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-x-2">
                                <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    <NumberFlow
                                        value={
                                            isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)
                                        }
                                        format={{
                                            style: "currency",
                                            currency: "INR",
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        }}
                                        transformTiming={{
                                            duration: 500,
                                            easing: "ease-out",
                                        }}
                                        willChange
                                        className="font-variant-numeric: tabular-nums"
                                    />
                                </span>
                                {plan.period !== "Next 3 months" && (
                                    <span className="text-sm font-semibold leading-6 tracking-wide text-gray-500 dark:text-gray-400">
                                        / {plan.period}
                                    </span>
                                )}
                            </div>

                            <p className="text-xs leading-5 text-gray-500 dark:text-gray-400 mt-1">
                                {isMonthly ? "billed monthly" : "billed annually"}
                            </p>

                            <ul className="mt-5 gap-2 flex flex-col text-left">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <hr className="w-full my-4 border-gray-200 dark:border-gray-700" />

                            <button
                                onClick={() => handlePayment(plan)}
                                disabled={loadingPlan !== null}
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                    }),
                                    "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                                    "transform-gpu ring-offset-current transition-all duration-300 hover:ring-2 hover:ring-blue-600 hover:ring-offset-1",
                                    plan.isPopular
                                        ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white border-gray-300 dark:border-gray-600",
                                    loadingPlan === plan.name && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {loadingPlan === plan.name ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    plan.buttonText
                                )}
                            </button>
                            <p className="mt-6 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {plan.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Mock Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && selectedPlan && orderData && (
                    <MockPaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        onSuccess={handlePaymentSuccess}
                        plan={selectedPlan}
                        amount={orderData.amount}
                        isYearly={!isMonthly}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Default plans for FixItUp building management
export const fixitupPlans: PricingPlan[] = [
    {
        name: "BASIC",
        price: "499",
        yearlyPrice: "399",
        period: "month",
        features: [
            "1 Building registration",
            "Up to 50 units",
            "Basic ticket management",
            "Email support",
            "Building code generation",
        ],
        description: "Perfect for individual building managers",
        buttonText: "Get Started",
        href: "/auth/signup",
        isPopular: false,
    },
    {
        name: "PRO",
        price: "999",
        yearlyPrice: "799",
        period: "month",
        features: [
            "Up to 5 buildings",
            "Unlimited units",
            "Advanced ticket management",
            "Technician management",
            "Priority support",
            "Analytics dashboard",
            "Custom building codes",
        ],
        description: "Ideal for property management companies",
        buttonText: "Get Started",
        href: "/auth/signup",
        isPopular: true,
    },
    {
        name: "ENTERPRISE",
        price: "2499",
        yearlyPrice: "1999",
        period: "month",
        features: [
            "Unlimited buildings",
            "Unlimited units",
            "All Pro features",
            "Dedicated account manager",
            "API access",
            "Custom integrations",
            "SLA agreement",
            "24/7 phone support",
        ],
        description: "For large organizations with specific needs",
        buttonText: "Contact Sales",
        href: "/contact",
        isPopular: false,
    },
];
