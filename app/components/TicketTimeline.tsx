"use client";

import { TimelineEvent } from "@/app/lib/database";

interface TicketTimelineProps {
  timeline: TimelineEvent[];
}

export default function TicketTimeline({ timeline }: TicketTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-sm" style={{ color: "var(--muted)" }}>
        No timeline events yet
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "Ticket Opened",
      assigned: "Assigned to Technician",
      accepted: "Technician Accepted",
      "in-progress": "Work In Progress",
      completed: "Work Completed",
      resolved: "Ticket Resolved",
      closed: "Ticket Closed",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      open: "📝",
      assigned: "👤",
      accepted: "✅",
      "in-progress": "🔧",
      completed: "✓",
      resolved: "🎉",
      closed: "🔒",
    };
    return icons[status] || "•";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "#3b82f6",
      assigned: "#8b5cf6",
      accepted: "#6366f1",
      "in-progress": "#eab308",
      completed: "#14b8a6",
      resolved: "#22c55e",
      closed: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  const formatTimestamp = (timestamp: Date | undefined) => {
    if (!timestamp) return "";
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // Sort timeline by timestamp (newest first)
  const sortedTimeline = [...timeline].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    
    return timeB.getTime() - timeA.getTime();
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--card-contrast-text)" }}>
        Timeline
      </h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5"
          style={{ background: "rgba(15,23,42,0.1)" }}
        />

        {/* Timeline events */}
        <div className="space-y-6">
          {sortedTimeline.map((event, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Status icon */}
              <div
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl z-10"
                style={{
                  background: getStatusColor(event.status),
                  color: "white",
                }}
              >
                {getStatusIcon(event.status)}
              </div>

              {/* Event details */}
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-semibold"
                    style={{ color: getStatusColor(event.status) }}
                  >
                    {getStatusLabel(event.status)}
                  </span>
                </div>
                
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {formatTimestamp(event.timestamp)}
                </div>
                
                {event.userName && (
                  <div className="text-sm mt-1" style={{ color: "var(--card-contrast-text)" }}>
                    by {event.userName}
                  </div>
                )}
                
                {event.note && (
                  <div
                    className="mt-2 text-sm p-3 rounded"
                    style={{
                      background: "rgba(15,23,42,0.05)",
                      color: "var(--card-contrast-text)",
                    }}
                  >
                    {event.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
