"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export default function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 ${trend.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="shrink-0 text-gray-400 dark:text-gray-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
