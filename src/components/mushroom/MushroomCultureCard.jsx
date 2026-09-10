import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Microscope, GitBranch, CheckCircle2, XCircle } from "lucide-react";
import { MUSHROOM_SPECIES } from "./mushroomBatchConstants";
import { ORIGIN_TYPES } from "./mushroomLabConstants";

const speciesLabel = (v) => MUSHROOM_SPECIES.find(s => s.value === v)?.label || v;
const originLabel = (v) => ORIGIN_TYPES.find(o => o.value === v)?.label || v;

export default function MushroomCultureCard({ culture, parentCulture, onDetails }) {
  return (
    <Card className="border-none shadow-md bg-white/80 hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{culture.strain_name}</h3>
              <p className="text-sm text-gray-500">{speciesLabel(culture.species)}</p>
            </div>
          </div>
          {culture.is_active ? (
            <Badge className="bg-green-100 text-green-700 border-green-300 shrink-0">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500 border-gray-300 shrink-0">
              <XCircle className="w-3 h-3 mr-1" /> Retired
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1 mb-3">
          <p><span className="text-gray-400">Origin:</span> {originLabel(culture.origin_type)}</p>
          {culture.source && <p className="truncate"><span className="text-gray-400">Source:</span> {culture.source}</p>}
        </div>

        {parentCulture && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 mb-3">
            <GitBranch className="w-3.5 h-3.5 shrink-0" />
            <span>Cloned from <button className="font-medium underline cursor-pointer" onClick={() => onDetails(parentCulture)}>{parentCulture.strain_name}</button></span>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full" onClick={() => onDetails(culture)}>
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}