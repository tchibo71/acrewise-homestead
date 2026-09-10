import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check } from "lucide-react";
import { CONTAINER_TYPES, INTENDED_USES, INDOOR_LIGHT_TYPES } from "./seedBatchConstants";

export default function AddSeedBatchModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    crop_name: "",
    variety: "",
    sow_date: "",
    container_type: "cell_tray",
    cell_count: "",
    seeds_sown: "",
    seed_source: "",
    seed_lot_number: "",
    seed_cost: "",
    intended_use: "own_use",
    indoor_light_type: "grow_light",
    used_heat_mat: false,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      ["cell_count", "seeds_sown", "seed_cost"].forEach(f => {
        if (submitData[f]) submitData[f] = parseFloat(submitData[f]);
        else delete submitData[f];
      });
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      return base44.entities.SeedBatch.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seed-batches"] });
      onClose();
    },
  });

  const isValid = formData.crop_name && formData.sow_date && formData.seeds_sown;
  const set = (key, value) => setFormData({ ...formData, [key]: value });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Seed Batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Crop Name *</Label>
              <Input value={formData.crop_name} onChange={e => set("crop_name", e.target.value)} placeholder="e.g., Tomato" />
            </div>
            <div className="space-y-2">
              <Label>Variety</Label>
              <Input value={formData.variety} onChange={e => set("variety", e.target.value)} placeholder="e.g., San Marzano" />
            </div>
            <div className="space-y-2">
              <Label>Sow Date *</Label>
              <Input type="date" value={formData.sow_date} onChange={e => set("sow_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Container Type</Label>
              <Select value={formData.container_type} onValueChange={v => set("container_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cell / Pot Count</Label>
              <Input type="number" value={formData.cell_count} onChange={e => set("cell_count", e.target.value)} placeholder="e.g., 72" />
            </div>
            <div className="space-y-2">
              <Label>Seeds Sown *</Label>
              <Input type="number" value={formData.seeds_sown} onChange={e => set("seeds_sown", e.target.value)} placeholder="e.g., 72" />
            </div>
            <div className="space-y-2">
              <Label>Seed Source</Label>
              <Input value={formData.seed_source} onChange={e => set("seed_source", e.target.value)} placeholder="e.g., Johnny's Seeds" />
            </div>
            <div className="space-y-2">
              <Label>Seed Lot Number</Label>
              <Input value={formData.seed_lot_number} onChange={e => set("seed_lot_number", e.target.value)} placeholder="Lot #" />
            </div>
            <div className="space-y-2">
              <Label>Seed Cost ($)</Label>
              <Input type="number" step="0.01" value={formData.seed_cost} onChange={e => set("seed_cost", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Intended Use *</Label>
              <Select value={formData.intended_use} onValueChange={v => set("intended_use", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTENDED_USES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Indoor Light Type</Label>
              <Select value={formData.indoor_light_type} onValueChange={v => set("indoor_light_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDOOR_LIGHT_TYPES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="heat_mat" checked={formData.used_heat_mat} onCheckedChange={v => set("used_heat_mat", v)} />
            <Label htmlFor="heat_mat" className="cursor-pointer">Used heat mat for germination</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => createMutation.mutate(formData)} disabled={!isValid || createMutation.isPending} className="bg-green-600 hover:bg-green-700">
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Add Batch</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}