import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AddCropPlanModal({ crop, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    crop_name: "",
    variety: "",
    year: new Date().getFullYear(),
    planting_date: "",
    harvest_date: "",
    location: "",
    acreage: 0,
    previous_crop: "",
    planned_next_crop: "",
    seed_source: "",
    seed_cost: 0,
    expected_yield: 0,
    actual_yield: 0,
    yield_unit: "lbs",
    fertilizer_plan: "",
    pest_management_plan: "",
    irrigation_needs: "",
    notes: ""
  });

  useEffect(() => {
    if (crop) {
      setFormData(crop);
    }
  }, [crop]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (crop) {
        return base44.entities.CropPlan.update(crop.id, data);
      }
      return base44.entities.CropPlan.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crop-plans'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{crop ? "Edit Crop Plan" : "Add Crop Plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Crop Name *</Label>
              <Input
                value={formData.crop_name}
                onChange={(e) => setFormData({...formData, crop_name: e.target.value})}
                required
                placeholder="e.g., Tomatoes"
              />
            </div>

            <div>
              <Label>Variety</Label>
              <Input
                value={formData.variety}
                onChange={(e) => setFormData({...formData, variety: e.target.value})}
                placeholder="e.g., Cherokee Purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Year *</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                required
              />
            </div>

            <div>
              <Label>Planting Date</Label>
              <Input
                type="date"
                value={formData.planting_date}
                onChange={(e) => setFormData({...formData, planting_date: e.target.value})}
              />
            </div>

            <div>
              <Label>Harvest Date</Label>
              <Input
                type="date"
                value={formData.harvest_date}
                onChange={(e) => setFormData({...formData, harvest_date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Field or plot name"
              />
            </div>

            <div>
              <Label>Acreage</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.acreage}
                onChange={(e) => setFormData({...formData, acreage: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Previous Crop</Label>
              <Input
                value={formData.previous_crop}
                onChange={(e) => setFormData({...formData, previous_crop: e.target.value})}
                placeholder="For rotation tracking"
              />
            </div>

            <div>
              <Label>Planned Next Crop</Label>
              <Input
                value={formData.planned_next_crop}
                onChange={(e) => setFormData({...formData, planned_next_crop: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Seed Source</Label>
              <Input
                value={formData.seed_source}
                onChange={(e) => setFormData({...formData, seed_source: e.target.value})}
              />
            </div>

            <div>
              <Label>Seed Cost ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.seed_cost}
                onChange={(e) => setFormData({...formData, seed_cost: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Expected Yield</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.expected_yield}
                onChange={(e) => setFormData({...formData, expected_yield: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Actual Yield</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.actual_yield}
                onChange={(e) => setFormData({...formData, actual_yield: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Unit</Label>
              <Input
                value={formData.yield_unit}
                onChange={(e) => setFormData({...formData, yield_unit: e.target.value})}
                placeholder="lbs, bushels, etc"
              />
            </div>
          </div>

          <div>
            <Label>Fertilizer Plan</Label>
            <Textarea
              value={formData.fertilizer_plan}
              onChange={(e) => setFormData({...formData, fertilizer_plan: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>Pest Management Plan</Label>
            <Textarea
              value={formData.pest_management_plan}
              onChange={(e) => setFormData({...formData, pest_management_plan: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>Irrigation Needs</Label>
            <Textarea
              value={formData.irrigation_needs}
              onChange={(e) => setFormData({...formData, irrigation_needs: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : crop ? "Update Crop Plan" : "Add Crop Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}