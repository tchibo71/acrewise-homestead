import React, { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Stethoscope, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function RecentActivity() {
  // Fetch recent activity from multiple sources with aggressive caching and limits
  const { data: recentActivity = [], isLoading } = useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return [];

      // Fetch top 10 from each source in parallel
      const [production, vetVisits, transactions] = await Promise.all([
        base44.entities.Production.list('-created_date', 10).catch(() => []),
        base44.entities.VetVisit.list('-created_date', 10).catch(() => []),
        base44.entities.FinancialTransaction.list('-created_date', 10).catch(() => [])
      ]);

      // Combine and sort by date, take top 10 overall
      const combined = [
        ...production.map(p => ({ 
          ...p, 
          type: 'production', 
          title: `${p.quantity} ${p.unit} ${p.production_type}`,
          icon: 'production',
          date: p.production_date || p.created_date 
        })),
        ...vetVisits.map(v => ({ 
          ...v, 
          type: 'vet', 
          title: `Vet visit: ${v.visit_type}`,
          icon: 'vet',
          date: v.visit_date || v.created_date 
        })),
        ...transactions.map(t => ({ 
          ...t, 
          type: 'financial', 
          title: `${t.transaction_type}: $${t.amount}`,
          icon: 'financial',
          date: t.transaction_date || t.created_date 
        }))
      ];

      return combined
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Memoized icon mapping
  const activityIcons = useMemo(() => ({
    production: <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />,
    vet: <Stethoscope className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    financial: <DollarSign className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    default: <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
  }), []);

  const getActivityIcon = useCallback((type) => activityIcons[type] || activityIcons.default, [activityIcons]);

  const activityColors = useMemo(() => ({
    production: 'bg-green-100 text-green-700 border-green-200',
    vet: 'bg-blue-100 text-blue-700 border-blue-200',
    financial: 'bg-amber-100 text-amber-700 border-amber-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200'
  }), []);

  const getActivityColor = useCallback((type) => activityColors[type] || activityColors.default, [activityColors]);

  // Memoize displayed activities (limit to 5)
  const displayedActivities = useMemo(() => recentActivity.slice(0, 5), [recentActivity]);

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400 animate-pulse" />
            <p>Loading activity...</p>
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedActivities.map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-200 transition-colors">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">
                    {activity.title}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className={getActivityColor(activity.type)}>
                      {activity.type}
                    </Badge>
                    {activity.date && (
                      <Badge variant="outline" className="text-gray-600">
                        {format(new Date(activity.date), 'MMM d')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}