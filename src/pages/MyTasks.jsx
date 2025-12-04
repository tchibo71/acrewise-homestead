import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  CheckSquare,
  Crown,
  AlertTriangle,
  Bell,
  User
} from "lucide-react";
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ChecklistItem from "../components/checklists/ChecklistItem";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

export default function MyTasks() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch tasks assigned to the current user
  const { data: myTasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return base44.entities.ChecklistItem.filter(
        { assigned_to_email: currentUser.email },
        '-created_date'
      );
    },
    enabled: !!currentUser?.email && subscriptionData.isPro,
    staleTime: 1 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChecklistItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const toggleComplete = (task) => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    updateTaskMutation.mutate({
      id: task.id,
      data: {
        ...task,
        completed: !task.completed,
        completed_date: !task.completed ? today : null,
      }
    });
  };

  const todayForComparison = new Date(format(new Date(), 'yyyy-MM-dd'));

  const filteredTasks = myTasks.filter(task => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    if (activeFilter === "overdue") {
      if (task.completed || !task.next_due_date) return false;
      return new Date(task.next_due_date) < todayForComparison;
    }
    if (activeFilter === "upcoming") {
      if (task.completed || !task.next_due_date) return false;
      const dueDate = new Date(task.next_due_date);
      const daysUntil = differenceInDays(dueDate, todayForComparison);
      return daysUntil >= 0 && daysUntil <= (task.alert_days_before || 3);
    }
    return true;
  });

  const completedCount = myTasks.filter(t => t.completed).length;
  const activeCount = myTasks.filter(t => !t.completed).length;
  
  const overdueCount = myTasks.filter(t => 
    !t.completed && t.next_due_date && new Date(t.next_due_date) < todayForComparison
  ).length;

  const upcomingCount = myTasks.filter(t => {
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
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600 mt-1">Tasks assigned to you</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                My Tasks is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Upgrade to Pro or Farm Team to see tasks assigned specifically to you
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
            feature="My Tasks view"
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
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600 mt-1">
                {activeCount} assigned to you, {completedCount} completed
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
            <User className="w-3 h-3 mr-1" />
            {currentUser?.full_name || currentUser?.email}
          </Badge>
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
            <TabsTrigger value="all">All ({myTasks.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueCount})</TabsTrigger>
            <TabsTrigger value="upcoming">Due Soon ({upcomingCount})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>
        </Tabs>

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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks assigned to you</h3>
              <p className="text-gray-500">
                {myTasks.length === 0 
                  ? "When a team owner assigns tasks to you, they'll appear here"
                  : "No tasks match this filter"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => (
              <ChecklistItem
                key={task.id}
                task={task}
                onToggle={toggleComplete}
                onEdit={() => {}}
                onDelete={() => {}}
                hideActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}