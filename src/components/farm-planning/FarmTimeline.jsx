import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  History,
  Trophy,
  AlertTriangle,
  Wrench,
  TrendingUp,
  TrendingDown,
  Star,
  Building,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const eventTypeConfig = {
  ownership_change: { icon: Building, color: "bg-blue-500", label: "Ownership" },
  major_improvement: { icon: TrendingUp, color: "bg-green-500", label: "Improvement" },
  catastrophe: { icon: AlertTriangle, color: "bg-red-500", label: "Catastrophe" },
  emergency: { icon: AlertTriangle, color: "bg-orange-500", label: "Emergency" },
  success: { icon: Trophy, color: "bg-emerald-500", label: "Success" },
  failure: { icon: TrendingDown, color: "bg-red-400", label: "Failure" },
  milestone: { icon: Star, color: "bg-purple-500", label: "Milestone" },
  maintenance: { icon: Wrench, color: "bg-amber-500", label: "Maintenance" },
  other: { icon: History, color: "bg-gray-500", label: "Event" }
};

export default function FarmTimeline({ limit = 10 }) {
  const { data: historyRecords = [], isLoading } = useQuery({
    queryKey: ['farm-history-timeline'],
    queryFn: () => base44.entities.FarmHistory.list('-event_date', limit),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Farm Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (historyRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Farm Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No history records yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Events will appear as you add livestock, complete goals, and perform maintenance
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          Farm Timeline
        </CardTitle>
        <Link to={createPageUrl("FarmHistory")}>
          <Button variant="ghost" size="sm" className="text-purple-600">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {historyRecords.map((record, index) => {
              const config = eventTypeConfig[record.event_type] || eventTypeConfig.other;
              const Icon = config.icon;
              
              return (
                <div key={record.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center z-10 shadow-md flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{record.title}</h4>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {config.label}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {format(new Date(record.event_date), 'MMM d, yyyy')}
                    </p>

                    {record.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {record.description}
                      </p>
                    )}

                    {record.financial_impact !== null && record.financial_impact !== undefined && (
                      <div className="mt-2">
                        <Badge className={record.financial_impact >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {record.financial_impact >= 0 ? '+' : ''}${Math.abs(record.financial_impact).toFixed(2)}
                        </Badge>
                      </div>
                    )}

                    {record.lessons_learned && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        💡 {record.lessons_learned}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}