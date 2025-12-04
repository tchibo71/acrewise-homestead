import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddPestManagementModal({ record, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date_identified: new Date().toISOString().split('T')[0],
    pest_type: "insect",
    pest_name: "",
    affected_crop_or_animal: "",
    severity: "moderate",
    location: "",
    treatment_method: "",
    treatment_date: "",
    treatment_cost: 0,
    effectiveness: "",
    prevention_measures: "",
    notes: ""
  });

  useEffect(() => {
    if (record) {
      setFormData(record);
    }
  }, [record]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (record) {
        return base44.entities.PestManagement.update(record.id, data);
      }
      return base44.entities.PestManagement.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pest-management'] });
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
          <DialogTitle>{record ? "Edit Pest Record" : "Add Pest Management Record"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date Identified *</Label>
              <Input
                type="date"
                value={formData.date_identified}
                onChange={(e) => setFormData({...formData, date_identified: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Pest Type *</Label>
              <Select value={formData.pest_type} onValueChange={(value) => setFormData({...formData, pest_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insect">Insect</SelectItem>
                  <SelectItem value="disease">Disease</SelectItem>
                  <SelectItem value="weed">Weed</SelectItem>
                  <SelectItem value="rodent">Rodent</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="parasite">Parasite</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Pest Name</Label>
            <Input
              value={formData.pest_name}
              onChange={(e) => setFormData({...formData, pest_name: e.target.value})}
              placeholder="e.g., Tomato Hornworm, Late Blight"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Affected Crop/Animal *</Label>
              <Input
                value={formData.affected_crop_or_animal}
                onChange={(e) => setFormData({...formData, affected_crop_or_animal: e.target.value})}
                required
                placeholder="What was affected?"
              />
            </div>

            <div>
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Where was it found?"
            />
          </div>

          <div>
            <Label>Treatment Method</Label>
            <Textarea
              value={formData.treatment_method}
              onChange={(e) => setFormData({...formData, treatment_method: e.target.value})}
              rows={2}
              placeholder="What treatment was applied?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Treatment Date</Label>
              <Input
                type="date"
                value={formData.treatment_date}
                onChange={(e) => setFormData({...formData, treatment_date: e.target.value})}
              />
            </div>

            <div>
              <Label>Treatment Cost ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.treatment_cost}
                onChange={(e) => setFormData({...formData, treatment_cost: Number(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <Label>Effectiveness</Label>
            <Select value={formData.effectiveness} onValueChange={(value) => setFormData({...formData, effectiveness: value})}>
              <SelectTrigger>
                <SelectValue placeholder="How effective was treatment?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_effective">Not Effective</SelectItem>
                <SelectItem value="somewhat_effective">Somewhat Effective</SelectItem>
                <SelectItem value="effective">Effective</SelectItem>
                <SelectItem value="very_effective">Very Effective</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prevention Measures</Label>
            <Textarea
              value={formData.prevention_measures}
              onChange={(e) => setFormData({...formData, prevention_measures: e.target.value})}
              rows={2}
              placeholder="How can this be prevented in the future?"
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
              {mutation.isPending ? "Saving..." : record ? "Update Record" : "Add Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}