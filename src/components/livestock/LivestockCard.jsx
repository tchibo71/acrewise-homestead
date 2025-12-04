
import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Weight,
  Heart,
  Activity
} from "lucide-react";

const animalIcons = {
  chicken: "🐔",
  goat: "🐐",
  sheep: "🐑",
  pig: "🐷",
  cow: "🐄",
  rabbit: "🐰",
  duck: "🦆",
  turkey: "🦃",
  bee_hive: "🐝",
  other: "🐾"
};

const statusColors = {
  active: "bg-green-100 text-green-700 border-green-200",
  sold: "bg-blue-100 text-blue-700 border-blue-200",
  deceased: "bg-gray-100 text-gray-700 border-gray-200",
  butchered: "bg-orange-100 text-orange-700 border-orange-200"
};

export default function LivestockCard({ animal }) {
  const navigate = useNavigate();

  const getAge = () => {
    if (!animal.birth_date) return "Unknown";
    const birth = new Date(animal.birth_date);
    const now = new Date();
    const months = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30));
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''}`;
  };

  const getAnimalTypeDisplay = () => {
    if (animal.animal_type === 'other' && animal.animal_type_other) {
      return animal.animal_type_other;
    }
    return animal.animal_type.replace(/_/g, ' ');
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
      onClick={() => navigate(createPageUrl(`LivestockDetail?id=${animal.id}`))}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{animalIcons[animal.animal_type]}</div>
            <div>
              <CardTitle className="text-lg">{animal.name_or_tag}</CardTitle>
              <p className="text-sm text-gray-600 capitalize">
                {animal.breed || getAnimalTypeDisplay()}
              </p>
            </div>
          </div>
          <Badge className={statusColors[animal.status]}>
            {animal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{getAge()}</span>
          </div>
          {animal.current_weight && (
            <div className="flex items-center gap-2 text-gray-600">
              <Weight className="w-4 h-4" />
              <span>{animal.current_weight} {animal.weight_unit}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="w-4 h-4" />
            <span className="capitalize">{animal.gender}</span>
          </div>
          {animal.purpose && (
            <div className="flex items-center gap-2 text-gray-600">
              <Activity className="w-4 h-4" />
              <span className="capitalize">{animal.purpose}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
