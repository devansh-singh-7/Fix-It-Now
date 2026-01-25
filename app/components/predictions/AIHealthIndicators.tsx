"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { BuildingHealthTrend } from "@/app/lib/types";

// Mock data for Pro tier building trends
const mockBuildingTrends: BuildingHealthTrend[] = [
  {
    buildingId: "b1",
    buildingName: "Sunrise Towers",
    trendDirection: "improving",
    narrativeInsight: "Overall maintenance health is improving. 15% fewer issues reported this month compared to last.",
    issueCountChange: -15,
    lastUpdated: new Date(),
  },
  {
    buildingId: "b2",
    buildingName: "Apex Plaza",
    trendDirection: "stable",
    narrativeInsight: "Maintenance health is stable. Routine check-ups are on schedule with no major concerns.",
    issueCountChange: 2,
    lastUpdated: new Date(),
  },
  {
    buildingId: "b3",
    buildingName: "Quantum Heights",
    trendDirection: "declining",
    narrativeInsight: "Maintenance health is declining. Critical components require attention to prevent escalation.",
    issueCountChange: 28,
    lastUpdated: new Date(),
  },
];

const trendConfig = {
  improving: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    label: "Improving",
  },
  stable: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
    label: "Stable",
  },
  declining: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    label: "Declining",
  },
};

export function AIHealthIndicators() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Maintenance Health Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor your building maintenance trends at a glance
        </p>
        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
          Pro Plan
        </div>
      </div>

      {/* Building Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockBuildingTrends.map((trend, index) => {
          const config = trendConfig[trend.trendDirection];
          return (
            <motion.div
              key={trend.buildingId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                ${config.bg} ${config.border}
                border rounded-xl p-5 relative overflow-hidden
              `}
            >
              {/* Trend Icon */}
              <div className={`${config.text} mb-3`}>
                {config.icon}
              </div>

              {/* Building Name */}
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {trend.buildingName}
              </h3>

              {/* Trend Label */}
              <p className={`${config.text} font-medium mt-1`}>
                {config.label}
              </p>

              {/* Narrative */}
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                {trend.narrativeInsight}
              </p>

              {/* Locked Indicator */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Detailed predictions available in Enterprise</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* What's Hidden Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          What you&apos;re missing with Pro
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "🎯", label: "Exact failure timing", desc: "Know precisely when assets will fail" },
            { icon: "🔍", label: "Unit-level predictions", desc: "Detailed per-asset risk analysis" },
            { icon: "💰", label: "Cost savings estimates", desc: "Track ROI on preventive maintenance" },
            { icon: "📋", label: "Action recommendations", desc: "Step-by-step prevention guides" },
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-2xl opacity-40">{feature.icon}</span>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">{feature.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">
              Unlock full failure predictions and preventive planning
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              Enterprise plan includes detailed asset predictions, cost analysis, and automated scheduling.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            View Enterprise Plan
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default AIHealthIndicators;
