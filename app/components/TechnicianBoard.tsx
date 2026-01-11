"use client";

import { useState, useEffect, useCallback } from 'react';

interface Technician {
  id: string;
  name: string;
  email: string;
  active_tickets?: number;
  completed_tickets?: number;
  total_assigned?: number;
  status?: string;
}

interface TechnicianBoardProps {
  buildingId?: string;
}

export default function TechnicianBoard({ buildingId }: TechnicianBoardProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTechnicians = useCallback(async () => {
    if (!buildingId) {
      setError('No building ID provided');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/technicians/stats?buildingId=${buildingId}`);
      const data = await response.json();

      if (data.success) {
        setTechnicians(data.data);
        setError('');
      } else {
        setError(data.error || 'Failed to load technicians');
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technicians');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    if (buildingId) {
      fetchTechnicians();
    }
  }, [buildingId, fetchTechnicians]);

  // Real-time polling - refresh every 20 seconds
  useEffect(() => {
    if (!buildingId) return;

    const interval = setInterval(() => {
      fetchTechnicians();
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [buildingId, fetchTechnicians]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Loading technicians...</p>
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Technician Board</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track team assignments and availability</p>
      </div>

      <div className="p-6">
        {technicians.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No technicians found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {tech.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{tech.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tech.email}</p>
                    </div>
                  </div>
                  {tech.status && (
                    <span
                      className={`w-3 h-3 rounded-full ${tech.status === 'available' ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                      title={tech.status}
                    />
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Active Tickets</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {tech.active_tickets || 0}
                    </span>
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
