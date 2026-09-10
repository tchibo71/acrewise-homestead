import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, Sprout } from "lucide-react";

export default function TransplantToGardenModal({ batch, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    transplant_date: new Date().toISOString().split("T")[0],
    transplanted_count: batch.hardening_survived_count ? String(batch.hardening_survived_count) : "",
    garden_plot_id: "",
  });

  const { data: plots = [] } = useQuery({
    queryKey: ["garden-plots"],
    queryFn: () => base44.entities.GardenPlot.list(),
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const count = parseFloat(data.transplanted_count);
      await base44.entities.SeedBatch.update(batch.id, {
        transplant_date: data.transplant_date,
        transplanted_count: count,
        garden_plot_id: data.garden_plot_id || undefined,
      });
      if (data.garden_plot_id) {
        const plot = plots.find(p => p.id === data.garden_plot_id);
        if (plot) {
          const cropLabel = batch.variety ? `${batch.crop_name} (${batch.variety})` : batch.crop_name;
          const currentCrops = Array.isArray(plot.current_crops) ? [...plot.current_crops] : [];
          if (!currentCrops.includes(cropLabel)) {
            currentCrops.push(cropLabel);
          }
          await base44.entities.GardenPlot.update(data.garden_plot_id, { current_crops: currentCrops });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seed-batches"] });
      queryClient.invalidateQueries({ queryKey: ["garden-plots"] });
      onClose();
    },
  });

  const set = (key, value) => setFormData({ ...formData, [key]: value });
  const count = parseFloat(formData.transplanted_count) || 0;
  const isValid = formData.transplant_date && count > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-600" />
            Transplant to Garden — {batch.crop_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(formData); }}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Transplant Date *</Label>
              <Input type="date" value={formData.transplant_date} onChange={e => set("transplant_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Number Transplanted *</Label>
              <Input type="number" value={formData.transplanted_count} onChange={e => set("transplanted_count", e.target.value)} max={batch.hardening_survived_count || undefined} placeholder={`out of ${batch.hardening_survived_count ?? "?"} survived`} />
            </div>
            <div className="space-y-2">
              <Label>Garden Plot</Label>
              <Select value={formData.garden_plot_id} onValueChange={v => set("garden_plot_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select a plot (optional)" /></SelectTrigger>
                <SelectContent>
                  {plots.map(plot => (
                    <SelectItem key={plot.id} value={plot.id}>{plot.plot_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Crop will be added to the plot's current crops</p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!isValid || submitMutation.isPending} className="bg-green-600 hover:bg-green-700">
              {submitMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Transplant</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}