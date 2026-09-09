import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";

export default function AddPastureModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    acreage: "",
    location_notes: "",
    rest_period_days: 21,
    notes: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.acreage) {
        submitData.acreage = parseFloat(submitData.acreage);
      } else {
        delete submitData.acreage;
      }
      if (submitData.rest_period_days) {
        submitData.rest_period_days = parseInt(submitData.rest_period_days);
      }
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "") delete submitData[key];
      });
      submitData.status = "resting";
      return base44.entities.Pasture.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastures'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Pasture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Pasture Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., North Field, Back 40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Acreage</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.acreage}
                onChange={(e) => setFormData({ ...formData, acreage: e.target.value })}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label>Rest Period (days)</Label>
              <Input
                type="number"
                value={formData.rest_period_days}
                onChange={(e) => setFormData({ ...formData, rest_period_days: e.target.value })}
                placeholder="21"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location Notes</Label>
            <Input
              value={formData.location_notes}
              onChange={(e) => setFormData({ ...formData, location_notes: e.target.value })}
              placeholder="e.g., North of the barn, near the creek"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Soil type, forage quality, any issues..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || createMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />Add Pasture</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}