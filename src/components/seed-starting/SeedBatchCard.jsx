import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, Calendar, Layers } from "lucide-react";
import { getSeedBatchStage, STAGE_COLORS } from "./seedBatchConstants";

export default function SeedBatchCard({ batch, onDetails }) {
  const stage = getSeedBatchStage(batch);
  return (
    <Card className="border-none shadow-md bg-white/80 hover:shadow-lg transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{batch.crop_name}</h3>
              {batch.variety && <p className="text-xs text-gray-500">{batch.variety}</p>}
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STAGE_COLORS[stage.key]}`}>
            {stage.label}
          </span>
        </div>
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Sown: {batch.sow_date ? new Date(batch.sow_date).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>{batch.seeds_sown} seeds sown</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onDetails(batch)}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}