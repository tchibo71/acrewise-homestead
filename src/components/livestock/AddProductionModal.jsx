import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { saveDraft, isOnline } from "@/components/utils/offlineStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, WifiOff } from "lucide-react";

export default function AddProductionModal({ livestockId, onClose }) {
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState("");
  
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    production_type: "eggs",
    livestock_id: livestockId || "",
    production_date: new Date().toISOString().split('T')[0],
    quantity: "",
    unit: "dozen",
    quality_grade: "good",
    notes: ""
  });

  // Fetch livestock for validation and selection
  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.filter({ status: 'active' }),
  });

  // Map production types to valid animal types
  const productionAnimalMap = {
    eggs: ['chicken', 'duck', 'turkey', 'other'],
    milk: ['goat', 'sheep', 'cow', 'other'],
    honey: ['bee_hive'],
    fiber: ['sheep', 'goat', 'rabbit', 'other'],
    meat: ['chicken', 'goat', 'sheep', 'pig', 'cow', 'rabbit', 'duck', 'turkey', 'other'],
    other: ['chicken', 'goat', 'sheep', 'pig', 'cow', 'rabbit', 'duck', 'turkey', 'bee_hive', 'other']
  };

  const validLivestockForType = livestock.filter(l => 
    productionAnimalMap[formData.production_type]?.includes(l.animal_type)
  );

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Production.create({
      ...data,
      quantity: parseFloat(data.quantity)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', livestockId] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    const quantity = parseFloat(formData.quantity);

    // Validate quantity is numerical and positive
    if (isNaN(quantity) || quantity <= 0) {
      setValidationError("Quantity must be a valid number greater than zero.");
      return;
    }

    // Validate livestock is linked for production types that require it
    if (!formData.livestock_id) {
      setValidationError(`Please select a ${formData.production_type === 'eggs' ? 'chicken/duck' : formData.production_type === 'milk' ? 'dairy animal' : 'livestock'} to link this production record.`);
      return;
    }

    // Validate the selected livestock is appropriate for the production type
    const selectedAnimal = livestock.find(l => l.id === formData.livestock_id);
    if (selectedAnimal && !productionAnimalMap[formData.production_type]?.includes(selectedAnimal.animal_type)) {
      setValidationError(`Cannot log ${formData.production_type} production for a ${selectedAnimal.animal_type}. Please select an appropriate animal.`);
      return;
    }

    // Check if online
    if (!isOnline()) {
      try {
        await saveDraft('production', formData, currentUser?.email);
        alert("📱 Offline: Production record saved as draft. Will sync when online.");
        onClose();
      } catch (error) {
        alert("Failed to save draft offline");
      }
      return;
    }

    mutation.mutate(formData);
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft('production', formData, currentUser?.email);
      alert("✅ Draft saved! Will sync when online.");
      onClose();
    } catch (error) {
      alert("Failed to save draft");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Production Record</DialogTitle>
        </DialogHeader>

        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isOnline() && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800 font-medium">
                Offline Mode - Will save as draft
              </p>
            </div>
          )}

          <div>
            <Label>Production Type *</Label>
            <Select
              value={formData.production_type}
              onValueChange={(value) => setFormData({...formData, production_type: value, livestock_id: ""})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eggs">Eggs</SelectItem>
                <SelectItem value="milk">Milk</SelectItem>
                <SelectItem value="honey">Honey</SelectItem>
                <SelectItem value="fiber">Fiber</SelectItem>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Linked Livestock *</Label>
            <Select
              value={formData.livestock_id}
              onValueChange={(value) => setFormData({...formData, livestock_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select animal/group..." />
              </SelectTrigger>
              <SelectContent>
                {validLivestockForType.length === 0 ? (
                  <SelectItem value={null} disabled>No matching livestock found</SelectItem>
                ) : (
                  validLivestockForType.map(animal => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name_or_tag} ({animal.animal_type})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {validLivestockForType.length === 0 && (
              <p className="text-xs text-orange-600 mt-1">
                No {formData.production_type === 'eggs' ? 'chickens/ducks' : formData.production_type === 'milk' ? 'dairy animals' : 'suitable livestock'} found. Add livestock first.
              </p>
            )}
          </div>

          <div>
            <Label>Production Date *</Label>
            <Input
              type="date"
              value={formData.production_date}
              onChange={(e) => setFormData({...formData, production_date: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity *</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Unit *</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="dozen, lbs, gallons..."
                required
              />
            </div>
          </div>

          <div>
            <Label>Quality Grade</Label>
            <Select
              value={formData.quality_grade}
              onValueChange={(value) => setFormData({...formData, quality_grade: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Adding..." : "Add Record"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}