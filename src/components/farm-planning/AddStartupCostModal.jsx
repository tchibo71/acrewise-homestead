import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddStartupCostModal({ cost, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    item_name: "",
    category: "equipment",
    purchase_date: new Date().toISOString().split('T')[0],
    cost: 0,
    useful_life_years: 10,
    current_value: 0,
    vendor: "",
    notes: ""
  });

  useEffect(() => {
    if (cost) {
      setFormData(cost);
    }
  }, [cost]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (cost) {
        return base44.entities.StartupCost.update(cost.id, data);
      }
      return base44.entities.StartupCost.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startup-costs'] });
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
          <DialogTitle>{cost ? "Edit Startup Cost" : "Add Startup Cost"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Item Name *</Label>
            <Input
              value={formData.item_name}
              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
              required
              placeholder="e.g., 5 acres of land, John Deere tractor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="buildings">Buildings</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="livestock">Livestock</SelectItem>
                  <SelectItem value="vehicles">Vehicles</SelectItem>
                  <SelectItem value="fencing">Fencing</SelectItem>
                  <SelectItem value="irrigation">Irrigation</SelectItem>
                  <SelectItem value="legal_fees">Legal Fees</SelectItem>
                  <SelectItem value="permits">Permits</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cost ($) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
                required
              />
            </div>

            <div>
              <Label>Current Value ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({...formData, current_value: Number(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <Label>Useful Life (Years)</Label>
            <Input
              type="number"
              min="1"
              value={formData.useful_life_years}
              onChange={(e) => setFormData({...formData, useful_life_years: Number(e.target.value)})}
            />
          </div>

          <div>
            <Label>Vendor</Label>
            <Input
              value={formData.vendor}
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              placeholder="Where did you purchase this?"
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : cost ? "Update Cost" : "Add Cost"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}