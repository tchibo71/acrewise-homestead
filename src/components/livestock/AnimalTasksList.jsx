import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function AnimalTasksList({ animalId, animalName }) {
  const { data: tasks = [] } = useQuery({
    queryKey: ['animal-tasks', animalId],
    queryFn: async () => {
      const all = await base44.entities.ChecklistItem.list('-next_due_date');
      return all.filter(t => t.livestock_id === animalId);
    },
  });

  const activeTasks = tasks.filter(t => !t.completed);
  const overdueTasks = activeTasks.filter(t => {
    if (!t.next_due_date) return false;
    return new Date(t.next_due_date) < new Date();
  });

  const upcomingTasks = activeTasks.filter(t => {
    if (!t.next_due_date) return false;
    const daysUntil = differenceInDays(new Date(t.next_due_date), new Date());
    return daysUntil >= 0 && daysUntil <= (t.alert_days_before || 3);
  });

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p>No specific tasks assigned to {animalName}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Task Schedule - {animalName}</span>
          <div className="flex gap-2">
            {overdueTasks.length > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {overdueTasks.length} Overdue
              </Badge>
            )}
            {upcomingTasks.length > 0 && (
              <Badge className="bg-orange-100 text-orange-800">
                {upcomingTasks.length} Due Soon
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTasks.map(task => {
          const daysUntil = task.next_due_date ? 
            differenceInDays(new Date(task.next_due_date), new Date()) : null;
          const isOverdue = daysUntil !== null && daysUntil < 0;
          const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= (task.alert_days_before || 3);

          return (
            <div key={task.id} className={`p-4 rounded-lg border-l-4 ${
              isOverdue ? 'border-l-red-500 bg-red-50' : 
              isDueSoon ? 'border-l-orange-500 bg-orange-50' : 
              'border-l-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                <Badge variant="outline" className="capitalize">
                  {task.frequency}
                </Badge>
              </div>

              {task.animal_specific_notes && (
                <p className="text-sm text-gray-700 mb-2">{task.animal_specific_notes}</p>
              )}

              {task.next_due_date && (
                <div className="flex items-center gap-2 text-sm">
                  {isOverdue ? (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      OVERDUE by {Math.abs(daysUntil)} days
                    </Badge>
                  ) : isDueSoon ? (
                    <Badge className="bg-orange-100 text-orange-800">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due in {daysUntil} days - {format(new Date(task.next_due_date), 'MMM d')}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      Next: {format(new Date(task.next_due_date), 'MMM d, yyyy')}
                    </Badge>
                  )}
                </div>
              )}

              {task.completed_date && (
                <div className="text-xs text-gray-500 mt-2">
                  Last completed: {format(new Date(task.completed_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}