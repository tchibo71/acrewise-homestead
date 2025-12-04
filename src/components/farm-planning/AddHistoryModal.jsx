import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddHistoryModal({ event, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    event_date: new Date().toISOString().split('T')[0],
    event_type: "milestone",
    title: "",
    description: "",
    financial_impact: 0,
    lessons_learned: ""
  });

  useEffect(() => {
    if (event) {
      setFormData(event);
    }
  }, [event]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (event) {
        return base44.entities.FarmHistory.update(event.id, data);
      }
      return base44.entities.FarmHistory.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-history'] });
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
          <DialogTitle>{event ? "Edit Event" : "Add Historical Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Date *</Label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Event Type *</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({...formData, event_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ownership_change">Ownership Change</SelectItem>
                  <SelectItem value="major_improvement">Major Improvement</SelectItem>
                  <SelectItem value="catastrophe">Catastrophe</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              placeholder="e.g., Installed new irrigation system"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              placeholder="Detailed description of what happened..."
            />
          </div>

          <div>
            <Label>Financial Impact ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.financial_impact}
              onChange={(e) => setFormData({...formData, financial_impact: Number(e.target.value)})}
              placeholder="Positive or negative impact"
            />
            <p className="text-xs text-gray-500 mt-1">Use negative numbers for costs, positive for gains</p>
          </div>

          <div>
            <Label>Lessons Learned</Label>
            <Textarea
              value={formData.lessons_learned}
              onChange={(e) => setFormData({...formData, lessons_learned: e.target.value})}
              rows={3}
              placeholder="What did you learn from this experience?"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : event ? "Update Event" : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}