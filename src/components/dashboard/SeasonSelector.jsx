import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sun, Wind, Droplets, Calendar, RefreshCw } from "lucide-react";
import { getCurrentSeason, getSeasonName, getSeasonEmoji, getSeasonColor, getAllSeasons, getSeasonMonths } from "@/components/utils/seasonUtils";

const seasonIcons = {
  spring: Leaf,
  summer: Sun,
  fall: Wind,
  winter: Droplets,
  year_round: Calendar
};

export default function SeasonSelector({ selectedSeason, onSeasonChange, showAuto = true }) {
  const autoSeason = getCurrentSeason();
  const isAuto = selectedSeason === autoSeason;

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Season Selection</h3>
            <p className="text-sm text-gray-600">
              {isAuto && showAuto ? (
                <>Auto-detected: <span className="font-medium text-green-600">{getSeasonName(autoSeason)}</span></>
              ) : (
                <>Currently viewing: <span className="font-medium">{getSeasonName(selectedSeason)}</span></>
              )}
            </p>
          </div>
          {showAuto && !isAuto && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSeasonChange(autoSeason)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Auto
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {getAllSeasons().map(season => {
            const Icon = seasonIcons[season];
            const isActive = selectedSeason === season;
            const colorClass = getSeasonColor(season);

            return (
              <Button
                key={season}
                variant={isActive ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-auto py-3 px-2 ${
                  isActive ? `bg-gradient-to-br ${colorClass} text-white border-none` : ''
                }`}
                onClick={() => onSeasonChange(season)}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Icon className="w-5 h-5" />
                    {season === autoSeason && showAuto && (
                      <Badge className="text-[10px] px-1 py-0 bg-green-500">Auto</Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium">{getSeasonName(season)}</span>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-2">
            {getSeasonEmoji(selectedSeason)} {getSeasonName(selectedSeason)} Season
          </p>
          <p className="text-xs text-blue-700">
            {selectedSeason === 'year_round' 
              ? 'These tasks apply throughout the entire year'
              : `Typical months: ${getSeasonMonths(selectedSeason).join(', ')}`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}