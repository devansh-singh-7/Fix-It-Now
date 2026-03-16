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
    const iconClassName = "w-5 h-5";

    switch (status) {
      case "open":
        return (
          <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case "assigned":
        return (
          <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A10.97 10.97 0 0112 15c2.503 0 4.81.835 6.879 2.243M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "accepted":
      case "completed":
      case "resolved":
        return (
          <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "in-progress":
        return (
          <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l1.72.74a1 1 0 00.767 0l1.72-.74a1 1 0 011.35.936l.16 1.865a1 1 0 00.4.714l1.46 1.097a1 1 0 01.169 1.48l-1.2 1.435a1 1 0 00-.228.734l.173 1.818a1 1 0 01-1.214 1.06l-1.842-.408a1 1 0 00-.77.164l-1.477 1.057a1 1 0 01-1.161 0l-1.478-1.057a1 1 0 00-.769-.164l-1.842.408a1 1 0 01-1.214-1.06l.173-1.818a1 1 0 00-.229-.734l-1.199-1.435a1 1 0 01.168-1.48l1.46-1.097a1 1 0 00.4-.714l.16-1.865z" />
          </svg>
        );
      case "closed":
        return (
          <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3zm-7 9a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2H5z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClassName} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
          </svg>
        );
    }
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
    <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: "rgba(148,163,184,0.25)", background: "rgba(255,255,255,0.55)" }}>
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
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center z-10"
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
                    className="mt-2 text-sm p-3 rounded-lg border"
                    style={{
                      background: "rgba(148,163,184,0.12)",
                      borderColor: "rgba(148,163,184,0.28)",
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
