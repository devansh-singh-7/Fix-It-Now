"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { UserRole, SubscriptionTier, PredictorAccessLevel } from "@/app/lib/types";
import { getPredictorAccessLevel } from "@/app/lib/predictor-access";

// Lazy load components based on access level
const NavBar = dynamic(() => import("@/app/components/NavBar"), { ssr: false });
const PredictorDashboard = dynamic(
  () => import("@/app/components/predictions/PredictorDashboard"),
  {
    ssr: false,
    loading: () => <LoadingState />,
  }
);
const AIHealthIndicators = dynamic(
  () => import("@/app/components/predictions/AIHealthIndicators"),
  {
    ssr: false,
    loading: () => <LoadingState />,
  }
);
const LockedAIPreview = dynamic(
  () => import("@/app/components/predictions/LockedAIPreview"),
  {
    ssr: false,
    loading: () => <LoadingState />,
  }
);

function LoadingState() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 w-72 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    </div>
  );
}

interface UserState {
  role: UserRole;
  subscriptionTier?: SubscriptionTier | null;
  buildingId?: string;
}

export default function PredictionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserState | null>(null);
  const [accessLevel, setAccessLevel] = useState<PredictorAccessLevel>("none");

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("authToken");
      const userProfile = localStorage.getItem("userProfile");

      if (!token || !userProfile) {
        router.push("/auth/signin");
        return;
      }

      try {
        const profile = JSON.parse(userProfile);

        // Extract role
        const extractedRole: UserRole =
          typeof profile.role === "object"
            ? profile.role?.role || profile.role
            : profile.role || "resident";

        // Extract subscription tier
        const extractedTier: SubscriptionTier | null =
          profile.subscriptionTier ||
          (profile.subscriptionPlan === "ENTERPRISE"
            ? 1
            : profile.subscriptionPlan === "PRO"
            ? 2
            : profile.subscriptionPlan === "BASIC"
            ? 3
            : null);

        // Extract buildingId
        const extractedBuildingId =
          typeof profile.buildingId === "object"
            ? profile.buildingId?.buildingId || profile.buildingId
            : profile.buildingId;

        setUser({
          role: extractedRole,
          subscriptionTier: extractedTier,
          buildingId: extractedBuildingId,
        });

        // Calculate access level
        const access = getPredictorAccessLevel(extractedRole, extractedTier);
        setAccessLevel(access);

        console.log("Predictions page - Access level:", {
          role: extractedRole,
          tier: extractedTier,
          access,
        });
      } catch (error) {
        console.error("Error parsing user profile:", error);
        router.push("/auth/signin");
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <NavBar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingState />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Render based on access level */}
        {accessLevel === "full" && user && (
          <PredictorDashboard
            userRole={user.role}
            subscriptionTier={user.subscriptionTier}
            buildingId={user.buildingId}
          />
        )}

        {accessLevel === "limited" && <AIHealthIndicators />}

        {accessLevel === "none" && <LockedAIPreview />}
      </main>
    </div>
  );
}
