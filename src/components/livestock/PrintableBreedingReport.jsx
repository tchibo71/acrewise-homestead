
import React from "react";
import { format } from "date-fns";
import { GESTATION_PERIODS } from "./gestationPeriods";
import PrintButton from "../utils/PrintButton"; // Assuming this path is correct
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Assuming shadcn/ui components
import { Baby } from "lucide-react"; // Assuming lucide-react for icons

export default function PrintableBreedingReport({ breedings, livestock }) {
  // Helpers adapted to use 'livestock' instead of 'allAnimals'
  const getAnimalName = (id, externalName) => {
    if (externalName) return externalName;
    if (!id) return "Unknown";
    const animal = livestock.find(a => a.id === id);
    return animal?.name_or_tag || "Unknown";
  };

  const getAnimalBreed = (id) => {
    if (!id) return "";
    const animal = livestock.find(a => a.id === id);
    return animal?.breed || "";
  };

  // Prepare data for the generic PrintButton
  const reportData = {
    title: "Breeding Records Report",
    subtitle: `Homestead Acres Livestock Breeding Report - ${format(new Date(), 'MMMM d, yyyy')}`,
    fileName: "homestead-acres-breeding-report",
    columns: [
      { key: 'dam_name', label: 'Dam' },
      { key: 'sire_name', label: 'Sire' },
      { key: 'breeding_date', label: 'Breeding Date', format: (val) => format(new Date(val), 'MM/dd/yyyy') },
      { key: 'expected_due_date_average', label: 'Expected Due', format: (val) => val ? format(new Date(val), 'MM/dd/yyyy') : 'N/A' },
      { key: 'actual_birth_date', label: 'Birth Date', format: (val) => val ? format(new Date(val), 'MM/dd/yyyy') : 'Pending' },
      { key: 'number_born', label: 'Offspring', format: (val) => val || 'Pending' }
    ],
    data: breedings.map(b => {
      const dam = livestock.find(l => l.id === b.dam_id);
      const sire = livestock.find(l => l.id === b.sire_id);
      return {
        ...b,
        dam_name: dam?.name_or_tag || b.dam_external_name || 'Unknown',
        sire_name: sire?.name_or_tag || b.sire_external_name || 'Unknown'
      };
    })
  };

  // As the `animal` prop was removed, the original "Animal Information"
  // and "Gestation Information" sections cannot be rendered directly.
  // This report now focuses on the list of breedings.
  // The breeding history sections are preserved and adapted to use 'livestock'.

  // Find the primary animal for the report based on breedings, if possible.
  // This is an assumption to try and preserve some context, though not explicitly in outline.
  // If a breeding exists, use the dam or sire. Otherwise, the report is purely a list.
  const primaryAnimalId = breedings.length > 0 ? (breedings[0].dam_id || breedings[0].sire_id) : null;
  const primaryAnimal = primaryAnimalId ? livestock.find(a => a.id === primaryAnimalId) : null;
  const gestationInfo = primaryAnimal ? (GESTATION_PERIODS[primaryAnimal.animal_type] || GESTATION_PERIODS.other) : null;

  return (
    <Card className="p-0 border-none shadow-none"> {/* Minimal styling for the Card wrapper */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Baby className="w-5 h-5 text-gray-700" />
          Breeding Records Report
        </CardTitle>
        <PrintButton reportData={reportData} variant="outline" size="sm" />
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 text-sm text-gray-600">
          <p>Generated: {format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
        </div>

        {/* Display primary animal info if determined */}
        {primaryAnimal && (
            <div className="mb-6 bg-gray-50 p-4 rounded">
                <h2 className="text-xl font-bold mb-3">Report for: {primaryAnimal.name_or_tag}</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Type:</p>
                        <p className="font-semibold capitalize">{primaryAnimal.animal_type.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Breed:</p>
                        <p className="font-semibold">{primaryAnimal.breed || "Not specified"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Gender:</p>
                        <p className="font-semibold capitalize">{primaryAnimal.gender}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Gestation Information - now tied to primary animal if found */}
        {gestationInfo && (
            <div className="mb-6 bg-blue-50 p-4 rounded">
                <h2 className="text-xl font-bold mb-3">Gestation Information - {gestationInfo.name}</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Minimum Days:</p>
                        <p className="font-semibold">{gestationInfo.min} days</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Average Days:</p>
                        <p className="font-semibold">{gestationInfo.avg} days</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Maximum Days:</p>
                        <p className="font-semibold">{gestationInfo.max} days</p>
                    </div>
                </div>
            </div>
        )}


        {/* Active Pregnancies */}
        {breedings.filter(b => !b.actual_birth_date).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-orange-700">Active Pregnancies</h2>
            {breedings.filter(b => !b.actual_birth_date).map((breeding, idx) => {
              const damName = getAnimalName(breeding.dam_id, breeding.dam_external_name);
              const sireName = getAnimalName(breeding.sire_id, breeding.sire_external_name);
              const damBreed = getAnimalBreed(breeding.dam_id);
              const sireBreed = getAnimalBreed(breeding.sire_id);
              
              return (
                <div key={breeding.id} className="mb-6 border border-gray-300 p-4 rounded break-inside-avoid">
                  <h3 className="font-bold text-lg mb-3">Pregnancy #{idx + 1}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Dam (Mother):</p>
                      <p className="font-semibold">{damName}</p>
                      {damBreed && <p className="text-sm text-gray-600">{damBreed}</p>}
                      {breeding.dam_external_name && (
                        <p className="text-xs text-gray-500 italic">External animal</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sire (Father):</p>
                      <p className="font-semibold">{sireName}</p>
                      {sireBreed && <p className="text-sm text-gray-600">{sireBreed}</p>}
                      {breeding.sire_external_name && (
                        <p className="text-xs text-gray-500 italic">External animal</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Breeding Date:</p>
                      <p className="font-semibold">{format(new Date(breeding.breeding_date), 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Breeding Type:</p>
                      <p className="font-semibold capitalize">{breeding.breeding_type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded mb-4">
                    <p className="font-bold text-blue-900 mb-2">Expected Due Dates:</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Earliest:</p>
                        <p className="font-semibold">{format(new Date(breeding.expected_due_date_earliest), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Expected:</p>
                        <p className="font-semibold text-blue-700">{format(new Date(breeding.expected_due_date_average), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Latest:</p>
                        <p className="font-semibold">{format(new Date(breeding.expected_due_date_latest), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {breeding.pregnancy_confirmed && (
                    <div className="bg-green-50 p-3 rounded mb-4">
                      <p className="font-bold text-green-900">Pregnancy Confirmed ✓</p>
                      {breeding.confirmation_date && (
                        <p className="text-sm text-gray-700">Date: {format(new Date(breeding.confirmation_date), 'MMMM d, yyyy')}</p>
                      )}
                      {breeding.confirmation_method && (
                        <p className="text-sm text-gray-700">Method: {breeding.confirmation_method.replace(/_/g, ' ')}</p>
                      )}
                    </div>
                  )}

                  {breeding.notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 font-semibold">Notes:</p>
                      <p className="text-sm text-gray-700">{breeding.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Breeding History */}
        {breedings.filter(b => b.actual_birth_date).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Breeding History</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Breeding Date</th>
                  <th className="border border-gray-300 p-2 text-left">Dam/Sire</th>
                  <th className="border border-gray-300 p-2 text-left">Birth Date</th>
                  <th className="border border-gray-300 p-2 text-left">Offspring</th>
                  <th className="border border-gray-300 p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {breedings.filter(b => b.actual_birth_date).map(breeding => {
                  // Determine the "partner" animal for display in this row.
                  // If primaryAnimal is defined and is the dam, show the sire. If it's the sire, show the dam.
                  // Otherwise, if no primary animal, just show Dam's name (assuming the report is focused on dams if no specific animal is selected).
                  let partnerName = 'N/A';
                  if (primaryAnimal && primaryAnimal.id === breeding.dam_id) {
                      partnerName = getAnimalName(breeding.sire_id, breeding.sire_external_name);
                  } else if (primaryAnimal && primaryAnimal.id === breeding.sire_id) {
                      partnerName = getAnimalName(breeding.dam_id, breeding.dam_external_name);
                  } else {
                      // Fallback: if no clear primary animal, or it's not involved directly, show dam's name for context.
                      partnerName = getAnimalName(breeding.dam_id, breeding.dam_external_name);
                  }
                  
                  return (
                    <tr key={breeding.id}>
                      <td className="border border-gray-300 p-2">{format(new Date(breeding.breeding_date), 'MMM d, yyyy')}</td>
                      <td className="border border-gray-300 p-2">{partnerName}</td>
                      <td className="border border-gray-300 p-2">{format(new Date(breeding.actual_birth_date), 'MMM d, yyyy')}</td>
                      <td className="border border-gray-300 p-2">{breeding.number_born || 0}</td>
                      <td className="border border-gray-300 p-2 text-sm">{breeding.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-sm text-gray-600">
          <p>Report generated by Homestead Acres</p>
          {primaryAnimal && <p>Primary Animal ID: {primaryAnimal.id}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
