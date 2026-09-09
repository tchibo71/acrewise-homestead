import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Heart,
  Stethoscope,
  Weight,
  Footprints,
  DollarSign,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Wrench,
  Link as LinkIcon,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

const typeConfig = {
  livestock_added: { icon: Heart, color: "text-green-600", bg: "bg-green-100", label: "Livestock" },
  vet_visit: { icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-100", label: "Vet Visit" },
  weight_recorded: { icon: Weight, color: "text-purple-600", bg: "bg-purple-100", label: "Weight" },
  grazing_change: { icon: Footprints, color: "text-teal-600", bg: "bg-teal-100", label: "Grazing" },
  major_expense: { icon: DollarSign, color: "text-red-600", bg: "bg-red-100", label: "Expense" },
  emergency: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", label: "Emergency" },
  milestone: { icon: Sparkles, color: "text-amber-600", bg: "bg-amber-100", label: "Milestone" },
  success: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Success" },
  failure: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", label: "Failure" },
  maintenance: { icon: Wrench, color: "text-blue-600", bg: "bg-blue-100", label: "Maintenance" },
  catastrophe: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100", label: "Catastrophe" },
  ownership_change: { icon: Clock, color: "text-indigo-600", bg: "bg-indigo-100", label: "Ownership" },
  major_improvement: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Improvement" },
  other: { icon: Clock, color: "text-gray-600", bg: "bg-gray-100", label: "Activity" },
};

function parseEvent(event) {
  let specificType = null;
  let displayTitle = event.title || "";
  if (event.title && event.title.includes("|")) {
    const idx = event.title.indexOf("|");
    specificType = event.title.substring(0, idx);
    displayTitle = event.title.substring(idx + 1);
  }
  const typeKey = specificType || event.event_type;
  const config = typeConfig[typeKey] || typeConfig.other;
  return { displayTitle, config };
}

function resolveEntityLink(entityRef) {
  if (entityRef.includes(":")) {
    const [type] = entityRef.split(":");
    switch (type) {
      case "livestock":
        return { label: "View Animal", url: `${createPageUrl("LivestockDetail")}?id=${entityRef.split(":")[1]}` };
      case "pasture":
        return { label: "Pasture", url: createPageUrl("GrazingManagement") };
      case "grazing_record":
        return { label: "Grazing", url: createPageUrl("GrazingManagement") };
      case "vet_visit":
        return { label: "Health", url: createPageUrl("LivestockManagement") };
      case "weight_record":
        return { label: "Weight", url: createPageUrl("LivestockManagement") };
      case "financial_transaction":
        return { label: "Financials", url: createPageUrl("FinancialManagement") };
      case "emergency_log":
        return { label: "Emergency", url: createPageUrl("EmergencyLogs") };
      default:
        return null;
    }
  }
  return { label: "View Record", url: `${createPageUrl("LivestockDetail")}?id=${entityRef}` };
}

function getGroupLabel(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  const now = new Date();
  const daysDiff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) return format(d, "EEEE");
  if (daysDiff < 30) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

export default function FarmActivityFeed() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["farm-activity-feed"],
    queryFn: async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return [];
      return base44.entities.FarmHistory.list("-event_date", 30);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const grouped = useMemo(() => {
    const groups = {};
    events.forEach((e) => {
      const label = getGroupLabel(e.event_date || e.created_date);
      if (!groups[label]) groups[label] = [];
      groups[label].push(e);
    });
    return Object.entries(groups);
  }, [events]);

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Farm Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400 animate-pulse" />
            <p>Loading activity...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No farm activity yet</p>
            <p className="text-xs mt-1">Events are logged automatically as you manage your homestead</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([groupLabel, groupEvents]) => (
              <div key={groupLabel}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {groupLabel}
                </p>
                <div className="space-y-3">
                  {groupEvents.map((event) => {
                    const { displayTitle, config } = parseEvent(event);
                    const Icon = config.icon;
                    const links = (event.related_entities || [])
                      .map(resolveEntityLink)
                      .filter(Boolean);
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-200 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">{displayTitle}</p>
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-xs ${config.color} border-current`}>
                              {config.label}
                            </Badge>
                            {event.financial_impact != null && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${event.financial_impact < 0 ? "text-red-600" : "text-green-600"} border-current`}
                              >
                                {event.financial_impact < 0 ? "-" : "+"}${Math.abs(event.financial_impact).toFixed(0)}
                              </Badge>
                            )}
                            {links.map((link, idx) => (
                              <Link
                                key={idx}
                                to={link.url}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                <LinkIcon className="w-3 h-3" />
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}