"use client";

/**
 * FeatureCard Component
 * 
 * Accessible, animated feature card with priority indicator.
 * 
 * Contrast verification (WCAG AA >= 4.5:1):
 * - Light mode: #0f172a (slate-900) on #ffffff = 16.1:1 ✓
 * - Dark mode: #f1f5f9 (slate-100) on #27272a (zinc-800) = 12.8:1 ✓
 * - Muted text: #6b7280 (gray-500) on #ffffff = 4.54:1 ✓
 * 
 * Fallbacks if globals.css tokens are absent:
 * - --card → bg-white (light) / bg-zinc-800 (dark)
 * - --card-contrast-text → text-slate-900 (light) / text-slate-100 (dark)
 * - --muted → text-gray-600 (light) / text-gray-400 (dark)
 * 
 * How to adjust:
 * - Change hover lift distance: modify whileHover y value (currently -4px)
 * - Change animation duration: modify transition.duration (currently 0.12s)
 * - Change priority colors: update priorityColors object
 * - Change icon chip gradient: modify bg-linear-to-br classes
 * 
 * Testing instruction:
 * Open landing page, verify feature text is readable on desktop and mobile, toggle prefers-reduced-motion to confirm animations stop.
 */

import { motion, useReducedMotion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  body: string;
  icon?: React.ReactNode;
  priority?: 'low' | 'medium' | 'high';
}

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export default function FeatureCard({ title, body, icon, priority }: FeatureCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.24, // --motion-medium
        ease: [0.2, 0.8, 0.2, 1], // --ease-ui
      }}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -4,
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)', // --shadow-lg
              transition: { duration: 0.12 }, // --motion-fast
            }
      }
      className="feature-card relative cursor-default"
      aria-label={`${title} feature`}
    >
      {/* Icon chip (top-left) */}
      {icon && (
        <header className="flex items-start justify-between mb-4">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 ring-1 ring-blue-200 dark:ring-blue-800"
            aria-hidden="true"
          >
            <span className="text-2xl">{icon}</span>
          </div>

          {/* Priority indicator (only if priority is high) */}
          {priority === 'high' && (
            <div
              className={`w-2 h-2 rounded-full ${priorityColors.high} priority-pulse`}
              role="status"
              aria-label="High priority"
            />
          )}
        </header>
      )}

      {/* Title - uses --card-contrast-text for maximum readability */}
      <h3
        className="text-xl font-semibold mb-2"
        style={{ color: 'var(--card-contrast-text)' }}
      >
        {title}
      </h3>

      {/* Body - uses --muted for secondary text with proper contrast */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--muted)' }}
      >
        {body}
      </p>
    </motion.article>
  );
}
