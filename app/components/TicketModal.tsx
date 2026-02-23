"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    assigned_to?: string;
    assigned_technician_phone?: string;
    location?: string;
    asset_id?: string;
  } | null;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  'in-progress': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  closed: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  medium: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

export default function TicketModal({ isOpen, onClose, ticket }: TicketModalProps) {
  if (!ticket) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {ticket.title}
                </Dialog.Title>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[ticket.status] || statusColors.open}`}>
                      {ticket.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[ticket.priority] || priorityColors.medium}`}>
                      {ticket.priority} priority
                    </span>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                    <p className="text-gray-600 dark:text-gray-400">{ticket.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created</h4>
                      <p className="text-gray-600 dark:text-gray-400">{new Date(ticket.created_at).toLocaleString()}</p>
                    </div>
                    
                    {ticket.assigned_to && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned To</h4>
                        <p className="text-gray-600 dark:text-gray-400">{ticket.assigned_to}</p>
                        {ticket.assigned_technician_phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {ticket.assigned_technician_phone}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {ticket.location && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</h4>
                        <p className="text-gray-600 dark:text-gray-400">{ticket.location}</p>
                      </div>
                    )}
                    
                    {ticket.asset_id && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Asset ID</h4>
                        <p className="text-gray-600">{ticket.asset_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
