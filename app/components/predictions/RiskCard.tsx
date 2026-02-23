"use client";

import React from "react";
import { motion } from "framer-motion";
import type { RiskBucket } from "@/app/lib/types";

interface RiskCardProps {
  assetName: string;
  assetType: string;
  riskLevel: RiskBucket;
  failureWindow: string;
  reason: string;
  onClick?: () => void;
}

const riskConfig = {
  high: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    icon: "text-red-600 dark:text-red-400",
    label: "High Risk",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-400",
    label: "Medium Risk",
  },
  low: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
    label: "Low Risk",
  },
};

const assetIcons: Record<string, React.ReactNode> = {
  hvac: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  elevator: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
    </svg>
  ),
  plumbing: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  electrical: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  default: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export function RiskCard({
  assetName,
  assetType,
  riskLevel,
  failureWindow,
  reason,
  onClick,
}: RiskCardProps) {
  const config = riskConfig[riskLevel];
  const icon = assetIcons[assetType] || assetIcons.default;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        ${config.bg} ${config.border}
        border rounded-xl p-4 cursor-pointer
        transition-shadow duration-200 hover:shadow-lg
        group
      `}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Asset Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${config.badge}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
              {assetName}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Est. failure: <span className="font-medium">{failureWindow}</span>
            </p>
          </div>
        </div>

        {/* Right: Risk Badge */}
        <span className={`
          px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap
          ${config.badge}
        `}>
          {config.label}
        </span>
      </div>

      {/* Reason */}
      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {reason}
      </p>

      {/* Hover Arrow */}
      <div className="mt-3 flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        <span>View details</span>
        <svg
          className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}

export default RiskCard;
