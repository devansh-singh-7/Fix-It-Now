"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Dialog, Transition } from "@headlessui/react";
import {
  signInWithEmail,
  sendPasswordResetEmailClient,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple
} from "@/app/lib/firebaseClient";
import { syncUserToMongoDB, storeAuthToken } from "@/app/lib/authHelpers";

export default function SignInPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true); // Default to true

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmail(email, password, rememberMe);

      // Sync user to MongoDB (auto-creates if missing)
      await syncUserToMongoDB(userCredential.user);

      // Store auth token
      await storeAuthToken(userCredential.user);

      // On success, navigate to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      if (err instanceof Error) {
        if (err.message.includes("invalid-credential") || err.message.includes("user-not-found") || err.message.includes("wrong-password")) {
          setError("Invalid email or password. Please check your credentials.");
        } else if (err.message.includes("too-many-requests")) {
          setError("Too many attempts. Please try again later");
        } else if (err.message.includes("user-disabled")) {
          setError("This account has been disabled");
        } else {
          setError("Failed to sign in. Please check your credentials");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "facebook" | "apple") => {
    setError("");
    setLoading(true);

    try {
      let userCredential;

      switch (provider) {
        case "google":
          userCredential = await signInWithGoogle(rememberMe);
          break;
        case "facebook":
          userCredential = await signInWithFacebook(rememberMe);
          break;
        case "apple":
          userCredential = await signInWithApple(rememberMe);
          break;
        default:
          throw new Error("Unknown provider");
      }

      // Sync user to MongoDB (auto-creates if missing)
      await syncUserToMongoDB(userCredential.user);

      // Store auth token
      await storeAuthToken(userCredential.user);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(`${provider} sign in error:`, err);
      if (err instanceof Error) {
        if (err.message.includes("popup-closed-by-user")) {
          setError("Sign-in cancelled");
        } else if (err.message.includes("account-exists-with-different-credential")) {
          setError("An account already exists with this email using a different sign-in method");
        } else if (err.message.includes("unauthorized-domain")) {
          setError("This domain is not authorized. Please add it to Firebase Console");
        } else {
          setError(err.message || `Failed to sign in with ${provider}`);
        }
      } else {
        setError(`Failed to sign in with ${provider}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetError("");

    if (!validateEmail(resetEmail)) {
      setResetError("Please enter a valid email address");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmailClient(resetEmail);
      setResetSent(true);
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      if (err instanceof Error) {
        if (err.message.includes("user-not-found")) {
          setResetError("No account found with this email");
        } else {
          setResetError("Failed to send reset email. Please try again");
        }
      } else {
        setResetError("An unexpected error occurred");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetDialog = () => {
    setShowResetDialog(false);
    setResetEmail("");
    setResetSent(false);
    setResetError("");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-6 py-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px),
                             linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="relative w-12 h-12">
              <Image
                src="/fixitnow-icon.png"
                alt="FixItNow Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
            </div>
            <span className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              FixItNow
            </span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your maintenance dashboard
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m0 0l7 7m-7-7l7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Main Card */}
        <div className="relative">
          {/* Background Gradient Effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000" />

          <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
            <div className="p-8">
              {/* Social Sign In Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleSocialSignIn("google")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Sign in with Google"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M18.17 8.37H10v3.63h4.69c-.38 2.08-2.21 3.63-4.69 3.63a5.25 5.25 0 110-10.5c1.27 0 2.42.45 3.32 1.2l2.67-2.67A9 9 0 1010 19c4.97 0 9-4.03 9-9 0-.6-.05-1.19-.14-1.76-.03-.21-.12-.43-.27-.6-.15-.17-.35-.27-.57-.27z"
                      fill="#4285F4"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignIn("facebook")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Sign in with Facebook"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#1877F2">
                    <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignIn("apple")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Sign in with Apple"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15.5 8.5c0-.83-.14-1.64-.42-2.38C14.64 5.25 14 4.5 13.17 4c-.83-.5-1.78-.75-2.67-.75-1 0-1.92.33-2.75.83-.83.5-1.5 1.25-1.92 2.08C5.42 6.86 5.25 7.67 5.25 8.5c0 .83.14 1.64.42 2.38.44.87 1.08 1.62 1.92 2.12.83.5 1.75.75 2.66.75 1 0 1.92-.33 2.75-.83.83-.5 1.5-1.25 1.92-2.08.28-.74.42-1.55.42-2.34zm-3.33-5.75c.41 0 .83.08 1.25.25.41.17.75.42 1 .75.25.33.42.75.42 1.25 0 .33-.08.66-.25.91-.17.25-.42.42-.75.5-.33.08-.67 0-.92-.25-.25-.25-.41-.58-.41-.91 0-.42.16-.83.5-1.08.33-.25.75-.42 1.16-.42z" />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Or continue with email
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailPasswordSignIn} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89-4.46a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      onBlur={() => validateEmail(email)}
                      disabled={loading}
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                      className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${emailError
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500'
                        } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50`}
                      placeholder="you@example.com"
                    />
                  </div>
                  <AnimatePresence>
                    {emailError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        id="email-error"
                        className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) validatePassword(e.target.value);
                      }}
                      onBlur={() => validatePassword(password)}
                      disabled={loading}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "password-error" : undefined}
                      className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${passwordError
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500'
                        } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {passwordError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        id="password-error"
                        className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {passwordError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-600 border-gray-300 dark:border-gray-700 rounded cursor-pointer bg-white dark:bg-gray-800"
                      disabled={loading}
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetDialog(true);
                    }}
                    disabled={loading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full px-4 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Sign up now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Password Reset Dialog */}
      <Transition show={showResetDialog} as={React.Fragment}>
        <Dialog onClose={closeResetDialog} className="relative z-50">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-8 max-w-md w-full">
                {/* Background Gradient Effect */}
                <div className="absolute -inset-1 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20" />

                <div className="relative">
                  {resetSent ? (
                    <div className="text-center">
                      <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Check your email
                      </Dialog.Title>
                      <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-8">
                        We&apos;ve sent password reset instructions to{' '}
                        <span className="font-semibold text-gray-900 dark:text-white">{resetEmail}</span>
                      </Dialog.Description>
                      <motion.button
                        onClick={closeResetDialog}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300"
                      >
                        Got it
                      </motion.button>
                    </div>
                  ) : (
                    <>
                      <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Reset your password
                      </Dialog.Title>
                      <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-6">
                        Enter your email address and we&apos;ll send you instructions to reset your password.
                      </Dialog.Description>

                      <AnimatePresence>
                        {resetError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                            role="alert"
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">{resetError}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mb-6">
                        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89-4.46a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            disabled={resetLoading}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          onClick={closeResetDialog}
                          disabled={resetLoading}
                          whileHover={{ scale: resetLoading ? 1 : 1.02 }}
                          whileTap={{ scale: resetLoading ? 1 : 0.98 }}
                          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          onClick={handlePasswordReset}
                          disabled={resetLoading}
                          whileHover={{ scale: resetLoading ? 1 : 1.02 }}
                          whileTap={{ scale: resetLoading ? 1 : 0.98 }}
                          className="flex-1 px-4 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {resetLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            "Send reset link"
                          )}
                        </motion.button>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}