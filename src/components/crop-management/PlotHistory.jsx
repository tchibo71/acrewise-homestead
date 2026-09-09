import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sprout,
  TestTube,
  Bug,
  ShoppingCart,
  Calendar,
  X,
  MapPin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const typeConfig = {
  soil_test: {
    icon: TestTube,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-300",
    label: "Soil Test",
    dateField: "test_date",
  },
  crop_plan: {
    icon: Sprout,
    color: "text-lime-600",
    bg: "bg-lime-50 border-lime-300",
    label: "Crop Plan",
    dateField: "planting_date",
  },
  pest_management: {
    icon: Bug,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-300",
    label: "Pest Issue",
    dateField: "date_identified",
  },
  harvest: {
    icon: ShoppingCart,
    color: "text-green-600",
    bg: "bg-green-50 border-green-300",
    label: "Harvest",
    dateField: "harvest_date",
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function PlotHistory({ plotIdentifier, isOpen, onClose }) {
  // Query all four entity types in parallel, filtered by the plot identifier
  const soilTestsQuery = useQuery({
    queryKey: ['plot-history-soil', plotIdentifier],
    queryFn: () => base44.entities.SoilTest.filter({ location: plotIdentifier }),
    enabled: isOpen && !!plotIdentifier,
    staleTime: 2 * 60 * 1000,
  });

  const cropPlansQuery = useQuery({
    queryKey: ['plot-history-crops', plotIdentifier],
    queryFn: () => base44.entities.CropPlan.filter({ location: plotIdentifier }),
    enabled: isOpen && !!plotIdentifier,
    staleTime: 2 * 60 * 1000,
  });

  const pestRecordsQuery = useQuery({
    queryKey: ['plot-history-pest', plotIdentifier],
    queryFn: () => base44.entities.PestManagement.filter({ location: plotIdentifier }),
    enabled: isOpen && !!plotIdentifier,
    staleTime: 2 * 60 * 1000,
  });

  const harvestsQuery = useQuery({
    queryKey: ['plot-history-harvest', plotIdentifier],
    queryFn: () => base44.entities.HarvestRecord.filter({ garden_plot_id: plotIdentifier }),
    enabled: isOpen && !!plotIdentifier,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading =
    soilTestsQuery.isLoading ||
    cropPlansQuery.isLoading ||
    pestRecordsQuery.isLoading ||
    harvestsQuery.isLoading;

  // Combine all results into one sorted timeline
  const timeline = useMemo(() => {
    const items = [];

    (soilTestsQuery.data || []).forEach(r => {
      items.push({
        type: "soil_test",
        date: r.test_date,
        data: r,
      });
    });

    (cropPlansQuery.data || []).forEach(r => {
      items.push({
        type: "crop_plan",
        date: r.planting_date || r.created_date,
        data: r,
      });
    });

    (pestRecordsQuery.data || []).forEach(r => {
      items.push({
        type: "pest_management",
        date: r.date_identified,
        data: r,
      });
    });

    (harvestsQuery.data || []).forEach(r => {
      items.push({
        type: "harvest",
        date: r.harvest_date,
        data: r,
      });
    });

    // Sort descending by date (most recent first)
    return items.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [soilTestsQuery.data, cropPlansQuery.data, pestRecordsQuery.data, harvestsQuery.data]);

  const renderItem = (item) => {
    const config = typeConfig[item.type];
    const Icon = config.icon;
    const r = item.data;

    let title, subtitle, badges = [];

    if (item.type === "soil_test") {
      title = `Soil Test — ${r.location || "Unknown"}`;
      if (r.ph_level) badges.push(<Badge key="ph" variant="outline">pH {r.ph_level}</Badge>);
      if (r.nitrogen_level) badges.push(<Badge key="n" variant="outline">N: {r.nitrogen_level}</Badge>);
      if (r.phosphorus_level) badges.push(<Badge key="p" variant="outline">P: {r.phosphorus_level}</Badge>);
      if (r.potassium_level) badges.push(<Badge key="k" variant="outline">K: {r.potassium_level}</Badge>);
      subtitle = r.ai_analysis || r.recommendations || r.lab_name || "No analysis recorded";
    } else if (item.type === "crop_plan") {
      title = `${r.crop_name}${r.variety ? ` (${r.variety})` : ""}`;
      badges.push(<Badge key="yr" variant="outline">{r.year}</Badge>);
      if (r.acreage) badges.push(<Badge key="ac" variant="outline">{r.acreage} ac</Badge>);
      subtitle = [
        r.planting_date && `Planted: ${formatDate(r.planting_date)}`,
        r.harvest_date && `Harvest: ${formatDate(r.harvest_date)}`,
        r.expected_yield && `Expected yield: ${r.expected_yield} ${r.yield_unit || ""}`,
      ].filter(Boolean).join(" • ");
    } else if (item.type === "pest_management") {
      title = `${r.pest_name || "Unknown pest"} — ${r.pest_type || ""}`;
      if (r.severity) badges.push(<Badge key="sev" variant={r.severity === "critical" ? "destructive" : "outline"}>{r.severity}</Badge>);
      subtitle = [
        r.affected_crop_or_animal && `Affected: ${r.affected_crop_or_animal}`,
        r.treatment_method && `Treatment: ${r.treatment_method}`,
        r.effectiveness && `Effectiveness: ${r.effectiveness.replace(/_/g, " ")}`,
      ].filter(Boolean).join(" • ");
    } else if (item.type === "harvest") {
      title = `${r.crop_type || "Crop"} Harvest`;
      badges.push(<Badge key="qty" variant="outline">{r.quantity_harvested} {r.unit}</Badge>);
      if (r.quality_grade) badges.push(<Badge key="q" variant="outline">{r.quality_grade}</Badge>);
      subtitle = [
        r.actual_sale_value != null && `Sold: $${r.actual_sale_value.toFixed(2)}`,
        r.market_value != null && `Market value: $${r.market_value.toFixed(2)}`,
        r.roi_percentage != null && `ROI: ${r.roi_percentage.toFixed(0)}%`,
      ].filter(Boolean).join(" • ");
    }

    return (
      <div
        key={`${item.type}-${r.id}`}
        className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg}`}
      >
        <div className={`flex-shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center border ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold uppercase tracking-wide ${config.color}`}>{config.label}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.date)}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          {badges.length > 0 && <div className="flex gap-1 flex-wrap mt-1">{badges}</div>}
          {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-lime-600" />
            Plot History — {plotIdentifier}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-4 border-lime-200 border-t-lime-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading plot history...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No records found for this plot.</p>
            <p className="text-xs text-gray-400 mt-1">
              Soil tests, crop plans, pest records, and harvests for "{plotIdentifier}" will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">
              {timeline.length} record{timeline.length !== 1 ? "s" : ""} — most recent first
            </p>
            {timeline.map(renderItem)}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}