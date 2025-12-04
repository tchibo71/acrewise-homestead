import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AddSoilTestModal({ test, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    test_date: new Date().toISOString().split('T')[0],
    location: "",
    ph_level: 0,
    nitrogen_level: "",
    phosphorus_level: "",
    potassium_level: "",
    organic_matter_percent: 0,
    recommendations: "",
    cost: 0,
    lab_name: ""
  });

  useEffect(() => {
    if (test) {
      setFormData(test);
    }
  }, [test]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (test) {
        return base44.entities.SoilTest.update(test.id, data);
      }
      return base44.entities.SoilTest.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-tests'] });
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
          <DialogTitle>{test ? "Edit Soil Test" : "Add Soil Test"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Test Date *</Label>
              <Input
                type="date"
                value={formData.test_date}
                onChange={(e) => setFormData({...formData, test_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
                placeholder="Field or plot name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>pH Level</Label>
              <Input
                type="number"
                min="0"
                max="14"
                step="0.1"
                value={formData.ph_level}
                onChange={(e) => setFormData({...formData, ph_level: Number(e.target.value)})}
              />
            </div>

            <div>
              <Label>Organic Matter (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.organic_matter_percent}
                onChange={(e) => setFormData({...formData, organic_matter_percent: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Nitrogen (N)</Label>
              <Input
                value={formData.nitrogen_level}
                onChange={(e) => setFormData({...formData, nitrogen_level: e.target.value})}
                placeholder="ppm or level"
              />
            </div>

            <div>
              <Label>Phosphorus (P)</Label>
              <Input
                value={formData.phosphorus_level}
                onChange={(e) => setFormData({...formData, phosphorus_level: e.target.value})}
                placeholder="ppm or level"
              />
            </div>

            <div>
              <Label>Potassium (K)</Label>
              <Input
                value={formData.potassium_level}
                onChange={(e) => setFormData({...formData, potassium_level: e.target.value})}
                placeholder="ppm or level"
              />
            </div>
          </div>

          <div>
            <Label>Lab Recommendations</Label>
            <Textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
              rows={3}
              placeholder="What did the lab recommend?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Lab Name</Label>
              <Input
                value={formData.lab_name}
                onChange={(e) => setFormData({...formData, lab_name: e.target.value})}
                placeholder="Testing laboratory"
              />
            </div>

            <div>
              <Label>Cost ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : test ? "Update Test" : "Add Test"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}