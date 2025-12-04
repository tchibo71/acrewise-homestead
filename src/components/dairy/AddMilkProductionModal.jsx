import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AddMilkProductionModal({ livestock, onClose }) {
  const queryClient = useQueryClient();
  const [unit, setUnit] = useState("lbs");
  const [formData, setFormData] = useState({
    livestock_id: livestock[0]?.id || "",
    production_date: new Date().toISOString().split('T')[0],
    milking_session: "am",
    milk_amount: "",
    butterfat_percentage: "",
    protein_percentage: "",
    somatic_cell_count: "",
    a2a2_status: "unknown",
    lactation_day: "",
    lactation_number: "",
    temperature: "",
    quality_grade: "good",
    milker_name: "",
    notes: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      const amount = parseFloat(submitData.milk_amount);
      
      // Store both lbs and gallons based on what user entered
      if (unit === "lbs") {
        submitData.milk_weight_lbs = amount;
        submitData.milk_weight_gallons = parseFloat((amount / 8.6).toFixed(2));
      } else {
        submitData.milk_weight_gallons = amount;
        submitData.milk_weight_lbs = parseFloat((amount * 8.6).toFixed(2));
      }
      
      submitData.unit_entered = unit;
      delete submitData.milk_amount;
      
      if (submitData.butterfat_percentage) submitData.butterfat_percentage = parseFloat(submitData.butterfat_percentage);
      if (submitData.protein_percentage) submitData.protein_percentage = parseFloat(submitData.protein_percentage);
      if (submitData.somatic_cell_count) submitData.somatic_cell_count = parseFloat(submitData.somatic_cell_count);
      if (submitData.lactation_day) submitData.lactation_day = parseInt(submitData.lactation_day);
      if (submitData.lactation_number) submitData.lactation_number = parseInt(submitData.lactation_number);
      if (submitData.temperature) submitData.temperature = parseFloat(submitData.temperature);
      
      return base44.entities.MilkProduction.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-production'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Log Milk Production</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Animal *</Label>
              <Select
                value={formData.livestock_id}
                onValueChange={(value) => setFormData({...formData, livestock_id: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {livestock.map(animal => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name_or_tag} {animal.breed && `(${animal.breed})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({...formData, production_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Milking Session *</Label>
              <Select
                value={formData.milking_session}
                onValueChange={(value) => setFormData({...formData, milking_session: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="am">AM (Morning)</SelectItem>
                  <SelectItem value="pm">PM (Evening)</SelectItem>
                  <SelectItem value="midday">Midday</SelectItem>
                  <SelectItem value="full_day">Full Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Milk Amount *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.milk_amount}
                  onChange={(e) => setFormData({...formData, milk_amount: e.target.value})}
                  placeholder={unit === "lbs" ? "e.g., 45.5" : "e.g., 5.3"}
                  required
                  className="flex-1"
                />
                <Tabs value={unit} onValueChange={setUnit}>
                  <TabsList>
                    <TabsTrigger value="lbs">lbs</TabsTrigger>
                    <TabsTrigger value="gallons">gal</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {unit === "lbs" && formData.milk_amount && `≈ ${(parseFloat(formData.milk_amount) / 8.6).toFixed(2)} gallons`}
                {unit === "gallons" && formData.milk_amount && `≈ ${(parseFloat(formData.milk_amount) * 8.6).toFixed(2)} lbs`}
              </p>
            </div>
          </div>

          {/* Quality Metrics */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Quality Metrics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Butterfat %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.butterfat_percentage}
                  onChange={(e) => setFormData({...formData, butterfat_percentage: e.target.value})}
                  placeholder="e.g., 4.5"
                />
              </div>

              <div>
                <Label>Protein %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.protein_percentage}
                  onChange={(e) => setFormData({...formData, protein_percentage: e.target.value})}
                  placeholder="e.g., 3.2"
                />
              </div>

              <div>
                <Label>Somatic Cell Count</Label>
                <Input
                  type="number"
                  value={formData.somatic_cell_count}
                  onChange={(e) => setFormData({...formData, somatic_cell_count: e.target.value})}
                  placeholder="e.g., 150000"
                />
              </div>

              <div>
                <Label>A2A2 Status</Label>
                <Select
                  value={formData.a2a2_status}
                  onValueChange={(value) => setFormData({...formData, a2a2_status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A2A2">A2A2</SelectItem>
                    <SelectItem value="A1A2">A1A2</SelectItem>
                    <SelectItem value="A1A1">A1A1</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Temperature (°F)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                  placeholder="e.g., 38.5"
                />
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
            </div>
          </div>

          {/* Lactation Info */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Lactation Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Days in Milk (DIM)</Label>
                <Input
                  type="number"
                  value={formData.lactation_day}
                  onChange={(e) => setFormData({...formData, lactation_day: e.target.value})}
                  placeholder="e.g., 120"
                />
              </div>

              <div>
                <Label>Lactation Number</Label>
                <Input
                  type="number"
                  value={formData.lactation_number}
                  onChange={(e) => setFormData({...formData, lactation_number: e.target.value})}
                  placeholder="e.g., 2"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Milker Name</Label>
              <Input
                value={formData.milker_name}
                onChange={(e) => setFormData({...formData, milker_name: e.target.value})}
                placeholder="Who performed milking"
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Any observations or health concerns..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Log Production"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}