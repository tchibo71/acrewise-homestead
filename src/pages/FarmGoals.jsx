import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import AddGoalModal from "../components/farm-planning/AddGoalModal";
import EditGoalModal from "../components/farm-planning/EditGoalModal";
import { checkSubscription } from "../components/utils/subscriptionUtils";

export default function FarmGoals() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['farm-goals'],
    queryFn: () => base44.entities.FarmGoal.list('-created_date'),
    enabled: subscriptionData.isPro
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FarmGoal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-goals'] });
    },
  });

  const filteredGoals = filterStatus === "all" 
    ? goals 
    : goals.filter(g => g.status === filterStatus);

  const statusColors = {
    not_started: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    on_hold: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const priorityColors = {
    low: "border-gray-300",
    medium: "border-blue-300",
    high: "border-orange-300",
    critical: "border-red-300"
  };

  const completedGoals = goals.filter(g => g.status === "completed").length;
  const inProgressGoals = goals.filter(g => g.status === "in_progress").length;
  const totalInvestment = goals.reduce((sum, g) => sum + (g.actual_cost || g.estimated_cost || 0), 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Farm Goals</h1>
              <p className="text-gray-600 mt-1">Track and manage your homestead objectives</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Goals</p>
                  <p className="text-3xl font-bold text-green-700">{completedGoals}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-blue-700">{inProgressGoals}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Investment</p>
                  <p className="text-3xl font-bold text-purple-700">${totalInvestment.toFixed(0)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            All Goals
          </Button>
          <Button
            variant={filterStatus === "in_progress" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("in_progress")}
          >
            In Progress
          </Button>
          <Button
            variant={filterStatus === "not_started" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("not_started")}
          >
            Not Started
          </Button>
          <Button
            variant={filterStatus === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("completed")}
          >
            Completed
          </Button>
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-600">Loading goals...</p>
          </div>
        ) : filteredGoals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your farm objectives</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredGoals.map((goal) => (
              <Card key={goal.id} className={`border-l-4 ${priorityColors[goal.priority]}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{goal.goal_title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={statusColors[goal.status]}>
                          {goal.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {goal.goal_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={
                          goal.priority === 'critical' ? 'border-red-500 text-red-700' :
                          goal.priority === 'high' ? 'border-orange-500 text-orange-700' :
                          goal.priority === 'medium' ? 'border-blue-500 text-blue-700' :
                          'border-gray-500 text-gray-700'
                        }>
                          {goal.priority} priority
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingGoal(goal)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this goal?')) {
                            deleteMutation.mutate(goal.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {goal.description && (
                    <p className="text-gray-600 text-sm">{goal.description}</p>
                  )}

                  {goal.measurable_target && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Target:</p>
                      <p className="font-semibold text-gray-900">{goal.measurable_target}</p>
                    </div>
                  )}

                  {goal.current_progress !== null && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-gray-900">{goal.current_progress}%</span>
                      </div>
                      <Progress value={goal.current_progress} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {goal.target_date && (
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target Date</span>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(goal.target_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}

                    {(goal.estimated_cost || goal.actual_cost) && (
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span>Cost</span>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(goal.actual_cost || goal.estimated_cost).toFixed(0)}
                        </p>
                        {goal.estimated_cost && goal.actual_cost && goal.actual_cost !== goal.estimated_cost && (
                          <p className="text-xs text-gray-500">Est: ${goal.estimated_cost.toFixed(0)}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {goal.completed_date && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Completed on {format(new Date(goal.completed_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}

                  {goal.notes && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{goal.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddGoalModal onClose={() => setShowAddModal(false)} />
        )}

        {editingGoal && (
          <EditGoalModal
            goal={editingGoal}
            onClose={() => setEditingGoal(null)}
          />
        )}
      </div>
    </div>
  );
}