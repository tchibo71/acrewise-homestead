import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil } from "lucide-react";
import { format } from "date-fns";

const CONDITION_STYLES = {
  excellent: { bg: "bg-[#16A34A]/10", text: "text-[#16A34A]" },
  good: { bg: "bg-[#2563EB]/10", text: "text-[#2563EB]" },
  fair: { bg: "bg-[#D97706]/10", text: "text-[#D97706]" },
  poor: { bg: "bg-[#DC2626]/10", text: "text-[#DC2626]" },
};

export default function StructureDetailPanel({ structure, tasks, onAddTask, onEditTask, onToggleComplete }) {
  const cond = CONDITION_STYLES[structure.condition] || { bg: "bg-gray-100", text: "text-bm-muted" };

  return (
    <div className="space-y-5">
      {/* Metadata */}
      <div>
        <h2 className="font-display font-semibold text-bm-primary" style={{ fontSize: "1.125rem" }}>
          {structure.type}
        </h2>
        {structure.description && (
          <p className="text-sm text-bm-muted font-body mt-1">{structure.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bm-surface border border-bm-border rounded-lg p-3">
          <p className="text-xs uppercase tracking-wider text-bm-muted font-body">Condition</p>
          <span className={`inline-block text-sm font-body font-medium mt-1 px-2 py-0.5 rounded-full ${cond.bg} ${cond.text}`}>
            {structure.condition || "Unrated"}
          </span>
        </div>
        <div className="bg-bm-surface border border-bm-border rounded-lg p-3">
          <p className="text-xs uppercase tracking-wider text-bm-muted font-body">Year Built</p>
          <p className="font-body font-medium text-bm-primary mt-1">{structure.year_built || "Unknown"}</p>
        </div>
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-bm-primary">Maintenance Tasks</h3>
          <Button
            size="sm"
            onClick={onAddTask}
            className="bg-bm-accent hover:bg-bm-accent/90 text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div className="border-2 border-dashed border-bm-border rounded-lg p-6 text-center">
            <p className="text-sm text-bm-muted font-body">No tasks linked to this structure yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 border border-bm-border rounded-lg bg-bm-card"
              >
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => onToggleComplete(task)}
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditTask(task)}>
                  <p
                    className={`font-body text-sm font-medium text-bm-primary truncate ${
                      task.status === "completed" ? "line-through text-bm-muted" : ""
                    }`}
                  >
                    {task.task_name}
                  </p>
                  <p className="text-xs text-bm-muted font-body">
                    {task.next_due ? `Due ${format(new Date(task.next_due), "MMM d")}` : "No due date"}
                    {task.estimated_cost > 0 && ` · $${task.estimated_cost}`}
                  </p>
                </div>
                <button
                  onClick={() => onEditTask(task)}
                  className="text-bm-muted hover:text-bm-primary p-1 shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}