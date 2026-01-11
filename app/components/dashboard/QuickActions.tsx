"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface QuickActionsProps {
  shouldReduceMotion?: boolean | null;
}

export const QuickActions = ({ shouldReduceMotion = false }: QuickActionsProps) => {
  const actions = [
    { label: "Report Issue", icon: "📝", href: "/tickets/new", color: "bg-blue-500" },
    { label: "View Schedule", icon: "📅", href: "/schedule", color: "bg-purple-500" },
    { label: "Check Inventory", icon: "📦", href: "/inventory", color: "bg-amber-500" },
    { label: "Analytics", icon: "📊", href: "/analytics", color: "bg-emerald-500" },
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
              <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center text-xl mb-2`}>
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

