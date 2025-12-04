
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, TrendingUp, Printer } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import PrintableEstrousReport from "./PrintableEstrousReport";
// The import for exportToWord and getComponentHTML is removed as they are not used in this component.

const ESTROUS_CYCLES = {
  goat: { cycle_length: 21, heat_duration: 2, name: "Goat (21 days)" },
  sheep: { cycle_length: 17, heat_duration: 2, name: "Sheep (17 days)" },
  cow: { cycle_length: 21, heat_duration: 1, name: "Cow (21 days)" },
  pig: { cycle_length: 21, heat_duration: 3, name: "Pig (21 days)" },
  rabbit: { cycle_length: 0, heat_duration: 14, name: "Rabbit (induced ovulator)" }
};

export default function EstrousCycleTracker({ animal }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [newCycle, setNewCycle] = useState({
    cycle_start_date: format(new Date(), 'yyyy-MM-dd'),
    cycle_length_days: ESTROUS_CYCLES[animal.animal_type]?.cycle_length || 21,
    heat_duration_days: ESTROUS_CYCLES[animal.animal_type]?.heat_duration || 2,
    notes: ""
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ['estrous-cycles', animal.id],
    queryFn: async () => {
      const all = await base44.entities.EstrousCycle.list('-cycle_start_date');
      return all.filter(c => c.livestock_id === animal.id);
    },
  });

  const createCycleMutation = useMutation({
    mutationFn: async (data) => {
      // Calculate next predicted heat using AI/average cycle length
      const avgCycleLength = data.cycle_length_days;
      const nextHeatDate = addDays(new Date(data.cycle_start_date), avgCycleLength);
      
      return await base44.entities.EstrousCycle.create({
        ...data,
        livestock_id: animal.id,
        next_predicted_heat: format(nextHeatDate, 'yyyy-MM-dd'),
        cycle_type: "observed"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estrous-cycles'] });
      setShowAddForm(false);
      generatePredictions();
    },
  });

  const generatePredictions = async () => {
    if (cycles.length < 2) return;

    // Calculate average cycle length from historical data
    const observedCycles = cycles.filter(c => c.cycle_type === "observed");
    if (observedCycles.length < 2) return;

    const cycleLengths = [];
    for (let i = 0; i < observedCycles.length - 1; i++) {
      const daysBetween = differenceInDays(
        new Date(observedCycles[i].cycle_start_date),
        new Date(observedCycles[i + 1].cycle_start_date)
      );
      cycleLengths.push(daysBetween);
    }

    const avgLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    
    // Generate 3 future predictions
    const lastCycle = observedCycles[0];
    const predictions = [];
    
    for (let i = 1; i <= 3; i++) {
      const predictedDate = addDays(new Date(lastCycle.cycle_start_date), Math.round(avgLength * i));
      predictions.push({
        livestock_id: animal.id,
        cycle_start_date: format(predictedDate, 'yyyy-MM-dd'),
        cycle_length_days: Math.round(avgLength),
        heat_duration_days: lastCycle.heat_duration_days,
        cycle_type: "predicted",
        next_predicted_heat: format(addDays(predictedDate, Math.round(avgLength)), 'yyyy-MM-dd'),
        notes: `AI-predicted based on ${observedCycles.length} previous cycles (avg ${avgLength.toFixed(1)} days)`
      });
    }

    // Delete old predictions and create new ones
    const oldPredictions = cycles.filter(c => c.cycle_type === "predicted");
    for (const pred of oldPredictions) {
      await base44.entities.EstrousCycle.delete(pred.id);
    }
    
    for (const pred of predictions) {
      await base44.entities.EstrousCycle.create(pred);
    }
    
    queryClient.invalidateQueries({ queryKey: ['estrous-cycles'] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCycleMutation.mutate(newCycle);
  };

  const handlePrint = () => {
    setShowPrintReport(true);
    setTimeout(() => {
      window.print();
      // Use another timeout to ensure print dialog appears before hiding the component
      setTimeout(() => setShowPrintReport(false), 100); 
    }, 100); // Give a small delay for the component to render before triggering print
  };

  const observedCycles = cycles.filter(c => c.cycle_type === "observed");
  const predictedCycles = cycles.filter(c => c.cycle_type === "predicted");
  
  // Sort cycles by date descending for accurate "next heat" determination
  const sortedCycles = [...cycles].sort((a, b) => new Date(b.cycle_start_date) - new Date(a.cycle_start_date));
  
  let nextHeat = null;
  if (predictedCycles.length > 0) {
      // Find the earliest predicted heat that is today or in the future
      const futurePredictedHeats = predictedCycles.filter(c => new Date(c.cycle_start_date) >= new Date()).sort((a, b) => new Date(a.cycle_start_date) - new Date(b.cycle_start_date));
      if (futurePredictedHeats.length > 0) {
          nextHeat = futurePredictedHeats[0];
      }
  }

  // If no future predicted heats, or no predicted heats at all, look at observed cycles
  if (!nextHeat && observedCycles.length > 0) {
      const lastObservedHeat = observedCycles[0]; // Assuming observedCycles is already sorted descending
      const potentialNextHeatDate = addDays(new Date(lastObservedHeat.cycle_start_date), lastObservedHeat.cycle_length_days);
      if (potentialNextHeatDate >= new Date()) {
          nextHeat = {
              ...lastObservedHeat,
              cycle_start_date: format(potentialNextHeatDate, 'yyyy-MM-dd'),
              cycle_type: "estimated_from_last_observed" // Custom type for this case
          };
      }
  }

  const daysUntilHeat = nextHeat ? differenceInDays(new Date(nextHeat.cycle_start_date), new Date()) : null;


  if (animal.gender !== 'female') {
    return null;
  }

  return (
    <>
      {showPrintReport && (
        <PrintableEstrousReport
          animal={animal}
          cycles={cycles} // Pass all cycles for comprehensive report
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Estrous Cycle Tracking
            </CardTitle>
            <div className="flex gap-2 no-print">
              {cycles.length > 0 && (
                <Button onClick={handlePrint} size="sm" variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              )}
              <Button onClick={() => setShowAddForm(!showAddForm)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Log Heat Cycle
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 no-print">
          {/* Next Predicted Heat */}
          {nextHeat && daysUntilHeat !== null && (
            <div className={`p-4 rounded-lg border-2 ${daysUntilHeat <= 3 && daysUntilHeat >= 0 ? 'bg-orange-50 border-orange-300' : 'bg-purple-50 border-purple-300'}`}>
              <div className="flex items-start gap-2">
                <TrendingUp className={`w-5 h-5 mt-0.5 ${daysUntilHeat <= 3 && daysUntilHeat >= 0 ? 'text-orange-600' : 'text-purple-600'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {daysUntilHeat > 0 ? `Next Heat in ${daysUntilHeat} days` : daysUntilHeat === 0 ? 'Heat Expected Today!' : `Heat ${Math.abs(daysUntilHeat)} days overdue`}
                  </div>
                  <div className="text-sm text-gray-700">
                    Expected: {format(new Date(nextHeat.cycle_start_date), 'MMMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {nextHeat.cycle_type === "predicted" ? "AI-Predicted" : nextHeat.cycle_type === "estimated_from_last_observed" ? "Estimated from last observed" : "Observed Pattern (next_predicted_heat)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Cycle Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Heat Start Date *</Label>
                  <Input
                    type="date"
                    value={newCycle.cycle_start_date}
                    onChange={(e) => setNewCycle({...newCycle, cycle_start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cycle Length (days)</Label>
                  <Input
                    type="number"
                    value={newCycle.cycle_length_days}
                    onChange={(e) => setNewCycle({...newCycle, cycle_length_days: parseInt(e.target.value)})}
                    placeholder="21"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heat Duration (days)</Label>
                  <Input
                    type="number"
                    value={newCycle.heat_duration_days}
                    onChange={(e) => setNewCycle({...newCycle, heat_duration_days: parseInt(e.target.value)})}
                    placeholder="2"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createCycleMutation.isPending}>
                  {createCycleMutation.isPending ? "Saving..." : "Save Cycle"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Historical Cycles */}
          {observedCycles.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Recent Heat Cycles</h4>
              <div className="space-y-2">
                {observedCycles.slice(0, 5).map(cycle => (
                  <div key={cycle.id} className="p-3 bg-white rounded-lg border text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{format(new Date(cycle.cycle_start_date), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-gray-600">
                          {cycle.cycle_length_days} day cycle, {cycle.heat_duration_days} day heat
                        </div>
                      </div>
                      <Badge variant="outline">Observed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Predictions */}
          {predictedCycles.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                AI-Generated Predictions
              </h4>
              <div className="space-y-2">
                {predictedCycles.map((cycle, idx) => (
                  <div key={cycle.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{format(new Date(cycle.cycle_start_date), 'MMM d, yyyy')}</div>
                        <div className="text-xs text-purple-700">
                          Prediction #{idx + 1}
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">Predicted</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cycles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="mb-2">No cycle data recorded yet</p>
              <p className="text-sm">Start logging heat cycles to enable AI predictions</p>
            </div>
          )}

          {observedCycles.length >= 2 && predictedCycles.length === 0 && (
            <Button onClick={generatePredictions} variant="outline" size="sm" className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate AI Predictions
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
