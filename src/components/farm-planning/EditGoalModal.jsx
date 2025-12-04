import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { logGoalCompleted } from "@/components/utils/farmHistoryLogger";

export default function EditGoalModal({ goal, onClose }) {
  const queryClient = useQueryClient();
  const previousStatus = goal.status;

  const [formData, setFormData] = useState({
    goal_title: goal.goal_title || "",
    goal_type: goal.goal_type || "production",
    description: goal.description || "",
    start_date: goal.start_date || "",
    target_completion_date: goal.target_completion_date || goal.target_date || "",
    status: goal.status || "not_started",
    priority: goal.priority || "medium",
    measurable_target: goal.measurable_target || "",
    current_progress: goal.current_progress || 0,
    estimated_cost: goal.estimated_cost || "",
    actual_cost: goal.actual_cost || "",
    notes: goal.notes || "",
    completed_date: goal.completed_date || ""
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.estimated_cost) submitData.estimated_cost = parseFloat(submitData.estimated_cost);
      if (submitData.actual_cost) submitData.actual_cost = parseFloat(submitData.actual_cost);
      submitData.current_progress = parseInt(submitData.current_progress);
      return base44.entities.FarmGoal.update(goal.id, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-goals'] });
      // Auto-log goal completion to farm history
      if (formData.status === 'completed' && previousStatus !== 'completed') {
        logGoalCompleted({ ...goal, ...formData });
      }
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Goal</DialogTitle>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Goal Type *</Label>
              <Select
                value={formData.goal_type}
                onValueChange={(value) => setFormData({...formData, goal_type: value})}
              >
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
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label>Target Completion Date</Label>
            <Input
              type="date"
              value={formData.target_completion_date}
              onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div>
            <Label>Measurable Target</Label>
            <Input
              value={formData.measurable_target}
              onChange={(e) => setFormData({...formData, measurable_target: e.target.value})}
              placeholder="e.g., Increase milk production by 20%"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
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

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
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
          </div>

          <div>
            <Label>Progress: {formData.current_progress}%</Label>
            <Slider
              value={[formData.current_progress]}
              onValueChange={(value) => setFormData({...formData, current_progress: value[0]})}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Estimated Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})}
              />
            </div>

            <div>
              <Label>Actual Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => setFormData({...formData, actual_cost: e.target.value})}
              />
            </div>
          </div>

          {formData.status === 'completed' && (
            <div>
              <Label>Completed Date</Label>
              <Input
                type="date"
                value={formData.completed_date}
                onChange={(e) => setFormData({...formData, completed_date: e.target.value})}
              />
            </div>
          )}

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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}