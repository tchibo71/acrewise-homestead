import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, format } from "date-fns";
import { GESTATION_PERIODS } from "./gestationPeriods";

export default function AddBreedingModal({ animal, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    dam_id: animal.gender === 'female' ? animal.id : "",
    dam_external_name: animal.gender === 'female' ? "" : "",
    sire_id: animal.gender === 'male' ? animal.id : "",
    sire_external_name: animal.gender === 'male' ? "" : "",
    breeding_date: format(new Date(), 'yyyy-MM-dd'),
    breeding_type: "natural",
    pregnancy_confirmed: false,
    confirmation_date: "",
    confirmation_method: "observation",
    notes: ""
  });

  const { data: allAnimals = [] } = useQuery({
    queryKey: ['all-livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  // Filter for available dams and sires
  const availableDams = allAnimals.filter(a => 
    a.gender === 'female' && 
    a.animal_type === animal.animal_type &&
    a.status === 'active' &&
    a.id !== animal.id
  );

  const availableSires = allAnimals.filter(a => 
    a.gender === 'male' && 
    a.animal_type === animal.animal_type &&
    a.status === 'active' &&
    a.id !== animal.id
  );

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Calculate gestation dates with fallback for unknown animal types
      const gestationInfo = GESTATION_PERIODS[animal.animal_type] || GESTATION_PERIODS.other;
      const breedDate = new Date(data.breeding_date);
      
      const dueDateEarliest = addDays(breedDate, gestationInfo.min);
      const dueDateAverage = addDays(breedDate, gestationInfo.avg);
      const dueDateLatest = addDays(breedDate, gestationInfo.max);
      
      const breedingData = {
        ...data,
        expected_due_date_earliest: format(dueDateEarliest, 'yyyy-MM-dd'),
        expected_due_date_average: format(dueDateAverage, 'yyyy-MM-dd'),
        expected_due_date_latest: format(dueDateLatest, 'yyyy-MM-dd'),
        gestation_period_days: gestationInfo.avg
      };
      
      return await base44.entities.Breeding.create(breedingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breedings'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  // Get gestation info with fallback
  const gestationInfo = GESTATION_PERIODS[animal.animal_type] || GESTATION_PERIODS.other;
  const breedDate = new Date(formData.breeding_date);
  const calculatedDueDate = addDays(breedDate, gestationInfo.avg);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Breeding - {animal.name_or_tag}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Dam Selection */}
            {animal.gender !== 'female' && (
              <div className="space-y-3">
                <div>
                  <Label>Select Dam (Mother) from System</Label>
                  <Select
                    value={formData.dam_id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({...formData, dam_id: ""});
                      } else {
                        setFormData({...formData, dam_id: value, dam_external_name: ""});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose female..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- External Dam --</SelectItem>
                      {availableDams.length === 0 ? (
                        <SelectItem value="no_dams" disabled>No eligible females found</SelectItem>
                      ) : (
                        availableDams.map(dam => (
                          <SelectItem key={dam.id} value={dam.id}>
                            {dam.name_or_tag} {dam.breed && `(${dam.breed})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Or Enter External Dam Name</Label>
                  <Input
                    value={formData.dam_external_name}
                    onChange={(e) => setFormData({...formData, dam_external_name: e.target.value, dam_id: e.target.value ? "" : formData.dam_id})}
                    placeholder="e.g., Daisy from Smith Farm"
                    disabled={!!formData.dam_id}
                  />
                  {formData.dam_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Select "External Dam" to enter name
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sire Selection */}
            {animal.gender !== 'male' && (
              <div className="space-y-3">
                <div>
                  <Label>Select Sire (Father) from System</Label>
                  <Select
                    value={formData.sire_id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({...formData, sire_id: ""});
                      } else {
                        setFormData({...formData, sire_id: value, sire_external_name: ""});
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose male..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- External Sire --</SelectItem>
                      {availableSires.length === 0 ? (
                        <SelectItem value="no_sires" disabled>No eligible males found</SelectItem>
                      ) : (
                        availableSires.map(sire => (
                          <SelectItem key={sire.id} value={sire.id}>
                            {sire.name_or_tag} {sire.breed && `(${sire.breed})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Or Enter External Sire Name</Label>
                  <Input
                    value={formData.sire_external_name}
                    onChange={(e) => setFormData({...formData, sire_external_name: e.target.value, sire_id: e.target.value ? "" : formData.sire_id})}
                    placeholder="e.g., Buck from neighbor's farm"
                    disabled={!!formData.sire_id}
                  />
                  {formData.sire_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Select "External Sire" to enter name
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Breeding Date *</Label>
              <Input
                type="date"
                value={formData.breeding_date}
                onChange={(e) => setFormData({...formData, breeding_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Breeding Type</Label>
              <Select
                value={formData.breeding_type}
                onValueChange={(value) => setFormData({...formData, breeding_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="artificial_insemination">Artificial Insemination</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gestation Calculator Display */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-semibold text-blue-900 mb-2">Calculated Due Dates ({gestationInfo.name})</div>
            <div className="space-y-1 text-sm">
              <div className="text-blue-800">
                Gestation Period: {gestationInfo.min}-{gestationInfo.max} days (Average: {gestationInfo.avg})
              </div>
              <div className="text-blue-800">
                <span className="font-semibold">Earliest:</span> {format(addDays(breedDate, gestationInfo.min), 'MMMM d, yyyy')}
              </div>
              <div className="text-blue-800">
                <span className="font-semibold">Expected:</span> {format(calculatedDueDate, 'MMMM d, yyyy')}
              </div>
              <div className="text-blue-800">
                <span className="font-semibold">Latest:</span> {format(addDays(breedDate, gestationInfo.max), 'MMMM d, yyyy')}
              </div>
            </div>
          </div>

          {/* Pregnancy Confirmation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.pregnancy_confirmed}
                onCheckedChange={(checked) => setFormData({...formData, pregnancy_confirmed: checked})}
              />
              <Label>Pregnancy Confirmed</Label>
            </div>

            {formData.pregnancy_confirmed && (
              <div className="grid md:grid-cols-2 gap-4 ml-6">
                <div className="space-y-2">
                  <Label>Confirmation Date</Label>
                  <Input
                    type="date"
                    value={formData.confirmation_date}
                    onChange={(e) => setFormData({...formData, confirmation_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirmation Method</Label>
                  <Select
                    value={formData.confirmation_method}
                    onValueChange={(value) => setFormData({...formData, confirmation_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="palpation">Palpation</SelectItem>
                      <SelectItem value="ultrasound">Ultrasound</SelectItem>
                      <SelectItem value="blood_test">Blood Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional information about this breeding..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {createMutation.isPending ? "Recording..." : "Record Breeding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}