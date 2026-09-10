import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Beaker, Calendar, Hash } from "lucide-react";
import { MUSHROOM_SPECIES, STATUS_COLORS, getStageLabel } from "./mushroomBatchConstants";

export default function MushroomBatchCard({ batch, onDetails }) {
  const speciesLabel = MUSHROOM_SPECIES.find(s => s.value === batch.species)?.label || batch.species;
  return (
    <Card className="border-none shadow-md bg-white/80 hover:shadow-lg transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Beaker className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{batch.batch_name}</h3>
              <p className="text-xs text-gray-500">{speciesLabel}{batch.strain_name ? ` · ${batch.strain_name}` : ""}</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[batch.status] || STATUS_COLORS.inoculated}`}>
            {getStageLabel(batch.status)}
          </span>
        </div>
        {batch.lot_number && (
          <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
            <Hash className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm font-mono font-semibold text-amber-900 tracking-wide">{batch.lot_number}</span>
          </div>
        )}
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Inoculated: {batch.inoculation_date ? new Date(batch.inoculation_date).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Beaker className="w-4 h-4 text-gray-400" />
            <span>{batch.container_count || 0} {batch.container_type?.replace(/_/g, " ") || "containers"}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onDetails(batch)}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}