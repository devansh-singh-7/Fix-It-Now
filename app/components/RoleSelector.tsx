"use client";

/**
 * RoleSelector Component
 * 
 * Accessible dropdown for selecting user role during signup.
 * Uses Headless UI for keyboard navigation and screen reader support.
 */

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { UserRole } from '../lib/firebaseClient';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  error?: string;
}

const roles: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full system access and management',
  },
  {
    value: 'technician',
    label: 'Technician',
    description: 'Handle and resolve maintenance tickets',
  },
  {
    value: 'resident',
    label: 'Resident',
    description: 'Submit and track maintenance requests',
  },
];

export default function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  const selectedRole = roles.find((r) => r.value === value) || roles[2];

  return (
    <div className="w-full">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </Listbox.Label>
          
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2.5 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            <span className="block truncate font-medium">{selectedRole.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-900 py-1 shadow-lg ring-1 ring-black dark:ring-gray-800 ring-opacity-5 focus:outline-none">
              {roles.map((role) => (
                <Listbox.Option
                  key={role.value}
                  value={role.value}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                      active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <div className="flex flex-col">
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-medium'}`}>
                          {role.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {role.description}
                        </span>
                      </div>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
