"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface QuickActionsProps {
  shouldReduceMotion?: boolean | null;
}

export const QuickActions = ({ shouldReduceMotion = false }: QuickActionsProps) => {
  const actions = [
    {
      label: "Report Issue",
      href: "/tickets/new",
      color: "bg-blue-500",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: "View Schedule",
      href: "/schedule",
      color: "bg-purple-500",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Check Inventory",
      href: "/inventory",
      color: "bg-amber-500",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10" />
        </svg>
      ),
    },
    {
      label: "Analytics",
      href: "/analytics",
      color: "bg-emerald-500",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h3v8H7v-8zM14 4h3v16h-3V4zM3 16h3v4H3v-4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className="block">
            <motion.div
              whileHover={!shouldReduceMotion ? { y: -2 } : {}}
              whileTap={!shouldReduceMotion ? { scale: 0.98 } : {}}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 cursor-pointer h-full"
            >
              <div className={`w-12 h-12 rounded-full ${action.color} text-white flex items-center justify-center mb-2`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

