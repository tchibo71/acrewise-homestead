import React from "react";

const STATS = [
  { key: "total", label: "Total Structures", color: "#1C1917" },
  { key: "overdue", label: "Overdue Tasks", color: "#DC2626" },
  { key: "upcoming", label: "Upcoming (30d)", color: "#D97706" },
  { key: "cost", label: "Est. Pending Cost", color: "#1C1917" },
];

export default function SummaryBand({ totalStructures, overdueCount, upcomingCount, pendingCost }) {
  const values = {
    total: totalStructures,
    overdue: overdueCount,
    upcoming: upcomingCount,
    cost: `$${pendingCost.toLocaleString()}`,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS.map((stat) => (
        <div
          key={stat.key}
          className="bg-bm-card border border-bm-border rounded-lg p-4"
        >
          <p className="text-xs uppercase tracking-wider text-bm-muted font-body">{stat.label}</p>
          <p
            className="font-display font-semibold mt-1 leading-none"
            style={{ fontSize: "1.875rem", color: stat.color }}
          >
            {values[stat.key]}
          </p>
        </div>
      ))}
    </div>
  );
}