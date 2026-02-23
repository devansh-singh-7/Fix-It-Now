"use client";

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    assigned_to?: string;
  };
  onClick: () => void;
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

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{ticket.title}</h3>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status] || statusColors.open}`}>
          {ticket.status}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{ticket.description}</p>
      
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority] || priorityColors.medium}`}>
          {ticket.priority}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(ticket.created_at).toLocaleDateString()}
        </span>
      </div>
      
      {ticket.assigned_to && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Assigned to: <span className="font-medium text-gray-700 dark:text-gray-300">{ticket.assigned_to}</span>
          </p>
        </div>
      )}
    </div>
  );
}
