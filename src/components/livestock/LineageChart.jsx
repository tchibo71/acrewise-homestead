
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertTriangle } from "lucide-react";

const animalIcons = {
  chicken: "🐔",
  goat: "🐐",
  sheep: "🐑",
  pig: "🐷",
  cow: "🐄",
  rabbit: "🐰",
  duck: "🦆",
  turkey: "🦃",
  other: "🐾"
};

export default function LineageChart({ animal }) {
  const { data: allAnimals = [] } = useQuery({
    queryKey: ['all-livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const mother = allAnimals.find(a => a.id === animal.mother_id);
  const father = allAnimals.find(a => a.id === animal.father_id);
  
  const maternalGrandmother = mother ? allAnimals.find(a => a.id === mother.mother_id) : null;
  const maternalGrandfather = mother ? allAnimals.find(a => a.id === mother.father_id) : null;
  const paternalGrandmother = father ? allAnimals.find(a => a.id === father.mother_id) : null;
  const paternalGrandfather = father ? allAnimals.find(a => a.id === father.father_id) : null;

  // Calculate coefficient of inbreeding
  const calculateInbreeding = () => {
    if (!mother || !father) return null;
    
    // Simple inbreeding detection: check if parents share common ancestors
    const commonAncestors = [];
    
    // Check if parents are siblings (same mother or father)
    if (mother.mother_id === father.mother_id && mother.mother_id) {
      commonAncestors.push({ relation: "Same mother", coefficient: 0.25 });
    }
    if (mother.father_id === father.father_id && mother.father_id) {
      commonAncestors.push({ relation: "Same father", coefficient: 0.25 });
    }
    
    // Check if one parent is the grandparent of the other
    if (mother.id === father.mother_id || mother.id === father.father_id) {
      commonAncestors.push({ relation: "Parent/offspring", coefficient: 0.25 });
    }
    if (father.id === mother.mother_id || father.id === mother.father_id) {
      commonAncestors.push({ relation: "Parent/offspring", coefficient: 0.25 });
    }
    
    // Check for shared grandparents
    const maternalGrandparents = [mother.mother_id, mother.father_id].filter(Boolean);
    const paternalGrandparents = [father.mother_id, father.father_id].filter(Boolean);
    
    maternalGrandparents.forEach(mgp => {
      if (paternalGrandparents.includes(mgp)) {
        commonAncestors.push({ relation: "Shared grandparent", coefficient: 0.125 });
      }
    });
    
    const totalCoefficient = commonAncestors.reduce((sum, a) => sum + a.coefficient, 0);
    
    return {
      hasInbreeding: commonAncestors.length > 0,
      coefficient: totalCoefficient,
      details: commonAncestors
    };
  };

  const inbreedingInfo = calculateInbreeding();

  const AnimalCard = ({ animalData, externalName, label, generation }) => {
    const displayName = animalData?.name_or_tag || externalName || "Unknown";
    const icon = animalData ? animalIcons[animalData.animal_type] : "❓";
    
    return (
      <div className={`bg-white rounded-lg border-2 ${animalData ? 'border-green-300' : 'border-gray-300'} p-3 text-center`}>
        <div className="text-2xl mb-1">{icon}</div>
        <div className="font-semibold text-sm">{displayName}</div>
        <div className="text-xs text-gray-500">{label}</div>
        {animalData?.breed && (
          <div className="text-xs text-gray-600 mt-1">{animalData.breed}</div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Family Lineage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inbreedingInfo && inbreedingInfo.hasInbreeding && (
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-orange-900 mb-1">
                  Inbreeding Detected
                </div>
                <div className="text-sm text-orange-800 mb-2">
                  Coefficient of Inbreeding: {(inbreedingInfo.coefficient * 100).toFixed(1)}%
                </div>
                {inbreedingInfo.details.map((detail, idx) => (
                  <div key={idx} className="text-xs text-orange-700">
                    • {detail.relation}: {(detail.coefficient * 100).toFixed(1)}% contribution
                  </div>
                ))}
                <div className="text-xs text-orange-600 mt-2">
                  Note: Higher inbreeding coefficients may increase risk of genetic issues
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Three Generation Pedigree Chart */}
        <div className="space-y-6">
          {/* Current Animal - Generation 0 */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-4 border-blue-500 p-4 text-center min-w-[180px]">
              <div className="text-3xl mb-2">{animalIcons[animal.animal_type]}</div>
              <div className="font-bold text-lg">{animal.name_or_tag}</div>
              <Badge className="mt-2 bg-blue-600">Current Animal</Badge>
              {animal.breed && (
                <div className="text-sm text-blue-900 mt-1">{animal.breed}</div>
              )}
            </div>
          </div>

          {/* Parents - Generation 1 */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-center font-semibold text-gray-700 mb-2">Dam (Mother)</div>
              <AnimalCard 
                animalData={mother} 
                externalName={animal.mother_name}
                label="Mother" 
                generation={1} 
              />
            </div>
            <div>
              <div className="text-center font-semibold text-gray-700 mb-2">Sire (Father)</div>
              <AnimalCard 
                animalData={father} 
                externalName={animal.father_name}
                label="Father" 
                generation={1} 
              />
            </div>
          </div>

          {/* Grandparents - Generation 2 */}
          {(mother || father) && (
            <div>
              <div className="text-center font-semibold text-gray-700 mb-3">Grandparents</div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-2 text-center">Maternal Grandmother</div>
                  <AnimalCard 
                    animalData={maternalGrandmother}
                    externalName={mother?.mother_name}
                    label="MGM" 
                    generation={2} 
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-2 text-center">Maternal Grandfather</div>
                  <AnimalCard 
                    animalData={maternalGrandfather}
                    externalName={mother?.father_name}
                    label="MGF" 
                    generation={2} 
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-2 text-center">Paternal Grandmother</div>
                  <AnimalCard 
                    animalData={paternalGrandmother}
                    externalName={father?.mother_name}
                    label="PGM" 
                    generation={2} 
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-2 text-center">Paternal Grandfather</div>
                  <AnimalCard 
                    animalData={paternalGrandfather}
                    externalName={father?.father_name}
                    label="PGF" 
                    generation={2} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!mother && !father && !animal.mother_name && !animal.father_name && (
          <div className="text-center py-8 text-gray-500">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No lineage information recorded</p>
            <p className="text-sm mt-1">Edit animal to add parent information</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
