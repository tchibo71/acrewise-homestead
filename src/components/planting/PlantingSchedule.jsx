import React from "react";
import { Home, Sun, Wind, ArrowRight } from "lucide-react";

const isValid = (val) => val && val !== "null" && val !== "undefined" && val !== "";

export default function PlantingSchedule({ crop }) {
  const hasIndoorStart =
    isValid(crop.start_indoors_relative) && isValid(crop.start_indoors_dates);
  const hasDirectSow =
    isValid(crop.direct_sow_relative) && isValid(crop.direct_sow_dates);
  const hasTransplant =
    isValid(crop.transplant_relative) && isValid(crop.transplant_dates);
  const hasHardening = crop.hardening_days && hasIndoorStart;

  if (!hasIndoorStart && !hasDirectSow && !hasTransplant) return null;

  return (
    <div className="space-y-2.5 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
      {/* Start Seeds Indoors */}
      {hasIndoorStart && (
        <div className="flex items-start gap-2">
          <Home className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-800">Start Seeds Indoors</p>
            <p className="text-xs text-gray-500">{crop.start_indoors_relative}</p>
            <p className="text-xs font-medium text-gray-900">{crop.start_indoors_dates}</p>
          </div>
        </div>
      )}

      {/* Hardening Off */}
      {hasHardening && (
        <div className="flex items-start gap-2 pl-4 border-l-2 border-amber-300 ml-2">
          <Wind className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800">Harden Off</p>
            <p className="text-xs text-gray-500">
              {crop.hardening_days} days before transplant
            </p>
          </div>
        </div>
      )}

      {/* Transplant Outdoors */}
      {hasTransplant && (
        <div className="flex items-start gap-2">
          <ArrowRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-800">Transplant Outdoors</p>
            <p className="text-xs text-gray-500">{crop.transplant_relative}</p>
            <p className="text-xs font-medium text-gray-900">{crop.transplant_dates}</p>
          </div>
        </div>
      )}

      {/* Direct Sow */}
      {hasDirectSow && (
        <div className="flex items-start gap-2">
          <Sun className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-800">Direct Sow Outdoors</p>
            <p className="text-xs text-gray-500">{crop.direct_sow_relative}</p>
            <p className="text-xs font-medium text-gray-900">{crop.direct_sow_dates}</p>
          </div>
        </div>
      )}
    </div>
  );
}