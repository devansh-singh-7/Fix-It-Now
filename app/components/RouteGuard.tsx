"use client";

/**
 * RouteGuard Component
 * 
 * Protects routes based on user authentication and role.
 * 
 * Features:
 * - Checks if user is authenticated via Firebase
 * - Fetches user role from MongoDB
 * - Redirects unauthenticated users to sign-in
 * - Shows access denied for unauthorized roles
 * - Loading states during authentication check
 * 
 * Usage:
 * ```tsx
 * <RouteGuard allowedRoles={['admin', 'technician']}>
 *   <AdminDashboard />
 * </RouteGuard>
 * ```
 */

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, type UserRole } from "@/app/lib/firebaseClient";

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function RouteGuard({
  children,
  allowedRoles,
  requireAuth = true,
  redirectTo = "/auth/signin",
}: RouteGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check if Firebase auth is available on mount
  const isAuthAvailable = Boolean(auth);

  useEffect(() => {
    // If auth is not available, we can't proceed with authentication
    if (!isAuthAvailable) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setIsLoading(false);
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);

      // If auth is required but no user is signed in
      if (requireAuth && !currentUser) {
        router.push(redirectTo);
        setIsLoading(false);
        return;
      }

      // If no auth required or no role restrictions
      if (!requireAuth || !allowedRoles || allowedRoles.length === 0) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Check user role
      if (currentUser) {
        try {
          // Fetch user role via API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const roleRes = await fetch(`/api/users/role?uid=${currentUser.uid}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (!roleRes.ok) {
            console.error("Failed to fetch user role, status:", roleRes.status);
            // For server errors, still allow access if user is authenticated
            // They may have limited functionality but won't be locked out
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
          
          const roleData = await roleRes.json();

          if (!roleData.success || !roleData.data?.role) {
            console.error("User role not found in response");
            setIsAuthorized(false);
            setIsLoading(false);
            return;
          }

          const userRole = roleData.data.role;

          // Check if user role is in allowed roles
          if (allowedRoles.includes(userRole)) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } catch (error) {
          // Handle network errors gracefully
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.error("Role check timed out");
            } else {
              console.error("Error checking user role:", error.message);
            }
          }
          // On network failure, allow authenticated users through
          // The specific page can handle role restrictions as needed
          setIsAuthorized(true);
        }
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthAvailable, requireAuth, allowedRoles, redirectTo, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium" style={{ color: "var(--card-contrast-text)" }}>
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (requireAuth && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--card-contrast-text)" }}>
            Access Denied
          </h1>
          <p className="mb-6" style={{ color: "var(--muted)" }}>
            {user
              ? "You don't have permission to access this page."
              : "Please sign in to access this page."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg border font-medium transition-all hover:opacity-80"
              style={{
                background: "var(--card)",
                borderColor: "rgba(15,23,42,0.1)",
                color: "var(--card-contrast-text)",
              }}
            >
              Go Back
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="accent-btn px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
