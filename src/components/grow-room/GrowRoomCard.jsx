import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Thermometer, Droplets, Wind, AlertTriangle, Beaker, Sparkles, SprayCan } from "lucide-react";
import { format } from "date-fns";
import { getRoomTypeLabel, isSanitationOverdue, daysSinceSanitation } from "./growRoomConstants";

function ReadingRow({ icon: Icon, label, current, target, unit }) {
  const hasCurrent = current != null;
  const hasTarget = target != null;
  const inRange = hasCurrent && hasTarget && Math.abs(current - target) <= (target * 0.1);
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {hasCurrent && (
          <span className={inRange ? "text-green-700 font-medium" : "text-gray-900 font-medium"}>
            {current}{unit}
          </span>
        )}
        {hasTarget && (
          <span className="text-gray-400 text-xs">
            / {target}{unit}
          </span>
        )}
        {!hasCurrent && !hasTarget && (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </div>
    </div>
  );
}

export default function GrowRoomCard({ room, activeBatchCount, onLogSanitation, onLogReading }) {
  const overdue = isSanitationOverdue(room);
  const daysSince = daysSinceSanitation(room);

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${overdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{room.room_name}</CardTitle>
            <p className="text-sm text-gray-600 mt-0.5">{getRoomTypeLabel(room.room_type)}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {room.has_hepa_filtration && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                <Sparkles className="w-3 h-3 mr-1" />
                HEPA
              </Badge>
            )}
            {overdue && (
              <Badge className="bg-red-100 text-red-700 border-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Sanitize Overdue
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active batch count */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Beaker className="w-4 h-4" />
            <span>Active Batches</span>
          </div>
          <span className="font-semibold text-gray-900">{activeBatchCount}</span>
        </div>

        {/* Environmental readings */}
        <div className="space-y-2">
          <ReadingRow icon={Thermometer} label="Temp" current={room.current_temp_f} target={room.target_temp_f} unit="°F" />
          <ReadingRow icon={Droplets} label="Humidity" current={room.current_humidity_percent} target={room.target_humidity_percent} unit="%" />
          <ReadingRow icon={Wind} label="CO₂" current={room.current_co2_ppm} target={room.target_co2_ppm} unit=" ppm" />
        </div>

        {/* Last reading date */}
        {room.last_reading_date && (
          <p className="text-xs text-gray-400">
            Last reading: {format(new Date(room.last_reading_date), 'MMM d, yyyy')}
          </p>
        )}

        {/* Sanitation status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <SprayCan className="w-4 h-4" />
              <span>Sanitized</span>
            </div>
            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {room.last_sanitized_date
                ? `${daysSince}d ago`
                : 'Never'}
            </span>
          </div>
          {room.last_sanitized_date && (
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(room.last_sanitized_date), 'MMM d, yyyy')} · every {room.sanitation_frequency_days || 7}d
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); onLogReading(room); }}
          >
            <Thermometer className="w-3.5 h-3.5 mr-1.5" />
            Log Reading
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); onLogSanitation(room); }}
          >
            <SprayCan className="w-3.5 h-3.5 mr-1.5" />
            Log Sanitation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}