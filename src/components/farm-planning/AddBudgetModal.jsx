import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddBudgetModal({ budget, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    budget_name: "",
    budget_type: "whole_farm",
    year: new Date().getFullYear(),
    enterprise_name: "",
    projected_revenue: 0,
    actual_revenue: 0,
    projected_expenses: 0,
    actual_expenses: 0,
    notes: ""
  });

  useEffect(() => {
    if (budget) {
      setFormData(budget);
    }
  }, [budget]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (budget) {
        return base44.entities.Budget.update(budget.id, data);
      }
      return base44.entities.Budget.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
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
          <DialogTitle>{budget ? "Edit Budget" : "Create Budget"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Budget Name *</Label>
            <Input
              value={formData.budget_name}
              onChange={(e) => setFormData({...formData, budget_name: e.target.value})}
              required
              placeholder="e.g., 2024 Whole Farm Budget"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget Type *</Label>
              <Select value={formData.budget_type} onValueChange={(value) => setFormData({...formData, budget_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whole_farm">Whole Farm</SelectItem>
                  <SelectItem value="enterprise_crop">Enterprise - Crop</SelectItem>
                  <SelectItem value="enterprise_livestock">Enterprise - Livestock</SelectItem>
                  <SelectItem value="partial">Partial Budget</SelectItem>
                  <SelectItem value="project">Project Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Year *</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                required
              />
            </div>
          </div>

          {(formData.budget_type === "enterprise_crop" || formData.budget_type === "enterprise_livestock") && (
            <div>
              <Label>Enterprise Name</Label>
              <Input
                value={formData.enterprise_name}
                onChange={(e) => setFormData({...formData, enterprise_name: e.target.value})}
                placeholder="e.g., Tomatoes, Laying Hens"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Projected Revenue ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.projected_revenue}
                onChange={(e) => setFormData({...formData, projected_revenue: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Actual Revenue ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.actual_revenue}
                onChange={(e) => setFormData({...formData, actual_revenue: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Projected Expenses ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.projected_expenses}
                onChange={(e) => setFormData({...formData, projected_expenses: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Actual Expenses ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.actual_expenses}
                onChange={(e) => setFormData({...formData, actual_expenses: Number(e.target.value)})}
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
              {mutation.isPending ? "Saving..." : budget ? "Update Budget" : "Create Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}