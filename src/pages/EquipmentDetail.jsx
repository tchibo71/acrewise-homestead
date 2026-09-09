import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Wrench,
  DollarSign,
  Calendar,
  Clock,
  TrendingDown,
  Gauge,
  AlertCircle,
  MapPin,
  Fuel,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";

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

export default function EquipmentDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const equipmentId = urlParams.get('id');

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: async () => {
      if (!equipmentId) return null;
      const items = await base44.entities.Equipment.list();
      return items.find(e => e.id === equipmentId) ?? null;
    },
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['equipment-maintenance', equipmentId],
    queryFn: () => base44.entities.EquipmentMaintenance.list('-maintenance_date'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading equipment details...</p>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Equipment not found</h2>
          <Button onClick={() => navigate(createPageUrl("EquipmentManagement"))}>
            Back to Equipment
          </Button>
        </div>
      </div>
    );
  }

  // --- Cost Analysis Calculations ---
  const equipmentMaintenance = maintenanceRecords.filter(
    m => m.equipment_id === equipment.id
  );

  const totalMaintenanceCost = equipmentMaintenance.reduce(
    (sum, m) => sum + (m.cost || 0), 0
  );

  const purchasePrice = equipment.purchase_price || 0;
  const currentValue = equipment.current_value || 0;
  const totalDepreciation = purchasePrice - currentValue;

  const yearsOwned = equipment.purchase_date
    ? differenceInDays(new Date(), new Date(equipment.purchase_date)) / 365
    : null;

  const annualDepreciation = yearsOwned && yearsOwned > 0
    ? totalDepreciation / yearsOwned
    : null;

  const operatingHours = equipment.operating_hours;
  const hasOperatingHours = operatingHours && operatingHours > 0;

  const costPerHour = hasOperatingHours
    ? (totalMaintenanceCost + totalDepreciation) / operatingHours
    : null;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("EquipmentManagement"))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Equipment
        </Button>

        {/* Equipment Overview */}
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl">{equipment.equipment_name}</CardTitle>
                  {(equipment.brand || equipment.model) && (
                    <p className="text-gray-600 mt-1">
                      {equipment.brand} {equipment.model}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {equipment.status && (
                      <Badge className={statusColors[equipment.status] || statusColors.operational}>
                        {equipment.status.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {equipment.condition && (
                      <Badge className={conditionColors[equipment.condition] || conditionColors.good}>
                        {equipment.condition.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {equipment.equipment_type && (
                      <Badge className="bg-gray-100 text-gray-700">
                        {equipment.equipment_type.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {equipment.purchase_date && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Purchased</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {format(new Date(equipment.purchase_date), 'MMM d, yyyy')}
                  </p>
                  {yearsOwned !== null && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {yearsOwned.toFixed(1)} years owned
                    </p>
                  )}
                </div>
              )}
              {equipment.purchase_price != null && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Purchase Price</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    ${purchasePrice.toFixed(0)}
                  </p>
                </div>
              )}
              {equipment.current_value != null && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current Value</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    ${currentValue.toFixed(0)}
                  </p>
                </div>
              )}
              {equipment.operating_hours != null && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Operating Hours</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {operatingHours.toFixed(1)} hrs
                  </p>
                </div>
              )}
              {equipment.storage_location && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {equipment.storage_location}
                  </p>
                </div>
              )}
              {equipment.fuel_type && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fuel Type</p>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-gray-400" />
                    {equipment.fuel_type.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
            {equipment.serial_number && (
              <p className="text-sm text-gray-600 mt-4">
                <span className="text-gray-500">Serial:</span> {equipment.serial_number}
              </p>
            )}
            {equipment.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{equipment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Analysis Section */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Straight-line Depreciation */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900 text-sm">Straight-Line Depreciation (Annual)</h4>
              </div>
              {annualDepreciation !== null ? (
                <>
                  <p className="text-2xl font-bold text-blue-700">
                    ${Math.abs(annualDepreciation).toFixed(2)}
                    <span className="text-sm font-normal text-blue-600">/year</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Total depreciation: ${totalDepreciation.toFixed(0)} over {yearsOwned.toFixed(1)} years
                    {totalDepreciation < 0 && " (value appreciated)"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Insufficient data — purchase date required to calculate depreciation
                </p>
              )}
            </div>

            {/* Cost Per Operating Hour */}
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                <h4 className="font-semibold text-indigo-900 text-sm">Cost Per Operating Hour</h4>
              </div>
              {costPerHour !== null ? (
                <>
                  <p className="text-2xl font-bold text-indigo-700">
                    ${costPerHour.toFixed(2)}
                    <span className="text-sm font-normal text-indigo-600">/hour</span>
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    (${totalMaintenanceCost.toFixed(0)} maintenance + ${totalDepreciation.toFixed(0)} depreciation) ÷ {operatingHours.toFixed(1)} hours
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Insufficient data — operating hours must be greater than zero
                </p>
              )}
            </div>

            {/* Calculation Breakdown */}
            <div className="text-xs text-gray-500 flex items-start gap-2 pt-2 border-t">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Estimates use existing fields: purchase_price, current_value, purchase_date, operating_hours,
                and summed maintenance costs. Straight-line depreciation = (purchase price − current value) ÷ years owned.
                Cost per hour = (total maintenance + total depreciation) ÷ operating hours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance History */}
        {equipmentMaintenance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Maintenance History ({equipmentMaintenance.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {equipmentMaintenance.map((record) => (
                <div key={record.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-gray-200 text-gray-700 text-xs">
                        {record.maintenance_type.replace(/_/g, ' ')}
                      </Badge>
                      {record.maintenance_date && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(record.maintenance_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    {record.description && (
                      <p className="text-sm text-gray-700">{record.description}</p>
                    )}
                    {record.performed_by && (
                      <p className="text-xs text-gray-500 mt-1">By: {record.performed_by}</p>
                    )}
                  </div>
                  {record.cost != null && record.cost > 0 && (
                    <span className="font-semibold text-gray-900 ml-3">
                      ${record.cost.toFixed(0)}
                    </span>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-semibold text-gray-900">Total Maintenance Cost:</span>
                <span className="font-bold text-gray-900">${totalMaintenanceCost.toFixed(0)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}