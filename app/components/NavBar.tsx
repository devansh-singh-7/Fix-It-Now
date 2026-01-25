"use client";

import { Fragment, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Transition } from '@headlessui/react';
import { User } from 'firebase/auth';
import JoinBuildingBanner from './JoinBuildingBanner';

type UserRole = 'admin' | 'technician' | 'resident';

interface NavLink {
  name: string;
  href: string;
  roles: UserRole[];
  icon?: React.ReactNode;
}

const NAV_LINKS: NavLink[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    roles: ['admin', 'technician', 'resident'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    name: 'Tickets',
    href: '/tickets',
    roles: ['admin', 'technician', 'resident'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    name: 'Analytics',
    href: '/analytics',
    roles: ['admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    name: 'Technicians',
    href: '/technicians',
    roles: ['admin', 'technician'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    name: 'Buildings',
    href: '/buildings',
    roles: ['admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    name: 'Reports',
    href: '/reports',
    roles: ['admin'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    name: 'Predictions',
    href: '/predictions',
    roles: ['admin', 'technician', 'resident'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('resident');
  const [hasBuilding, setHasBuilding] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Ticket #1234 resolved', message: 'Your AC repair has been completed', time: '5m ago', read: false, type: 'success' },
    { id: 2, title: 'New reply on Ticket #1235', message: 'Technician has added a comment', time: '1h ago', read: false, type: 'info' },
    { id: 3, title: 'Maintenance scheduled', message: 'Preventive maintenance on Dec 5', time: '2h ago', read: true, type: 'info' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Function to read and apply profile from localStorage
    const readProfileFromStorage = () => {
      if (typeof window !== 'undefined') {
        const authToken = localStorage.getItem('authToken');
        const userProfile = localStorage.getItem('userProfile');
        
        if (authToken && userProfile) {
          try {
            const profile = JSON.parse(userProfile);
            // Create a minimal user-like object for display purposes
            // This will be replaced by real Firebase user when auth state fires
            setUser({
              displayName: profile.displayName || profile.name,
              email: profile.email,
              uid: profile.firebaseUid || profile.uid,
            } as unknown as User);
            setUserRole(profile.role || 'resident');
            
            // Check building status - buildingId can be string or object
            const extractedBuildingId = typeof profile.buildingId === 'object'
              ? profile.buildingId?.buildingId || profile.buildingId
              : profile.buildingId;
            
            if (profile.role !== 'admin' && !extractedBuildingId) {
              setHasBuilding(false);
            } else {
              setHasBuilding(true);
            }
          } catch (error) {
            console.error('Error parsing stored user profile:', error);
          }
        }
      }
    };

    // Initial read
    readProfileFromStorage();

    // Listen for storage changes (when localStorage is updated in same or another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        console.log('NavBar: userProfile updated in localStorage - re-reading');
        readProfileFromStorage();
      }
    };

    // Listen for custom event when profile is updated in the same tab
    const handleProfileUpdate = () => {
      console.log('NavBar: profile update event received');
      readProfileFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    // Only import and use Firebase auth on client side
    if (typeof window !== 'undefined') {
      import('../lib/firebase-app').then(({ auth }) => {
        if (auth) {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);

            // Get user role from localStorage
            if (user) {
              try {
                const userProfile = localStorage.getItem('userProfile');
                if (userProfile) {
                  const profile = JSON.parse(userProfile);
                  setUserRole(profile.role || 'resident');

                  // Check if user has a building assigned (except for admins who might not need one initially)
                  // Handle buildingId being either a string or object
                  const extractedBuildingId = typeof profile.buildingId === 'object'
                    ? profile.buildingId?.buildingId || profile.buildingId
                    : profile.buildingId;
                  
                  if (profile.role !== 'admin' && !extractedBuildingId) {
                    setHasBuilding(false);
                  } else {
                    setHasBuilding(true);
                  }

                  // Check if user is super admin
                  if (profile.role === 'admin') {
                    fetch(`/api/admin/is-super?uid=${user.uid}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.success && data.data.isSuperAdmin) {
                          setIsSuperAdmin(true);
                        }
                      })
                      .catch(err => console.error('Error checking super admin:', err));
                  }
                }
              } catch (error) {
                console.error('Error parsing user profile:', error);
              }
            }
          });
          return () => unsubscribe();
        }
      });
    }
  }, []);

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { signOutUser } = await import('../lib/auth-actions');
        const { clearAuthToken } = await import('../lib/authHelpers');

        await signOutUser();
        clearAuthToken();
        router.push('/');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleJoinSuccess = () => {
    setHasBuilding(true);
    router.refresh();
  };

  // Filter nav links based on user role
  const visibleLinks = NAV_LINKS.filter(link => link.roles.includes(userRole));

  return (
    <>
      {/* Join Building Banner */}
      {mounted && user && !hasBuilding && (
        <JoinBuildingBanner onJoinSuccess={handleJoinSuccess} />
      )}

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-800'
        : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link
                href={user ? '/dashboard' : '/'}
                className="flex items-center gap-2 group"
              >
                <div className="relative w-9 h-9">
                  <Image
                    src="/fixitnow-icon.png"
                    alt="FixItNow Logo"
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    FixItNow
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Maintenance Pro</p>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              {user && (
                <nav className="hidden lg:flex items-center gap-0.5">
                  {visibleLinks.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 group ${isActive
                          ? 'bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        <span className={`transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                          {link.icon}
                        </span>
                        {link.name}

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-full" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Right side - User Menu */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  {/* Desktop User Info */}
                  <div className="hidden md:block text-right mr-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-purple-500' :
                        userRole === 'technician' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                      {userRole}
                    </p>
                  </div>

                  {/* Notifications */}
                  <div className="relative notifications-container">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Notifications"
                    >
                      <svg
                        className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>

                      {/* Unread badge */}
                      {unreadCount > 0 && (
                        <>
                          <span className="animate-ping absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full opacity-75" />
                          <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-3 h-3 text-[10px] font-bold text-white bg-red-600 rounded-full">
                            {unreadCount}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    <Transition
                      show={showNotifications}
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-150"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden z-50">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {unreadCount} unread
                              </p>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You&apos;re all caught up!</p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                onClick={() => markAsRead(notification.id)}
                                className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Status indicator */}
                                  <div className={`shrink-0 mt-1 w-2 h-2 rounded-full ${!notification.read
                                    ? 'bg-blue-600'
                                    : 'bg-gray-300 dark:bg-gray-700'
                                    }`} />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-medium ${!notification.read
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {notification.title}
                                      </p>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
                                        {notification.time}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {notification.message}
                                    </p>
                                    <div className="mt-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${notification.type === 'success'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                        }`}>
                                        {notification.type === 'success' ? 'Resolved' : 'Update'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-center">
                          <button
                            onClick={() => {
                              setShowNotifications(false);
                              router.push('/notifications');
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            View all notifications →
                          </button>
                        </div>
                      </div>
                    </Transition>
                  </div>

                  {/* Settings */}
                  <Link
                    href="/settings"
                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Settings"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </Link>

                  {/* User Menu */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-white font-medium text-sm">
                        {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Menu.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-150"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-900 rounded-xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden z-50">
                        {/* User info */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.displayName || user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize flex items-center gap-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-purple-500' :
                              userRole === 'technician' ? 'bg-blue-500' :
                                'bg-green-500'
                              }`} />
                            {userRole}
                          </p>
                        </div>

                        <div className="py-1">
                          {/* Mobile navigation links */}
                          <div className="lg:hidden border-b border-gray-200 dark:border-gray-800 pb-1 mb-1">
                            {visibleLinks.map((link) => (
                              <Menu.Item key={link.href}>
                                {({ active }) => (
                                  <Link
                                    href={link.href}
                                    className={`${active ? 'bg-gray-100 dark:bg-gray-800' : ''
                                      } flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300`}
                                  >
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {link.icon}
                                    </span>
                                    {link.name}
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                          </div>

                          {/* Menu items */}
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/profile"
                                className={`${active ? 'bg-gray-100 dark:bg-gray-800' : ''
                                  } flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300`}
                              >
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile
                              </Link>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/help"
                                className={`${active ? 'bg-gray-100 dark:bg-gray-800' : ''
                                  } flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300`}
                              >
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Help & Support
                              </Link>
                            )}
                          </Menu.Item>

                          {/* Predictions - Admin Only (not in main nav to reduce crowding) */}
                          {userRole === 'admin' && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href="/predictions"
                                  className={`${active ? 'bg-gray-100 dark:bg-gray-800' : ''
                                    } flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300`}
                                >
                                  <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  Predictions
                                </Link>
                              )}
                            </Menu.Item>
                          )}

                          {/* Manage Admins - Super Admin Only */}
                          {isSuperAdmin && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href="/admin/manage"
                                  className={`${active ? 'bg-gray-100 dark:bg-gray-800' : ''
                                    } flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-800`}
                                >
                                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  <span className="font-medium">Manage Admins</span>
                                </Link>
                              )}
                            </Menu.Item>
                          )}

                          {/* Sign out */}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${active ? 'bg-gray-100 dark:bg-gray-800' : ''
                                  } flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-800`}
                                onClick={handleSignOut}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </>
              ) : (
                // Login button for non-authenticated users
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/signin"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}