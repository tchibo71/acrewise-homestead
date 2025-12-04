import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddVetVisitModal({ livestockId, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    livestock_id: livestockId,
    visit_date: new Date().toISOString().split('T')[0],
    visit_type: "checkup",
    veterinarian_name: "",
    diagnosis: "",
    treatment: "",
    medications: [],
    cost: "",
    follow_up_date: "",
    notes: ""
  });

  const [medicationInput, setMedicationInput] = useState("");

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.VetVisit.create({
      ...data,
      cost: data.cost ? parseFloat(data.cost) : null
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vet-visits', livestockId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addMedication = () => {
    if (medicationInput.trim()) {
      setFormData({
        ...formData,
        medications: [...formData.medications, medicationInput.trim()]
      });
      setMedicationInput("");
    }
  };

  const removeMedication = (index) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Veterinary Visit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Visit Date *</Label>
              <Input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Visit Type *</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) => setFormData({...formData, visit_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="illness">Illness</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Veterinarian Name</Label>
            <Input
              value={formData.veterinarian_name}
              onChange={(e) => setFormData({...formData, veterinarian_name: e.target.value})}
            />
          </div>

          <div>
            <Label>Diagnosis</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>Treatment</Label>
            <Textarea
              value={formData.treatment}
              onChange={(e) => setFormData({...formData, treatment: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>Medications</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={medicationInput}
                onChange={(e) => setMedicationInput(e.target.value)}
                placeholder="Enter medication name"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
              />
              <Button type="button" onClick={addMedication} variant="outline">
                Add
              </Button>
            </div>
            {formData.medications.length > 0 && (
              <div className="space-y-1">
                {formData.medications.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{med}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>

            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
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
              {mutation.isPending ? "Adding..." : "Add Visit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}