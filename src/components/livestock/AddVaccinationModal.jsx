import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AddVaccinationModal({ livestockId, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    livestock_id: livestockId,
    vaccine_name: "",
    vaccination_date: new Date().toISOString().split('T')[0],
    next_due_date: "",
    administered_by: "",
    batch_number: "",
    dosage: "",
    location: "",
    cost: "",
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Vaccination.create({
      ...data,
      cost: data.cost ? parseFloat(data.cost) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', livestockId] });
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
          <DialogTitle>Add Vaccination Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Vaccine Name *</Label>
            <Input
              value={formData.vaccine_name}
              onChange={(e) => setFormData({...formData, vaccine_name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vaccination Date *</Label>
              <Input
                type="date"
                value={formData.vaccination_date}
                onChange={(e) => setFormData({...formData, vaccination_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Next Due Date</Label>
              <Input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({...formData, next_due_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Administered By</Label>
            <Input
              value={formData.administered_by}
              onChange={(e) => setFormData({...formData, administered_by: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Batch Number</Label>
              <Input
                value={formData.batch_number}
                onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
              />
            </div>

            <div>
              <Label>Dosage</Label>
              <Input
                value={formData.dosage}
                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                placeholder="e.g., 2ml"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Injection Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., neck, thigh"
              />
            </div>

            <div>
              <Label>Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>
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
              {mutation.isPending ? "Adding..." : "Add Vaccination"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}