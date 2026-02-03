import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Sparkles } from "lucide-react";
import { saveDraft, isOnline } from "@/components/utils/offlineStorage";

export default function AddHarvestModal({ harvest, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(harvest || {
    harvest_date: new Date().toISOString().split('T')[0],
    crop_type: "",
    quantity_harvested: "",
    unit: "",
    quality_grade: "good",
    market_value: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: gardens = [] } = useQuery({
    queryKey: ['garden-plots'],
    queryFn: () => base44.entities.GardenPlot.list(),
  });

  const { data: orchards = [] } = useQuery({
    queryKey: ['orchards'],
    queryFn: () => base44.entities.Orchard.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => harvest 
      ? base44.entities.HarvestRecord.update(harvest.id, data)
      : base44.entities.HarvestRecord.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvest-records'] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const submitData = {
      ...formData,
      quantity_harvested: parseFloat(formData.quantity_harvested),
      market_value: formData.market_value ? parseFloat(formData.market_value) : undefined
    };

    // Check if online
    if (!isOnline()) {
      try {
        await saveDraft('harvest_record', submitData, user?.email);
        alert("📱 Offline: Harvest saved as draft. Will sync when online.");
        onClose();
      } catch (error) {
        alert("Failed to save draft offline");
      }
      setSaving(false);
      return;
    }

    try {
      await createMutation.mutateAsync(submitData);
    } catch (error) {
      // Fallback to draft on error
      try {
        await saveDraft('harvest_record', submitData, user?.email);
        alert("⚠️ Server error: Saved as draft for later sync");
        onClose();
      } catch (draftError) {
        alert("Failed to save harvest record");
      }
    }

    setSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{harvest ? 'Edit' : 'Log'} Harvest Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>💡 ROI Tracking:</strong> Market value and costs are automatically calculated to show your return on investment
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="harvest_date">Harvest Date *</Label>
                <Input
                  id="harvest_date"
                  type="date"
                  value={formData.harvest_date}
                  onChange={(e) => setFormData({...formData, harvest_date: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="crop_type">Crop Type *</Label>
                <Input
                  id="crop_type"
                  value={formData.crop_type}
                  onChange={(e) => setFormData({...formData, crop_type: e.target.value})}
                  placeholder="e.g., Tomatoes, Lettuce, Apples"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="garden_plot_id">Garden Plot (optional)</Label>
                <Select
                  value={formData.garden_plot_id || ""}
                  onValueChange={(value) => setFormData({...formData, garden_plot_id: value})}
                >
                  <SelectTrigger id="garden_plot_id">
                    <SelectValue placeholder="Select garden plot" />
                  </SelectTrigger>
                  <SelectContent>
                    {gardens.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.plot_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orchard_id">Orchard (optional)</Label>
                <Select
                  value={formData.orchard_id || ""}
                  onValueChange={(value) => setFormData({...formData, orchard_id: value})}
                >
                  <SelectTrigger id="orchard_id">
                    <SelectValue placeholder="Select orchard" />
                  </SelectTrigger>
                  <SelectContent>
                    {orchards.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.orchard_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity_harvested">Quantity Harvested *</Label>
                <Input
                  id="quantity_harvested"
                  type="number"
                  step="0.01"
                  value={formData.quantity_harvested}
                  onChange={(e) => setFormData({...formData, quantity_harvested: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="lbs, bushels, dozen"
                  required
                />
              </div>

              <div>
                <Label htmlFor="quality_grade">Quality</Label>
                <Select
                  value={formData.quality_grade}
                  onValueChange={(value) => setFormData({...formData, quality_grade: value})}
                >
                  <SelectTrigger id="quality_grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="market_value">Estimated Market Value ($)</Label>
              <Input
                id="market_value"
                type="number"
                step="0.01"
                value={formData.market_value}
                onChange={(e) => setFormData({...formData, market_value: e.target.value})}
                placeholder="What would this sell for?"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used to calculate ROI and yield per square foot
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Harvest conditions, quality notes, etc."
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>📊 Auto-Calculations:</strong> ROI, yield per sq ft, and cost per unit will be automatically calculated based on your input costs and production data
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Harvest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}