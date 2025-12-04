import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddWeightRecordModal({ livestockId, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    livestock_id: livestockId,
    weight: "",
    weight_unit: "lbs",
    measurement_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const record = await base44.entities.WeightRecord.create({
        ...data,
        weight: parseFloat(data.weight)
      });
      
      // Update livestock current weight
      const animals = await base44.entities.Livestock.list();
      const animal = animals.find(a => a.id === livestockId);
      if (animal) {
        await base44.entities.Livestock.update(livestockId, {
          ...animal,
          current_weight: parseFloat(data.weight),
          weight_unit: data.weight_unit
        });
      }
      
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-records', livestockId] });
      queryClient.invalidateQueries({ queryKey: ['livestock', livestockId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Weight Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Weight *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                required
                className="flex-1"
              />
              <Select
                value={formData.weight_unit}
                onValueChange={(value) => setFormData({...formData, weight_unit: value})}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Measurement Date *</Label>
            <Input
              type="date"
              value={formData.measurement_date}
              onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
              required
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Adding..." : "Add Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}