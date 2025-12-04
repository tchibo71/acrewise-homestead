import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LineageProductionReport({ livestock, productions }) {
  // Group animals by mother
  const familyGroups = {};
  
  livestock.forEach(animal => {
    const motherId = animal.mother_id || 'unknown';
    if (!familyGroups[motherId]) {
      familyGroups[motherId] = {
        mother: livestock.find(a => a.id === motherId) || { name_or_tag: 'Unknown', id: motherId },
        offspring: []
      };
    }
    if (animal.mother_id) {
      familyGroups[motherId].offspring.push(animal);
    }
  });

  const calculateStats = (animalId) => {
    const animalProds = productions.filter(p => p.livestock_id === animalId);
    const totalMilk = animalProds.reduce((sum, p) => sum + (p.milk_weight_lbs || 0), 0);
    const avgMilk = animalProds.length > 0 ? totalMilk / animalProds.length : 0;
    
    const butterfats = animalProds.filter(p => p.butterfat_percentage).map(p => p.butterfat_percentage);
    const avgButterfat = butterfats.length > 0 ? butterfats.reduce((a, b) => a + b, 0) / butterfats.length : 0;
    
    return { totalMilk, avgMilk, avgButterfat, recordCount: animalProds.length };
  };

  const familiesWithData = Object.values(familyGroups)
    .filter(family => family.offspring.length > 0)
    .map(family => {
      const motherStats = calculateStats(family.mother.id);
      const offspringStats = family.offspring.map(offspring => ({
        animal: offspring,
        stats: calculateStats(offspring.id)
      }));
      
      return {
        mother: family.mother,
        motherStats,
        offspringStats
      };
    })
    .filter(family => family.motherStats.recordCount > 0 || family.offspringStats.some(o => o.stats.recordCount > 0));

  if (familiesWithData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">No lineage data available. Add parent information to livestock to see family production comparisons.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Lineage Production Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {familiesWithData.map((family, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {family.mother.name_or_tag}
                  <Badge variant="outline">Mother</Badge>
                </h3>
                {family.motherStats.recordCount > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-gray-600">Total Milk</p>
                      <p className="font-semibold">{family.motherStats.totalMilk.toFixed(1)} lbs</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Per Milking</p>
                      <p className="font-semibold">{family.motherStats.avgMilk.toFixed(1)} lbs</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Butterfat</p>
                      <p className="font-semibold">
                        {family.motherStats.avgButterfat > 0 ? `${family.motherStats.avgButterfat.toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Offspring Performance:</h4>
                {family.offspringStats.map((offspring, oIdx) => (
                  <div key={oIdx} className="bg-white border rounded-lg p-3">
                    <p className="font-medium mb-2">{offspring.animal.name_or_tag}</p>
                    {offspring.stats.recordCount > 0 ? (
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-semibold">{offspring.stats.totalMilk.toFixed(1)} lbs</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg/Milking</p>
                          <p className="font-semibold">{offspring.stats.avgMilk.toFixed(1)} lbs</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Butterfat</p>
                          <p className="font-semibold">
                            {offspring.stats.avgButterfat > 0 ? `${offspring.stats.avgButterfat.toFixed(2)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No production data yet</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}