
import React from "react"; // Removed useRef as it's no longer used
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Removed Download, Printer as they are replaced by PrintButton
import PrintButton from "../utils/PrintButton";
import { format } from 'date-fns'; // Added format from date-fns

export default function AnimalProductionReport({ livestock, productions }) {
  // Removed reportRef as it's no longer used

  const animalStats = livestock.map(animal => {
    const animalProds = productions.filter(p => p.livestock_id === animal.id);
    const totalMilk = animalProds.reduce((sum, p) => sum + (p.milk_weight_lbs || 0), 0);
    const avgMilk = animalProds.length > 0 ? totalMilk / animalProds.length : 0;
    
    const butterfats = animalProds.filter(p => p.butterfat_percentage).map(p => p.butterfat_percentage);
    const avgButterfat = butterfats.length > 0 
      ? butterfats.reduce((a, b) => a + b, 0) / butterfats.length 
      : 0;
    
    const proteins = animalProds.filter(p => p.protein_percentage).map(p => p.protein_percentage);
    const avgProtein = proteins.length > 0 
      ? proteins.reduce((a, b) => a + b, 0) / proteins.length 
      : 0;

    const a2a2Count = animalProds.filter(p => p.a2a2_status === "A2A2").length;
    const a2a2Percent = animalProds.length > 0 ? (a2a2Count / animalProds.length) * 100 : 0;

    return {
      // These keys are for the PrintButton's reportData.data mapping
      name_or_tag: animal.name_or_tag, // Flattened for reportData
      total_production: totalMilk, // Renamed to match reportData column key
      avg_production: avgMilk,     // Renamed to match reportData column key
      avg_butterfat: avgButterfat, // Renamed to match reportData column key
      total_records: animalProds.length, // Renamed to match reportData column key

      // These are for the existing CardContent rendering
      animal, // Original animal object for detailed display
      totalMilk,
      avgMilk,
      avgButterfat,
      avgProtein,
      recordCount: animalProds.length,
      a2a2Percent
    };
  }).sort((a, b) => b.total_production - a.total_production); // Use the new key for sorting

  // Removed handlePrint and handleExportHTML as PrintButton takes over their functionality

  const reportData = {
    title: "Dairy Production by Animal",
    subtitle: `Homestead Acres Dairy Production Report - ${format(new Date(), 'MMMM d, yyyy')}`,
    fileName: "homestead-acres-dairy-production-report",
    columns: [
      { key: 'name_or_tag', label: 'Animal' },
      { key: 'total_production', label: 'Total (lbs)', format: (val) => val.toFixed(1) },
      { key: 'avg_production', label: 'Avg/Milking', format: (val) => val.toFixed(1) },
      { key: 'avg_butterfat', label: 'Avg BF%', format: (val) => val > 0 ? val.toFixed(1) : 'N/A' },
      { key: 'total_records', label: 'Records' }
    ],
    data: animalStats // animalStats now contains the flattened keys needed by PrintButton
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Production by Animal</CardTitle>
          {/* Replaced old print/download buttons with PrintButton */}
          <PrintButton reportData={reportData} variant="outline" size="sm" />
        </div>
      </CardHeader>
      {/* Removed ref={reportRef} as it's no longer used */}
      <CardContent> 
        <div className="space-y-4">
          {animalStats.map((stat, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{stat.animal.name_or_tag}</h3>
                  {stat.animal.breed && (
                    <p className="text-sm text-gray-600">{stat.animal.breed}</p>
                  )}
                </div>
                <Badge variant="outline">{stat.recordCount} records</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Milk</p>
                  <p className="text-lg font-semibold">{stat.totalMilk.toFixed(1)} lbs</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Per Milking</p>
                  <p className="text-lg font-semibold">{stat.avgMilk.toFixed(1)} lbs</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Butterfat</p>
                  <p className="text-lg font-semibold">
                    {stat.avgButterfat > 0 ? `${stat.avgButterfat.toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg Protein</p>
                  <p className="text-lg font-semibold">
                    {stat.avgProtein > 0 ? `${stat.avgProtein.toFixed(2)}%` : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 mb-1">A2A2 Status</p>
                  <p className="text-lg font-semibold">
                    {stat.a2a2Percent > 0 ? `${stat.a2a2Percent.toFixed(0)}%` : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
