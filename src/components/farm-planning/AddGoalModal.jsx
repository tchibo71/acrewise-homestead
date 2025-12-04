import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddGoalModal({ goal, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    goal_title: "",
    goal_type: "production",
    description: "",
    target_date: "",
    status: "not_started",
    priority: "medium",
    measurable_target: "",
    current_progress: 0,
    estimated_cost: 0,
    actual_cost: 0,
    notes: ""
  });

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    }
  }, [goal]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (goal) {
        return base44.entities.FarmGoal.update(goal.id, data);
      }
      return base44.entities.FarmGoal.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-goals'] });
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
          <DialogTitle>{goal ? "Edit Goal" : "Add New Goal"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Goal Title *</Label>
            <Input
              value={formData.goal_title}
              onChange={(e) => setFormData({...formData, goal_title: e.target.value})}
              required
            />
          </div>

          <div>
            <Label>Goal Type *</Label>
            <Select value={formData.goal_type} onValueChange={(value) => setFormData({...formData, goal_type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="sustainability">Sustainability</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="animal_welfare">Animal Welfare</SelectItem>
                <SelectItem value="soil_health">Soil Health</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Measurable Target</Label>
            <Input
              value={formData.measurable_target}
              onChange={(e) => setFormData({...formData, measurable_target: e.target.value})}
              placeholder="e.g., Produce 500 lbs of tomatoes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Current Progress (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.current_progress}
                onChange={(e) => setFormData({...formData, current_progress: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Target Date</Label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estimated Cost ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({...formData, estimated_cost: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Actual Cost ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => setFormData({...formData, actual_cost: Number(e.target.value)})}
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}