
import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, AlertCircle, CheckCircle2, Heart, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

import AddBreedingModal from "./AddBreedingModal";
import PrintButton from "./PrintButton";
import PrintableBreedingReport from "./PrintableBreedingReport";

export default function BreedingManager({ animal }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const printableReportRef = useRef(null);

  const { data: breedings = [] } = useQuery({
    queryKey: ['breedings', animal.id],
    queryFn: async () => {
      const all = await base44.entities.Breeding.list('-breeding_date');
      return all.filter(b => b.dam_id === animal.id || b.sire_id === animal.id);
    },
  });

  const { data: allAnimals = [] } = useQuery({
    queryKey: ['all-livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const activeBreedings = breedings.filter(b => !b.actual_birth_date);
  const completedBreedings = breedings.filter(b => b.actual_birth_date);

  const getAnimalName = (id, externalName) => {
    if (externalName) return externalName;
    if (!id) return "Unknown";
    const animal = allAnimals.find(a => a.id === id);
    return animal?.name_or_tag || "Unknown";
  };

  const getDaysUntilDue = (dueDate) => {
    const days = Math.floor((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handlePrint = () => {
    setShowPrintReport(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrintReport(false), 100);
    }, 100);
  };

  const handleDownload = () => {
    setShowPrintReport(true);
    setTimeout(() => {
      if (printableReportRef.current) {
        const htmlContent = printableReportRef.current.innerHTML;
        const blob = new Blob([`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Breeding Report for ${animal.name_or_tag}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { border-collapse: collapse; width: 100%; margin: 16px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `], { type: 'text/html' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `breeding-report-${animal.name_or_tag}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setShowPrintReport(false);
    }, 50);
  };

  return (
    <>
      {showPrintReport && (
        <div ref={printableReportRef} className="printable-content">
          <PrintableBreedingReport
            animal={animal}
            breedings={breedings}
            allAnimals={allAnimals}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Breeding & Gestation
            </CardTitle>
            <div className="flex gap-2 no-print">
              <PrintButton
                onPrint={handlePrint}
                onDownload={handleDownload}
              />
              {animal.gender === 'female' && (
                <Button onClick={() => setShowAddModal(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Record Breeding
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 no-print">
          {/* Active Pregnancies */}
          {activeBreedings.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Active Pregnancies ({activeBreedings.length})
              </h3>
              <div className="space-y-4">
                {activeBreedings.map(breeding => {
                  const daysUntil = getDaysUntilDue(breeding.expected_due_date_average);
                  const isOverdue = daysUntil < 0;
                  const isDueSoon = daysUntil >= 0 && daysUntil <= 7;

                  const damName = getAnimalName(breeding.dam_id, breeding.dam_external_name);
                  const sireName = getAnimalName(breeding.sire_id, breeding.sire_external_name);
                  const partnerName = animal.gender === 'female' ? sireName : damName;
                  const isExternal = animal.gender === 'female' ?
                    !!breeding.sire_external_name : !!breeding.dam_external_name;

                  return (
                    <Card key={breeding.id} className={`border-l-4 ${isOverdue ? 'border-l-red-500' : isDueSoon ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">
                                {animal.gender === 'female' ? 'Bred to:' : 'Dam:'} {partnerName}
                              </span>
                              {isExternal && (
                                <Badge variant="outline" className="ml-2 text-xs">External</Badge>
                              )}
                            </div>
                            {breeding.pregnancy_confirmed && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Confirmed
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-gray-600">
                            <div>Breeding Date: {format(new Date(breeding.breeding_date), 'MMM d, yyyy')}</div>
                            <div className="font-semibold text-gray-900 mt-1">
                              Expected Due Date: {format(new Date(breeding.expected_due_date_average), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              Range: {format(new Date(breeding.expected_due_date_earliest), 'MMM d')} - {format(new Date(breeding.expected_due_date_latest), 'MMM d')}
                            </div>
                          </div>

                          <div className="mt-3">
                            {isOverdue ? (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Overdue by {Math.abs(daysUntil)} days
                              </Badge>
                            ) : isDueSoon ? (
                              <Badge className="bg-orange-100 text-orange-800">
                                <Calendar className="w-3 h-3 mr-1" />
                                Due in {daysUntil} days
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                {daysUntil} days until due
                              </Badge>
                            )}
                          </div>

                          {breeding.notes && (
                            <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                              {breeding.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Breedings */}
          {completedBreedings.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Breeding History ({completedBreedings.length})</h3>
              <div className="space-y-3">
                {completedBreedings.slice(0, 5).map(breeding => {
                  const damName = getAnimalName(breeding.dam_id, breeding.dam_external_name);
                  const sireName = getAnimalName(breeding.sire_id, breeding.sire_external_name);
                  const partnerName = animal.gender === 'female' ? sireName : damName;
                  const isExternal = animal.gender === 'female' ?
                    !!breeding.sire_external_name : !!breeding.dam_external_name;

                  return (
                    <div key={breeding.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{partnerName}</span>
                          {isExternal && (
                            <Badge variant="outline" className="text-xs">External</Badge>
                          )}
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {breeding.number_born || 0} offspring
                        </Badge>
                      </div>
                      <div className="text-gray-600">
                        Bred: {format(new Date(breeding.breeding_date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-gray-600">
                        Born: {format(new Date(breeding.actual_birth_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {breedings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>No breeding records yet</p>
              {/* Always show Record First Breeding button */}
              {animal.gender === 'female' && (
                <Button onClick={() => setShowAddModal(true)} className="mt-3" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Record First Breeding
                </Button>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {showAddModal && (
        <AddBreedingModal
          animal={animal}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
