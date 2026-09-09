import React from "react";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const CONDITION_STYLES = {
  excellent: { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
  good: { bg: "bg-[#2563EB]/10", text: "text-[#2563EB]" },
  fair: { bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
  poor: { bg: "bg-[#DC2626]/10", text: "text-[#DC2626]" },
};

export default function StructureCard({ structure, taskCount, overdueCount, nextDueDate, onClick }) {
  const cond = CONDITION_STYLES[structure.condition] || { bg: "bg-gray-100", text: "text-bm-muted" };

  return (
    <div
      onClick={onClick}
      className="bg-bm-card border border-bm-border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
    >
      {overdueCount > 0 && (
        <div className="absolute top-0 right-0 bg-[#DC2626] text-white text-[0.625rem] uppercase tracking-wider font-body font-medium px-2 py-1 rounded-bl-lg flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {overdueCount} Overdue
        </div>
      )}

      <div className="mb-2 pr-16">
        <h3 className="font-display font-semibold text-bm-primary leading-tight" style={{ fontSize: "1.125rem" }}>
          {structure.type}
        </h3>
      </div>

      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-body font-medium ${cond.bg} ${cond.text} mb-3`}>
        {structure.condition || "unrated"}
      </span>

      {structure.description && (
        <p className="text-sm text-bm-muted font-body mb-3 line-clamp-2">{structure.description}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-bm-border">
        <span className="text-sm text-bm-muted font-body">
          {taskCount} task{taskCount !== 1 ? "s" : ""}
        </span>
        {structure.year_built && (
          <span className="text-sm text-bm-muted font-body">Built {structure.year_built}</span>
        )}
      </div>

      {nextDueDate && (
        <div className="mt-2 text-sm font-body text-bm-primary">
          Next due: {format(new Date(nextDueDate), "MMM d")}
        </div>
      )}
    </div>
  );
}