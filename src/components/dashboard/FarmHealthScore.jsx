import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, Target, CheckSquare, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { subMonths, isAfter, parseISO } from "date-fns";

const gradeConfig = {
  'A+': { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300', min: 90 },
  'A':  { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300', min: 85 },
  'A-': { color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', min: 80 },
  'B+': { color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300', min: 75 },
  'B':  { color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300', min: 70 },
  'B-': { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', min: 65 },
  'C+': { color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-300', min: 60 },
  'C':  { color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-300', min: 55 },
  'C-': { color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', min: 50 },
  'D':  { color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300', min: 40 },
  'F':  { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300', min: 0 }
};

function getGrade(score) {
  for (const [grade, config] of Object.entries(gradeConfig)) {
    if (score >= config.min) return grade;
  }
  return 'F';
}

export default function FarmHealthScore() {
  const { data: goals = [] } = useQuery({
    queryKey: ['farm-goals-health'],
    queryFn: async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return [];
      return base44.entities.FarmGoal.list();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists-health'],
    queryFn: async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return [];
      return base44.entities.ChecklistItem.list();
    },
    staleTime: 1 * 60 * 1000, // 1 minute stale time for timely updates
    gcTime: 30 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000, // 1 hour background refetch
    refetchOnWindowFocus: false,
  });

  const { data: production = [] } = useQuery({
    queryKey: ['production-health'],
    queryFn: async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return [];
      return base44.entities.Production.list('-production_date', 100);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
  });

  // Calculate Goal Completion Rate
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status !== 'cancelled').length;
  const goalRate = activeGoals > 0 ? (completedGoals / activeGoals) * 100 : 50;

  // Calculate Checklist Completion Rate
  const completedTasks = checklists.filter(c => c.completed).length;
  const totalTasks = checklists.length;
  const taskRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 50;

  // Calculate Production Consistency (based on regularity over last 3 months)
  const threeMonthsAgo = subMonths(new Date(), 3);
  const recentProduction = production.filter(p => {
    if (!p.production_date) return false;
    return isAfter(parseISO(p.production_date), threeMonthsAgo);
  });

  // Count unique weeks with production entries
  const weeksWithProduction = new Set();
  recentProduction.forEach(p => {
    if (p.production_date) {
      const date = parseISO(p.production_date);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      weeksWithProduction.add(weekKey);
    }
  });
  // 13 weeks in 3 months, calculate consistency
  const productionConsistency = Math.min(100, (weeksWithProduction.size / 13) * 100);

  // Weighted average for overall score
  // Goals: 30%, Tasks: 40%, Production: 30%
  const hasGoals = activeGoals > 0;
  const hasTasks = totalTasks > 0;
  const hasProduction = recentProduction.length > 0;

  let overallScore;
  let weights = { goals: 0.3, tasks: 0.4, production: 0.3 };

  // Adjust weights based on what data is available
  if (!hasGoals && !hasProduction) {
    overallScore = taskRate;
  } else if (!hasGoals) {
    overallScore = taskRate * 0.6 + productionConsistency * 0.4;
  } else if (!hasProduction) {
    overallScore = goalRate * 0.4 + taskRate * 0.6;
  } else {
    overallScore = goalRate * weights.goals + taskRate * weights.tasks + productionConsistency * weights.production;
  }

  // Default score for new users
  if (!hasGoals && !hasTasks && !hasProduction) {
    overallScore = 50; // Start at C
  }

  const grade = getGrade(overallScore);
  const gradeStyle = gradeConfig[grade];

  const metrics = [
    {
      label: "Goal Completion",
      value: goalRate,
      icon: Target,
      detail: `${completedGoals}/${activeGoals} goals`,
      hasData: hasGoals
    },
    {
      label: "Task Completion",
      value: taskRate,
      icon: CheckSquare,
      detail: `${completedTasks}/${totalTasks} tasks`,
      hasData: hasTasks
    },
    {
      label: "Production Consistency",
      value: productionConsistency,
      icon: TrendingUp,
      detail: `${weeksWithProduction.size}/13 weeks`,
      hasData: hasProduction
    }
  ];

  return (
    <Card className={`border-2 ${gradeStyle.border} ${gradeStyle.bg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Farm Health Score
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Your Farm Health Score is calculated from goal completion (30%), 
                  task completion (40%), and production consistency (30%).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-20 h-20 rounded-2xl ${gradeStyle.bg} border-2 ${gradeStyle.border} flex items-center justify-center`}>
            <span className={`text-4xl font-bold ${gradeStyle.color}`}>{grade}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Overall Score</span>
              <span className={`text-sm font-semibold ${gradeStyle.color}`}>
                {overallScore.toFixed(0)}%
              </span>
            </div>
            <Progress value={overallScore} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {overallScore >= 80 ? "Excellent farm management!" :
               overallScore >= 60 ? "Good progress, keep improving!" :
               overallScore >= 40 ? "Room for improvement" :
               "Focus on completing tasks and goals"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {metrics.map((metric, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <metric.icon className="w-4 h-4 text-gray-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{metric.label}</span>
                  <span className="text-gray-500">{metric.detail}</span>
                </div>
                <Progress 
                  value={metric.hasData ? metric.value : 0} 
                  className="h-1.5 mt-1" 
                />
              </div>
              <span className={`text-xs font-medium w-10 text-right ${
                metric.value >= 70 ? 'text-green-600' : 
                metric.value >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metric.hasData ? `${metric.value.toFixed(0)}%` : '--'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}