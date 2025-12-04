import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Plus,
  CheckSquare,
  Crown,
  CheckCircle2,
  AlertTriangle, // New import
  Bell // New import
} from "lucide-react";
import { format, addDays, addWeeks, differenceInDays } from 'date-fns'; // New date-fns imports
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ChecklistForm from "../components/checklists/ChecklistForm";
import ChecklistItem from "../components/checklists/ChecklistItem";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

export default function Checklists() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => base44.entities.ChecklistItem.list('-created_date'),
    staleTime: 1 * 60 * 1000, // 1 minute stale time for timely task updates
    gcTime: 30 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000, // 1 hour background refetch
    refetchOnWindowFocus: true, // Refetch when user returns to check tasks
  });

  // New query to fetch livestock data
  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChecklistItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.ChecklistItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const toggleComplete = (task) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }

    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    let nextDueDate = task.next_due_date; // Default to existing next_due_date
    let updatedCompletionHistory = [...(task.completion_history || [])];

    // Logic for when a task is marked as completed
    if (!task.completed) {
      // Add to completion history
      updatedCompletionHistory.push({
        completed_on: today,
        notes: `Completed on ${format(now, 'MMMM d, yyyy')}`
      });

      // Calculate next due date for recurring tasks
      if (task.frequency !== 'one_time') {
        // Use the task's next_due_date as the base if available, otherwise 'now'
        const currentDue = task.next_due_date ? new Date(task.next_due_date) : now;
        
        switch(task.frequency) {
          case 'daily':
            nextDueDate = format(addDays(currentDue, 1), 'yyyy-MM-dd');
            break;
          case 'weekly':
            nextDueDate = format(addWeeks(currentDue, 1), 'yyyy-MM-dd');
            break;
          case 'monthly':
            nextDueDate = format(addDays(currentDue, 30), 'yyyy-MM-dd'); // Approximating a month as 30 days
            break;
          case 'seasonal':
            nextDueDate = format(addDays(currentDue, 90), 'yyyy-MM-dd'); // Approximating a season as 90 days
            break;
          case 'custom':
            const totalDays = (task.custom_interval_weeks || 0) * 7 + (task.custom_interval_days || 0);
            nextDueDate = format(addDays(currentDue, totalDays), 'yyyy-MM-dd');
            break;
          default:
            nextDueDate = null; // Should not happen for recurring frequencies
            break;
        }
      } else {
        nextDueDate = null; // One-time tasks have no next due date after completion
      }
    } else {
      // Logic for when a task is marked as incomplete (uncompletion)
      // For now, we retain the next_due_date as it was, and the completion_history is not altered.
      // If a task is uncompleted, its completed_date should be nullified.
      // The history could optionally be reverted, but the outline does not specify.
    }

    updateTaskMutation.mutate({
      id: task.id,
      data: {
        ...task,
        completed: !task.completed,
        completed_date: !task.completed ? today : null, // Set to today if completing, else null
        last_completed_date: !task.completed ? task.completed_date : null, // Record previous completed_date when marking complete
        next_due_date: !task.completed ? nextDueDate : task.next_due_date, // Update next_due_date only if marking complete
        completion_history: updatedCompletionHistory
      }
    });
  };

  const handleDelete = (taskId) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleAddTask = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingTask(task);
    setShowForm(true);
  };

  // Helper to get animal name
  const getAnimalName = (livestockId) => {
    if (!livestockId) return null;
    const animal = livestock.find(a => a.id === livestockId);
    return animal?.name_or_tag;
  };

  const todayForComparison = new Date(format(new Date(), 'yyyy-MM-dd')); // Normalize today to start of day

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    
    if (activeFilter === "overdue") {
      // Overdue tasks are not completed, have a next_due_date, and that date is before today
      if (task.completed || !task.next_due_date) return false;
      return new Date(task.next_due_date) < todayForComparison;
    }
    if (activeFilter === "upcoming") {
      // Upcoming tasks are not completed, have a next_due_date, and fall within the alert window
      if (task.completed || !task.next_due_date) return false;
      const dueDate = new Date(task.next_due_date);
      const daysUntil = differenceInDays(dueDate, todayForComparison);
      // alert_days_before or default to 3 days
      return daysUntil >= 0 && daysUntil <= (task.alert_days_before || 3);
    }
    
    // Remaining filter for frequency types, if still desired or if the form allows it.
    // The new tabs remove frequency filtering from the top-level, but keeping this
    // for future flexibility or if filtering by frequency is implemented elsewhere.
    return task.frequency === activeFilter;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.filter(t => !t.completed).length;
  
  const overdueCount = tasks.filter(t => 
    !t.completed && t.next_due_date && new Date(t.next_due_date) < todayForComparison
  ).length;

  const upcomingCount = tasks.filter(t => {
    if (!t.completed && t.next_due_date) {
      const dueDate = new Date(t.next_due_date);
      const daysUntil = differenceInDays(dueDate, todayForComparison);
      return daysUntil >= 0 && daysUntil <= (t.alert_days_before || 3);
    }
    return false;
  }).length;

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Checklists</h1>
              <p className="text-gray-600 mt-1">Track your homesteading tasks</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Checklist Management is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Upgrade to create unlimited checklists, track your progress, set reminders, and never miss an important homesteading task
              </p>

              <div className="max-w-md mx-auto mb-8 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">With Pro, you can:</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Create unlimited custom checklists</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Set priorities and due dates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Track completion and progress</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Organize by category and frequency</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Never forget seasonal tasks</span>
                  </li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro - Starting at $2.99/mo
              </Button>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Checklist management"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Checklists</h1>
              <p className="text-gray-600 mt-1">{activeCount} active tasks, {completedCount} completed</p>
            </div>
          </div>
          <Button 
            onClick={handleAddTask}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Alert Summary */}
        {(overdueCount > 0 || upcomingCount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overdueCount > 0 && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">{overdueCount} Overdue Tasks</p>
                      <p className="text-sm text-red-700">Requires immediate attention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {upcomingCount > 0 && (
              <Card className="border-orange-300 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-900">{upcomingCount} Due Soon</p>
                      <p className="text-sm text-orange-700">Tasks coming up within alert window</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="bg-white">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueCount})</TabsTrigger>
            <TabsTrigger value="upcoming">Due Soon ({upcomingCount})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {showForm && (
          <ChecklistForm
            task={editingTask}
            onClose={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first homesteading task</p>
              <Button onClick={handleAddTask} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <ChecklistItem
                key={task.id}
                task={task}
                animalName={getAnimalName(task.livestock_id)} // Pass animal name
                onToggle={toggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}