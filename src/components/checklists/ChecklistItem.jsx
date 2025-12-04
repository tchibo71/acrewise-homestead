import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const priorityColors = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200"
};

const categoryColors = {
  composting: "bg-amber-100 text-amber-700",
  gardening: "bg-green-100 text-green-700",
  raised_beds: "bg-emerald-100 text-emerald-700",
  biointensive: "bg-lime-100 text-lime-700",
  harvesting: "bg-orange-100 text-orange-700",
  livestock: "bg-blue-100 text-blue-700",
  water_management: "bg-cyan-100 text-cyan-700",
  greenhouse: "bg-teal-100 text-teal-700",
  property_engineering: "bg-purple-100 text-purple-700",
  daily_tasks: "bg-gray-100 text-gray-700",
  seasonal_tasks: "bg-pink-100 text-pink-700"
};

export default function ChecklistItem({ task, onToggle, onEdit, onDelete, animalName }) {
  const getDaysUntilDue = () => {
    if (!task.next_due_date) return null;
    return differenceInDays(new Date(task.next_due_date), new Date());
  };

  const daysUntil = getDaysUntilDue();
  const isOverdue = daysUntil !== null && daysUntil < 0;
  const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= (task.alert_days_before || 3);

  const getFrequencyDisplay = () => {
    if (task.frequency === 'custom' && (task.custom_interval_weeks || task.custom_interval_days)) {
      const parts = [];
      if (task.custom_interval_weeks) parts.push(`${task.custom_interval_weeks} week${task.custom_interval_weeks !== 1 ? 's' : ''}`);
      if (task.custom_interval_days) parts.push(`${task.custom_interval_days} day${task.custom_interval_days !== 1 ? 's' : ''}`);
      return `Every ${parts.join(' + ')}`;
    }
    return task.frequency.replace(/_/g, ' ');
  };

  return (
    <Card className={`border-l-4 ${
      isOverdue ? 'border-l-red-500 bg-red-50/50' : 
      isDueSoon ? 'border-l-orange-500 bg-orange-50/50' : 
      task.completed ? 'border-l-green-500 bg-green-50/50' : 
      'border-l-gray-300 bg-white'
    } hover:shadow-md transition-all duration-200`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggle(task)}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
                {animalName && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    ({animalName})
                  </span>
                )}
              </h3>
              
              {task.enable_reminders && !task.completed && (
                <Bell className={`w-4 h-4 ${isDueSoon || isOverdue ? 'text-orange-600' : 'text-gray-400'}`} />
              )}
            </div>
            
            {task.notes && (
              <p className="text-sm text-gray-600 mt-1 mb-2">{task.notes}</p>
            )}

            {task.animal_specific_notes && animalName && (
              <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2 mt-2 mb-2">
                <span className="font-semibold text-blue-900">Animal Notes:</span> {task.animal_specific_notes}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={categoryColors[task.category]}>
                {task.category.replace(/_/g, ' ')}
              </Badge>
              <Badge variant="outline" className="text-gray-600">
                {getFrequencyDisplay()}
              </Badge>
              {task.season && task.season !== 'year_round' && (
                <Badge variant="outline" className="capitalize text-gray-600">
                  {task.season}
                </Badge>
              )}
            </div>

            {/* Due Date Information */}
            <div className="mt-3 space-y-2">
              {task.next_due_date && !task.completed && (
                <div className="flex items-center gap-2">
                  {isOverdue ? (
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      OVERDUE by {Math.abs(daysUntil)} days - Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                    </Badge>
                  ) : isDueSoon ? (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                      <Calendar className="w-3 h-3 mr-1" />
                      DUE SOON - {daysUntil} days - {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      Next Due: {format(new Date(task.next_due_date), 'MMM d, yyyy')} ({daysUntil} days)
                    </Badge>
                  )}
                </div>
              )}

              {task.completed_date && (
                <Badge variant="outline" className="text-green-700 bg-green-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Last Completed: {format(new Date(task.completed_date), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
            >
              <Pencil className="w-4 h-4 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}