import React from "react";
import { format, isPast } from "date-fns";

const PRIORITY_COLORS = {
  critical: "#DC2626",
  urgent: "#D97706",
  important: "#EAB308",
  routine: "#78716C",
};

const STATUS_STYLES = {
  pending: "bg-[#D97706]/10 text-[#D97706]",
  in_progress: "bg-[#2563EB]/10 text-[#2563EB]",
  completed: "bg-[#16A34A]/10 text-[#16A34A]",
  overdue: "bg-[#DC2626]/10 text-[#DC2626]",
};

export default function TimelineView({ tasks, structures, onEditTask }) {
  const getStructureName = (id) => {
    const s = structures.find((s) => s.syntheticId === id);
    return s ? s.type : "Unassigned";
  };

  const sorted = [...tasks].sort((a, b) => {
    if (!a.next_due) return 1;
    if (!b.next_due) return -1;
    return new Date(a.next_due) - new Date(b.next_due);
  });

  if (sorted.length === 0) {
    return (
      <div className="border-2 border-dashed border-bm-border rounded-lg p-12 text-center">
        <p className="text-bm-muted font-body">
          No building maintenance tasks yet. Click "Add Task" to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((task) => {
        const overdue =
          task.next_due && isPast(new Date(task.next_due)) && task.status !== "completed";
        const dueDate = task.next_due ? new Date(task.next_due) : null;
        const now = new Date();
        const daysDiff = dueDate ? Math.floor((dueDate - now) / (1000 * 60 * 60 * 24)) : null;
        const upcoming =
          daysDiff !== null && daysDiff >= 0 && daysDiff <= 30 && task.status !== "completed";
        const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.routine;

        return (
          <div
            key={task.id}
            className="flex items-stretch bg-bm-card border border-bm-border rounded-lg overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => onEditTask(task)}
          >
            <div className="w-1 shrink-0" style={{ backgroundColor: priorityColor }} />
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium text-bm-primary truncate">{task.task_name}</p>
                  <p className="text-sm text-bm-muted font-body truncate">
                    {getStructureName(task.related_infrastructure_id)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-sm font-body font-medium"
                    style={{
                      color: overdue ? "#DC2626" : upcoming ? "#D97706" : "#78716C",
                    }}
                  >
                    {task.next_due ? format(dueDate, "MMM d, yyyy") : "No due date"}
                  </p>
                  {task.estimated_cost > 0 && (
                    <p className="text-sm text-bm-muted font-body">${task.estimated_cost}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-body font-medium ${
                    STATUS_STYLES[task.status] || STATUS_STYLES.pending
                  }`}
                >
                  {task.status?.replace("_", " ")}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium bg-bm-surface text-bm-muted">
                  {task.priority}
                </span>
                {task.frequency && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-body bg-bm-surface text-bm-muted">
                    {task.frequency.replace("_", " ")}
                  </span>
                )}
                {overdue && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium bg-[#DC2626]/10 text-[#DC2626] uppercase tracking-wider">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}