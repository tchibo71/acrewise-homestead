import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Droplets,
  ThermometerSun,
  Star,
  Clock
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const statusColors = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  refrigerated: "bg-purple-100 text-purple-700 border-purple-200"
};

const typeEmojis = {
  sauerkraut: "🥬",
  kimchi: "🌶️",
  pickles: "🥒",
  hot_sauce: "🔥",
  salsa: "🍅",
  carrots: "🥕",
  beets: "🫒",
  mixed_vegetables: "🥗",
  sourdough: "🍞",
  kombucha: "🫖",
  grape_juice: "🍇",
  wine: "🍷",
  cider: "🍎",
  mead: "🍯",
  vinegar: "🧪",
  beer: "🍺",
  fermented_sausage: "🌭",
  salami: "🥓",
  cured_meat: "🥩",
  cheese_fresh: "🧀",
  cheese_semi_hard: "🧀",
  cheese_hard: "🧀",
  cheese_blue: "🫕",
  cheese_mold_ripened: "🧀",
  other: "🥫"
};

export default function FermentationCard({ batch, onEdit }) {
  const navigate = useNavigate();

  const daysActive = batch.status === "active" && batch.start_date
    ? differenceInDays(new Date(), new Date(batch.start_date))
    : batch.fermentation_days || 0;

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-200 cursor-pointer border-l-4 border-l-amber-500"
      onClick={() => navigate(createPageUrl(`FermentationDetail?id=${batch.id}`))}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{typeEmojis[batch.fermentation_type]}</div>
            <div>
              <CardTitle className="text-lg">{batch.batch_name}</CardTitle>
              <p className="text-sm text-gray-600 capitalize">
                {batch.fermentation_type.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <Badge className={statusColors[batch.status]}>
            {batch.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Droplets className="w-4 h-4" />
            <span>
              {batch.preservative_type === "sugar"
                ? `${batch.sugar_percentage ?? 0}% sugar`
                : batch.preservative_type === "cure"
                  ? `${batch.cure_type === "cure_2" ? "Cure #2" : "Cure #1"} (${batch.cure_weight ?? 0}g)`
                  : batch.preservative_type === "none"
                    ? "no preservative"
                    : `${batch.salt_percentage ?? 0}% salt`}
            </span>
          </div>
          
          {batch.fermentation_temperature && (
            <div className="flex items-center gap-2 text-gray-600">
              <ThermometerSun className="w-4 h-4" />
              <span>{batch.fermentation_temperature}°F</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{daysActive} days</span>
          </div>

          {batch.success_rating && (
            <div className="flex items-center gap-2 text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{batch.success_rating}/5</span>
            </div>
          )}
        </div>

        {batch.start_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Started: {format(new Date(batch.start_date), 'MMM d, yyyy')}</span>
          </div>
        )}

        {batch.primary_produce && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Main ingredient:</span> {batch.primary_produce}
          </p>
        )}

        {batch.containers && batch.containers.length > 0 && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Containers:</span> {batch.containers.reduce((sum, c) => sum + c.quantity, 0)} total
          </p>
        )}

        {batch.is_smoked && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            🔥 Smoked
          </Badge>
        )}

        {batch.problems_encountered && batch.problems_encountered.length > 0 && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            {batch.problems_encountered.length} issue(s) noted
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}