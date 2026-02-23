"use client";

export const RecentActivity = () => {
  const activities = [
    { user: "John Smith", action: "resolved ticket", target: "#1234", time: "5m ago" },
    { user: "Jane Doe", action: "assigned to", target: "#1235", time: "1h ago" },
    { user: "Mike Johnson", action: "commented on", target: "#1236", time: "2h ago" },
    { user: "Sarah Wilson", action: "created ticket", target: "#1237", time: "3h ago" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.time} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {activity.user.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                <span className="font-medium">{activity.user}</span> {activity.action}{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
