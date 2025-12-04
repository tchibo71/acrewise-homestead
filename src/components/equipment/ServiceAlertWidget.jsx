import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Wrench, CheckCircle2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";

// Frequency to days mapping
const frequencyToDays = {
  daily: 1,
  weekly: 7,
  bi_weekly: 14,
  monthly: 30,
  bi_monthly: 60,
  quarterly: 90,
  bi_annually: 180,
  annually: 365,
  as_needed: null
};

export default function ServiceAlertWidget() {
  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const { data: maintenanceTasks = [] } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: () => base44.entities.MaintenanceTask.list('-last_completed'),
  });

  // Calculate service alerts based on maintenance frequency and last completed date
  const serviceAlerts = [];

  maintenanceTasks.forEach(task => {
    if (!task.last_completed || task.status === 'completed') return;
    
    const frequencyDays = frequencyToDays[task.frequency];
    if (!frequencyDays) return; // Skip "as_needed" or unknown frequencies

    const lastCompleted = new Date(task.last_completed);
    const today = new Date();
    const daysSinceLast = differenceInDays(today, lastCompleted);
    
    // Calculate percentage of maintenance cycle elapsed
    const cyclePercentage = (daysSinceLast / frequencyDays) * 100;
    
    // Alert at 90% of cycle or if overdue
    if (cyclePercentage >= 90) {
      const daysUntilDue = frequencyDays - daysSinceLast;
      const isOverdue = daysUntilDue < 0;
      
      serviceAlerts.push({
        id: task.id,
        name: task.task_name,
        category: task.category,
        lastCompleted: task.last_completed,
        frequency: task.frequency,
        cyclePercentage: Math.min(cyclePercentage, 100),
        daysUntilDue,
        isOverdue,
        priority: task.priority,
        relatedEquipment: equipment.find(e => e.id === task.related_infrastructure_id)
      });
    }
  });

  // Also check equipment with next_maintenance_due
  equipment.forEach(eq => {
    if (!eq.next_maintenance_due) return;
    
    const dueDate = new Date(eq.next_maintenance_due);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);
    
    // Alert if within 10% of typical 30-day maintenance window (3 days) or overdue
    if (daysUntilDue <= 7) {
      // Check if we already have this equipment in alerts
      const existingAlert = serviceAlerts.find(a => 
        a.relatedEquipment?.id === eq.id
      );
      
      if (!existingAlert) {
        serviceAlerts.push({
          id: `eq-${eq.id}`,
          name: `${eq.equipment_name} Maintenance`,
          category: eq.equipment_type,
          lastCompleted: eq.last_maintenance_date,
          frequency: eq.maintenance_frequency || 'monthly',
          cyclePercentage: daysUntilDue <= 0 ? 100 : Math.max(90, 100 - (daysUntilDue / 30) * 100),
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
          priority: daysUntilDue < 0 ? 'critical' : 'important',
          relatedEquipment: eq
        });
      }
    }
  });

  // Sort by urgency
  serviceAlerts.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.daysUntilDue - b.daysUntilDue;
  });

  if (serviceAlerts.length === 0) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            Equipment Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-sm">
            All equipment is up-to-date on maintenance. No service alerts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Service Alerts ({serviceAlerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {serviceAlerts.slice(0, 5).map(alert => (
          <div 
            key={alert.id} 
            className={`p-3 rounded-lg border ${
              alert.isOverdue 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-orange-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className={`w-4 h-4 flex-shrink-0 ${alert.isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
                  <span className="font-medium text-sm truncate">{alert.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  {alert.isOverdue ? (
                    <span className="text-red-600 font-medium">
                      {Math.abs(alert.daysUntilDue)} days overdue
                    </span>
                  ) : (
                    <span>Due in {alert.daysUntilDue} days</span>
                  )}
                </div>
                {alert.lastCompleted && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last service: {format(new Date(alert.lastCompleted), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs flex-shrink-0 ${
                  alert.isOverdue 
                    ? 'border-red-300 text-red-700 bg-red-50' 
                    : 'border-orange-300 text-orange-700 bg-orange-50'
                }`}
              >
                {Math.round(alert.cyclePercentage)}%
              </Badge>
            </div>
          </div>
        ))}
        
        {serviceAlerts.length > 5 && (
          <p className="text-xs text-orange-700 text-center pt-2">
            +{serviceAlerts.length - 5} more alerts
          </p>
        )}
      </CardContent>
    </Card>
  );
}