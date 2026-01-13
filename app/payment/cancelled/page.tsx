'use client';

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center"
        >
          <XCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-3"
        >
          Payment Cancelled
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 dark:text-gray-400 mb-8"
        >
          No worries! Your payment was cancelled and you haven't been charged. You can try again whenever you're ready.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Link
            href="/#pricing"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
        </motion.div>

        {/* Help text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Having trouble?</strong> If you experienced any issues during checkout, please contact our support team for assistance.
          </p>
        </motion.div>

        {/* Support link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-gray-500 dark:text-gray-500 mt-4"
        >
          Email us at{' '}
          <a href="mailto:support@fixitnow.com" className="text-blue-600 hover:underline">
            support@fixitnow.com
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
