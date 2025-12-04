import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, AlertTriangle, Calendar, DollarSign, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function EquipmentCard({ equipment }) {
  const isMaintenanceOverdue = equipment.next_maintenance_due && 
    new Date(equipment.next_maintenance_due) < new Date();
  
  const isMaintenanceSoon = equipment.next_maintenance_due && (() => {
    const daysUntil = Math.floor((new Date(equipment.next_maintenance_due) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30;
  })();

  const statusColors = {
    operational: "bg-green-100 text-green-700",
    in_repair: "bg-orange-100 text-orange-700",
    out_of_service: "bg-red-100 text-red-700",
    rented_out: "bg-blue-100 text-blue-700",
    sold: "bg-gray-100 text-gray-700"
  };

  const conditionColors = {
    excellent: "bg-emerald-100 text-emerald-700",
    good: "bg-green-100 text-green-700",
    fair: "bg-yellow-100 text-yellow-700",
    poor: "bg-orange-100 text-orange-700",
    needs_repair: "bg-red-100 text-red-700"
  };

  return (
    <Link to={createPageUrl(`EquipmentDetail?id=${equipment.id}`)}>
      <Card className={`hover:shadow-xl transition-all duration-300 cursor-pointer ${isMaintenanceOverdue ? 'border-l-4 border-l-red-500' : isMaintenanceSoon ? 'border-l-4 border-l-yellow-500' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{equipment.equipment_name}</CardTitle>
              {(equipment.brand || equipment.model) && (
                <p className="text-sm text-gray-600 mt-1">
                  {equipment.brand} {equipment.model}
                </p>
              )}
            </div>
            <Wrench className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusColors[equipment.status] || statusColors.operational}>
              {equipment.status.replace(/_/g, ' ')}
            </Badge>
            <Badge className={conditionColors[equipment.condition] || conditionColors.good}>
              {equipment.condition.replace(/_/g, ' ')}
            </Badge>
            {isMaintenanceOverdue && (
              <Badge className="bg-red-100 text-red-700 border-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
            {isMaintenanceSoon && !isMaintenanceOverdue && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                <Calendar className="w-3 h-3 mr-1" />
                Due Soon
              </Badge>
            )}
          </div>

          {equipment.equipment_type && (
            <p className="text-sm text-gray-600">
              Type: {equipment.equipment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          )}

          {equipment.next_maintenance_due && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={isMaintenanceOverdue ? 'text-red-600 font-medium' : isMaintenanceSoon ? 'text-yellow-700' : 'text-gray-600'}>
                Maintenance: {format(new Date(equipment.next_maintenance_due), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {equipment.storage_location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{equipment.storage_location}</span>
            </div>
          )}

          {equipment.current_value && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>Current Value</span>
              </div>
              <span className="font-semibold text-gray-900">
                ${equipment.current_value.toFixed(0)}
              </span>
            </div>
          )}

          {equipment.operating_hours && (
            <p className="text-sm text-gray-600">
              Operating Hours: {equipment.operating_hours.toFixed(1)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}