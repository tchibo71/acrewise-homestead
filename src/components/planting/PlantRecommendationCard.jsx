import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sprout,
  Sun,
  Thermometer,
  Droplets,
  Ruler,
  Calendar,
  Users,
  CheckCircle2,
  Plus
} from "lucide-react";

const difficultyColors = {
  easy: "bg-green-100 text-green-800 border-green-300",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
  challenging: "bg-red-100 text-red-800 border-red-300",
};

const categoryEmojis = {
  vegetable: "🥬",
  herb: "🌿",
  fruit: "🍎",
  flower: "🌸",
};

export default function PlantRecommendationCard({ crop, onAddToPlan, added }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {categoryEmojis[crop.category?.toLowerCase()] || "🌱"}
            </span>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{crop.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{crop.category}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {crop.difficulty && (
              <Badge className={`${difficultyColors[crop.difficulty?.toLowerCase()] || difficultyColors.moderate} border`}>
                {crop.difficulty}
              </Badge>
            )}
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {crop.days_to_harvest} days
            </span>
          </div>
        </div>

        {/* Description */}
        {crop.description && (
          <p className="text-sm text-gray-600 mb-3">{crop.description}</p>
        )}

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          {crop.planting_depth && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Ruler className="w-3.5 h-3.5 text-green-600" />
              <span>Depth: {crop.planting_depth}</span>
            </div>
          )}
          {crop.spacing && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Sprout className="w-3.5 h-3.5 text-green-600" />
              <span>Spacing: {crop.spacing}</span>
            </div>
          )}
          {crop.soil_temperature && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Thermometer className="w-3.5 h-3.5 text-orange-600" />
              <span>Soil: {crop.soil_temperature}</span>
            </div>
          )}
          {crop.sunlight_hours && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Sun className="w-3.5 h-3.5 text-yellow-500" />
              <span>{crop.sunlight_hours}</span>
            </div>
          )}
          {crop.watering && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">{crop.watering}</span>
            </div>
          )}
        </div>

        {/* Companion plants */}
        {crop.companion_plants?.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">Companions:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {crop.companion_plants.map((plant, i) => (
                <Badge key={i} variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                  {plant}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Harvest tips - collapsible */}
        {crop.harvest_tips && (
          <div className="mb-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-green-700 font-medium hover:text-green-800"
            >
              {showDetails ? "Hide harvest tips" : "Show harvest tips"}
            </button>
            {showDetails && (
              <div className="mt-1.5 p-2.5 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-700">{crop.harvest_tips}</p>
              </div>
            )}
          </div>
        )}

        {/* Add to plan button */}
        <Button
          onClick={() => onAddToPlan(crop)}
          disabled={added}
          className={`w-full ${added ? "bg-green-600" : "bg-amber-600 hover:bg-amber-700"}`}
          size="sm"
        >
          {added ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Added to Garden Plan
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Garden Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}