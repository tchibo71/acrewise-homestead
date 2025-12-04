import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
  Crown,
  Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";
import AddMaintenanceModal from "../components/farm-planning/AddMaintenanceModal";
import { format, isPast } from "date-fns";

const frequencyColors = {
  ongoing: "bg-purple-100 text-purple-700",
  perpetual: "bg-indigo-100 text-indigo-700",
  seasonal: "bg-green-100 text-green-700",
  monthly: "bg-blue-100 text-blue-700",
  weekly: "bg-cyan-100 text-cyan-700",
  bi_weekly: "bg-teal-100 text-teal-700",
  bi_monthly: "bg-sky-100 text-sky-700",
  quarterly: "bg-amber-100 text-amber-700",
  bi_annually: "bg-orange-100 text-orange-700",
  annually: "bg-red-100 text-red-700",
  as_needed: "bg-gray-100 text-gray-700"
};

const priorityColors = {
  routine: "bg-gray-100 text-gray-700",
  important: "bg-yellow-100 text-yellow-700",
  urgent: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700"
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700"
};

export default function MaintenancePlanning() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterFrequency, setFilterFrequency] = useState("all");
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: () => base44.entities.MaintenanceTask.list('-next_due'),
    enabled: subscriptionData.isPro
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MaintenanceTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
    },
  });

  const handleAddTask = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingTask(null);
    setShowAddModal(true);
  };

  const handleEdit = (task) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingTask(task);
    setShowAddModal(true);
  };

  const handleDelete = (taskId) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    if (confirm('Are you sure you want to delete this maintenance task?')) {
      deleteMutation.mutate(taskId);
    }
  };

  const filteredTasks = tasks.filter(t => 
    filterFrequency === "all" || t.frequency === filterFrequency
  );

  const overdueTasks = tasks.filter(t => {
    if (!t.next_due) return false;
    return isPast(new Date(t.next_due)) && t.status !== "completed";
  }).length;

  const upcomingTasks = tasks.filter(t => {
    if (!t.next_due) return false;
    const dueDate = new Date(t.next_due);
    const now = new Date();
    const daysDiff = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 30 && t.status !== "completed";
  }).length;

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Maintenance Planning</h1>
              <p className="text-gray-600 mt-1">Track all maintenance tasks by frequency</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Maintenance Planning is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to track ongoing, seasonal, and recurring maintenance organized by frequency with automated reminders
              </p>
              <Button
                size="lg"
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Maintenance Planning"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Maintenance Planning</h1>
              <p className="text-gray-600 mt-1">{upcomingTasks} upcoming, {overdueTasks} overdue</p>
            </div>
          </div>
          <Button onClick={handleAddTask} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming (30 days)</p>
                  <p className="text-2xl font-bold text-blue-700">{upcomingTasks}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-700">{overdueTasks}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-green-700">{tasks.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={filterFrequency} onValueChange={setFilterFrequency}>
          <TabsList className="bg-white flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="perpetual">Perpetual</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="bi_weekly">Bi-Weekly</TabsTrigger>
            <TabsTrigger value="bi_monthly">Bi-Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="bi_annually">Bi-Annually</TabsTrigger>
            <TabsTrigger value="annually">Annually</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tasks List */}
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
              <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No maintenance tasks yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your farm maintenance</p>
              <Button onClick={handleAddTask} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map(task => {
              const isOverdue = task.next_due && isPast(new Date(task.next_due)) && task.status !== "completed";
              
              return (
                <Card key={task.id} className={`border-l-4 ${isOverdue ? 'border-l-red-600' : 'border-l-orange-600'} hover:shadow-lg transition-shadow`}>
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">{task.task_name}</h3>
                          <Badge className={frequencyColors[task.frequency]}>
                            {task.frequency.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                          {task.status && (
                            <Badge className={statusColors[isOverdue ? 'overdue' : task.status]}>
                              {isOverdue ? 'overdue' : task.status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-gray-600 mb-3">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {task.category && (
                            <span className="capitalize">{task.category.replace(/_/g, ' ')}</span>
                          )}
                          {task.next_due && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                Due: {format(new Date(task.next_due), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                          {task.last_completed && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Last: {format(new Date(task.last_completed), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {showAddModal && (
          <AddMaintenanceModal
            task={editingTask}
            onClose={() => {
              setShowAddModal(false);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
}