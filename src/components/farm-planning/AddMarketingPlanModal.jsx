import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddMarketingPlanModal({ plan, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    product_name: "",
    product_category: "produce",
    sales_channel: "direct_consumer",
    price_per_unit: 0,
    unit_type: "lb",
    target_customer: "",
    unique_selling_points: [],
    distribution_method: "",
    packaging: "",
    annual_production_goal: 0,
    notes: ""
  });

  const [uspInput, setUspInput] = useState("");

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    }
  }, [plan]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (plan) {
        return base44.entities.MarketingPlan.update(plan.id, data);
      }
      return base44.entities.MarketingPlan.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-plans'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addUSP = () => {
    if (uspInput.trim()) {
      setFormData({
        ...formData,
        unique_selling_points: [...(formData.unique_selling_points || []), uspInput.trim()]
      });
      setUspInput("");
    }
  };

  const removeUSP = (index) => {
    setFormData({
      ...formData,
      unique_selling_points: formData.unique_selling_points.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Marketing Plan" : "Add Marketing Plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Product Name *</Label>
            <Input
              value={formData.product_name}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              required
              placeholder="e.g., Pastured Chicken - Whole, Raw Honey"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product Category *</Label>
              <Select value={formData.product_category} onValueChange={(value) => setFormData({...formData, product_category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="eggs">Eggs</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="produce">Produce</SelectItem>
                  <SelectItem value="value_added">Value Added</SelectItem>
                  <SelectItem value="fiber">Fiber</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sales Channel *</Label>
              <Select value={formData.sales_channel} onValueChange={(value) => setFormData({...formData, sales_channel: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct_consumer">Direct to Consumer</SelectItem>
                  <SelectItem value="farmers_market">Farmers Market</SelectItem>
                  <SelectItem value="csa">CSA</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="farm_store">Farm Store</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price per Unit ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price_per_unit}
                onChange={(e) => setFormData({...formData, price_per_unit: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Unit Type</Label>
              <Input
                value={formData.unit_type}
                onChange={(e) => setFormData({...formData, unit_type: e.target.value})}
                placeholder="lb, dozen, gallon, each"
              />
            </div>
          </div>

          <div>
            <Label>Target Customer</Label>
            <Input
              value={formData.target_customer}
              onChange={(e) => setFormData({...formData, target_customer: e.target.value})}
              placeholder="Describe your ideal customer"
            />
          </div>

          <div>
            <Label>Unique Selling Points</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={uspInput}
                onChange={(e) => setUspInput(e.target.value)}
                placeholder="e.g., Organic, Pasture-raised"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUSP())}
              />
              <Button type="button" onClick={addUSP}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.unique_selling_points?.map((usp, idx) => (
                <div key={idx} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm">{usp}</span>
                  <button type="button" onClick={() => removeUSP(idx)} className="text-red-600 hover:text-red-800">×</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Distribution Method</Label>
            <Input
              value={formData.distribution_method}
              onChange={(e) => setFormData({...formData, distribution_method: e.target.value})}
              placeholder="How does it get to customers?"
            />
          </div>

          <div>
            <Label>Packaging</Label>
            <Input
              value={formData.packaging}
              onChange={(e) => setFormData({...formData, packaging: e.target.value})}
              placeholder="How is it packaged?"
            />
          </div>

          <div>
            <Label>Annual Production Goal</Label>
            <Input
              type="number"
              min="0"
              value={formData.annual_production_goal}
              onChange={(e) => setFormData({...formData, annual_production_goal: Number(e.target.value)})}
              placeholder="How many units per year?"
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
              {mutation.isPending ? "Saving..." : plan ? "Update Plan" : "Add Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}