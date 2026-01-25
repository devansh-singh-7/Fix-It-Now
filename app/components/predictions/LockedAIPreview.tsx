"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function LockedAIPreview() {
  return (
    <div className="relative min-h-[600px] overflow-hidden">
      {/* Blurred Background - Mock Dashboard */}
      <div className="absolute inset-0 opacity-30 blur-sm pointer-events-none select-none">
        {/* Fake Header */}
        <div className="p-6">
          <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>

        {/* Fake Stats Grid */}
        <div className="px-6 grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 h-24" />
          ))}
        </div>

        {/* Fake Risk Cards */}
        <div className="px-6 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-4 h-32" />
            <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-4 h-32" />
            <div className="bg-amber-100 dark:bg-amber-900/20 rounded-xl p-4 h-28" />
            <div className="bg-amber-100 dark:bg-amber-900/20 rounded-xl p-4 h-28" />
          </div>
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 h-48" />
            <div className="bg-blue-100 dark:bg-blue-900/20 rounded-xl p-4 h-32" />
          </div>
        </div>
      </div>

      {/* Overlay Card */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center"
        >
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          {/* Headline */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Predict Failures Before They Happen
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            Reduce downtime by up to 40% and prevent costly emergency repairs with intelligent maintenance predictions.
          </p>

          {/* Value Props */}
          <div className="space-y-3 mb-8">
            {[
              "Identify at-risk equipment before breakdowns",
              "Reduce emergency repair costs significantly",
              "Optimize your maintenance schedule",
            ].map((prop, i) => (
              <div key={i} className="flex items-center gap-2 text-left">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{prop}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link
              href="/profile"
              className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
            >
              Upgrade Your Plan
            </Link>
            <Link
              href="/help"
              className="block w-full py-3 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Learn how it works
            </Link>
          </div>

          {/* Plan Badge */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Available on <span className="font-semibold text-blue-600 dark:text-blue-400">Pro</span> and <span className="font-semibold text-purple-600 dark:text-purple-400">Enterprise</span> plans
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LockedAIPreview;
