"use client";

import { useState, useEffect } from 'react';
import { preventiveMaintenanceAPI } from '../lib/api';

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  scheduled_date: string;
  frequency: string;
  status: string;
  asset_id?: string;
}

export default function SimpleTimeline() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMaintenanceTasks();
  }, []);

  const fetchMaintenanceTasks = async () => {
    try {
      const response = await preventiveMaintenanceAPI.getAll();
      setTasks(response.data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load maintenance tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Loading maintenance schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    overdue: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preventive Maintenance Timeline</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upcoming scheduled maintenance tasks</p>
      </div>
      
      <div className="p-6">
        {tasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No scheduled maintenance tasks</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-sm">
                    {index + 1}
                  </div>
                  {index < tasks.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-800 mt-2" />
                  )}
                </div>
                
                <div className="flex-1 pb-8">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[task.status] || statusColors.pending}`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>📅 {new Date(task.scheduled_date).toLocaleDateString()}</span>
                      <span>🔄 {task.frequency}</span>
                      {task.asset_id && <span>🔧 Asset: {task.asset_id}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
