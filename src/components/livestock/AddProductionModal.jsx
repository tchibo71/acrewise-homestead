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
  const [saveToPantry, setSaveToPantry] = useState(false);
  const [pantryData, setPantryData] = useState({
    category: "",
    preservation_method: "",
    storage_location: "",
    best_by_date: "",
  });

  const mapPantryUnit = (unit) => {
    const u = (unit || "").toLowerCase();
    if (["jars", "lbs", "gallons", "quarts", "pints", "bags"].includes(u)) return u;
    return "other";
  };

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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['production', livestockId] });
      if (saveToPantry) {
        try {
          await base44.entities.StoredFood.create({
            food_name: formData.production_type,
            category: pantryData.category || "fresh",
            quantity: parseFloat(formData.quantity),
            unit: mapPantryUnit(formData.unit),
            production_date: formData.production_date,
            preservation_method: pantryData.preservation_method || null,
            best_by_date: pantryData.best_by_date || null,
            storage_location: pantryData.storage_location || null,
            source: "own livestock",
          });
          queryClient.invalidateQueries({ queryKey: ['stored-foods'] });
        } catch (e) { /* non-fatal */ }
      }
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

          <div className="border border-orange-200 rounded-lg p-4 space-y-3 bg-orange-50/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToPantry}
                onChange={(e) => setSaveToPantry(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                🍎 Save to Pantry as stored food (preserved, not sold fresh)
              </span>
            </label>
            {saveToPantry && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <Label>Pantry Category</Label>
                  <Select
                    value={pantryData.category}
                    onValueChange={(v) => setPantryData({ ...pantryData, category: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canned">Canned</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                      <SelectItem value="dried">Dried</SelectItem>
                      <SelectItem value="fermented">Fermented</SelectItem>
                      <SelectItem value="root_cellar">Root Cellar</SelectItem>
                      <SelectItem value="fresh">Fresh</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Best By Date</Label>
                  <Input
                    type="date"
                    value={pantryData.best_by_date}
                    onChange={(e) => setPantryData({ ...pantryData, best_by_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Preservation Method</Label>
                  <Input
                    value={pantryData.preservation_method}
                    onChange={(e) => setPantryData({ ...pantryData, preservation_method: e.target.value })}
                    placeholder="e.g. Freezing, Canning"
                  />
                </div>
                <div>
                  <Label>Storage Location</Label>
                  <Input
                    value={pantryData.storage_location}
                    onChange={(e) => setPantryData({ ...pantryData, storage_location: e.target.value })}
                    placeholder="e.g. Freezer, Pantry"
                  />
                </div>
              </div>
            )}
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