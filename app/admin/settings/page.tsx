"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import NavBar from '@/app/components/NavBar';
import RouteGuard from '@/app/components/RouteGuard';

export default function AdminSettingsPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'buildings' | 'tickets' | 'notifications' | 'system'>('buildings');
  
  // Mock State for Settings Forms
  const [buildingSettings, setBuildingSettings] = useState({
    allowAutoJoin: false,
    requireAdminApproval: true,
  });
  
  const [ticketSettings, setTicketSettings] = useState({
    defaultSLAHours: 24,
    requirePhoto: false,
    allowResidentPriority: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklyReports: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugLogging: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSaving(false);
    setSaveMessage('Settings saved successfully!');
    
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };

  return (
    <RouteGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <NavBar />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />
        </div>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  System Settings
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Manage global configuration for the Fix-It-Now platform
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:w-64 shrink-0"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-lg sticky top-24">
                <nav className="space-y-1">
                  {[
                    { id: 'buildings', label: 'Building Management', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                    { id: 'tickets', label: 'Ticket Configuration', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                    { id: 'system', label: 'System Maintenance', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                      </svg>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex-1"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                <div className="p-6 sm:p-8">
                  
                  {/* Building Management Tab */}
                  {activeTab === 'buildings' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white pb-4 border-b border-gray-200 dark:border-gray-800">
                        Building Management
                      </h2>
                      
                      <div className="space-y-4">
                        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={buildingSettings.allowAutoJoin}
                              onChange={(e) => setBuildingSettings({...buildingSettings, allowAutoJoin: e.target.checked})}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Allow Auto-join via Code</span>
                            <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">Users can join buildings automatically if they possess the correct join code.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={buildingSettings.requireAdminApproval}
                              onChange={(e) => setBuildingSettings({...buildingSettings, requireAdminApproval: e.target.checked})}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Require Admin Approval</span>
                            <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">New user registrations require manual approval from a building admin before they can create tickets.</span>
                          </div>
                        </label>
                      </div>

                      <div className="mt-8">
                         <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Building Codes</h3>
                         <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                             <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                 <div>
                                     <p className="font-medium text-gray-900 dark:text-white">Sunrise Apartments</p>
                                     <p className="text-xs text-gray-500">Expires: Never</p>
                                 </div>
                                 <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <code className="text-blue-600 dark:text-blue-400 font-mono text-sm">BLD-SUN-8492</code>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                 </div>
                             </div>
                             <div className="flex justify-between items-center py-2 pt-4">
                                 <div>
                                     <p className="font-medium text-gray-900 dark:text-white">Oceanview Complex</p>
                                     <p className="text-xs text-gray-500">Expires: Never</p>
                                 </div>
                                 <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <code className="text-blue-600 dark:text-blue-400 font-mono text-sm">BLD-OCN-1123</code>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                 </div>
                             </div>
                         </div>
                         <button className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            + Generate New Building Code
                         </button>
                      </div>
                    </div>
                  )}

                  {/* Ticket Configuration Tab */}
                  {activeTab === 'tickets' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white pb-4 border-b border-gray-200 dark:border-gray-800">
                        Ticket Configuration
                      </h2>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Default SLA Response Time (Hours)
                          </label>
                          <input
                            type="number"
                            value={ticketSettings.defaultSLAHours}
                            onChange={(e) => setTicketSettings({...ticketSettings, defaultSLAHours: parseInt(e.target.value) || 0})}
                            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Target time to initial response for standard priority tickets.</p>
                        </div>

                        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={ticketSettings.requirePhoto}
                              onChange={(e) => setTicketSettings({...ticketSettings, requirePhoto: e.target.checked})}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Require Photo Attachment</span>
                            <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">Forces residents to attach at least one photo when creating a maintenance ticket.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={ticketSettings.allowResidentPriority}
                              onChange={(e) => setTicketSettings({...ticketSettings, allowResidentPriority: e.target.checked})}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Allow Residents to Set Priority</span>
                            <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">If disabled, all resident tickets default to &quot;Low&quot; priority and must be triaged by an admin.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white pb-4 border-b border-gray-200 dark:border-gray-800">
                        Global Notifications
                      </h2>
                      
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Email Alerts</span>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">Send system-wide email notifications for new tickets and updates.</span>
                            </div>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" checked={notificationSettings.emailAlerts} onChange={(e) => setNotificationSettings({...notificationSettings, emailAlerts: e.target.checked})} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: notificationSettings.emailAlerts ? '0' : '1.5rem', borderColor: notificationSettings.emailAlerts ? '#2563EB' : '#D1D5DB'}}/>
                                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" style={{ backgroundColor: notificationSettings.emailAlerts ? '#3B82F6' : '#D1D5DB'}}></label>
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">SMS Alerts</span>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">Send SMS notifications for high-priority tickets and emergencies.</span>
                            </div>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" checked={notificationSettings.smsAlerts} onChange={(e) => setNotificationSettings({...notificationSettings, smsAlerts: e.target.checked})} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: notificationSettings.smsAlerts ? '0' : '1.5rem', borderColor: notificationSettings.smsAlerts ? '#2563EB' : '#D1D5DB'}}/>
                                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" style={{ backgroundColor: notificationSettings.smsAlerts ? '#3B82F6' : '#D1D5DB'}}></label>
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div>
                                <span className="block text-sm font-medium text-gray-900 dark:text-white">Weekly Reports</span>
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">Send automated weekly performance reports to admins.</span>
                            </div>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" checked={notificationSettings.weeklyReports} onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked})} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: notificationSettings.weeklyReports ? '0' : '1.5rem', borderColor: notificationSettings.weeklyReports ? '#2563EB' : '#D1D5DB'}}/>
                                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" style={{ backgroundColor: notificationSettings.weeklyReports ? '#3B82F6' : '#D1D5DB'}}></label>
                            </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* System Tab */}
                  {activeTab === 'system' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white pb-4 border-b border-gray-200 dark:border-gray-800">
                        System Maintenance
                      </h2>
                      
                      <div className="space-y-4">
                        <label className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 cursor-pointer transition-colors">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={systemSettings.maintenanceMode}
                              onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                              className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-red-900 dark:text-red-400">Enable Maintenance Mode</span>
                            <span className="block text-sm text-red-700 dark:text-red-300/80 mt-1">Temporarily disables access for non-admin users. Use only during critical updates.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={systemSettings.debugLogging}
                              onChange={(e) => setSystemSettings({...systemSettings, debugLogging: e.target.checked})}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">Enable Debug Logging</span>
                            <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">Writes verbose diagnostic info to the system logs. May impact performance.</span>
                          </div>
                        </label>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Danger Zone</h3>
                            <button className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                Clear Application Cache
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Force reloads of all cached configuration and user session data.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-4">
                    {saveMessage && (
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {saveMessage}
                      </span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-lg min-w-[120px] ${
                        isSaving 
                          ? 'bg-blue-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25'
                      }`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
