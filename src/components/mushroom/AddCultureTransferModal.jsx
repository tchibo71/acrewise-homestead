import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import {
  TRANSFER_TYPES, SOURCE_GENERATIONS, RESULTING_GENERATION_MAP,
  CULTURE_CONTAINER_TYPES, STERILIZATION_METHODS, CONTAMINATION_ORGANISMS,
} from "./mushroomLabConstants";

export default function AddCultureTransferModal({ culture, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    transfer_date: "",
    transfer_type: "agar_to_agar",
    source_generation: "g0_original",
    container_count: "",
    container_type: "petri_dish",
    sterilization_method: "pressure_cooker",
    sterilization_temp_f: "",
    sterilization_psi: "",
    sterilization_duration_minutes: "",
    contamination_detected_count: "0",
    contamination_organism: "none",
    notes: "",
  });

  const resultingGeneration = RESULTING_GENERATION_MAP[formData.source_generation];

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data, mushroom_culture_id: culture.id, resulting_generation: RESULTING_GENERATION_MAP[data.source_generation] };
      ["container_count", "sterilization_temp_f", "sterilization_psi", "sterilization_duration_minutes", "contamination_detected_count"].forEach(f => {
        if (submitData[f]) submitData[f] = parseFloat(submitData[f]);
        else delete submitData[f];
      });
      const cc = parseFloat(submitData.container_count) || 0;
      const cd = parseFloat(submitData.contamination_detected_count) || 0;
      submitData.contamination_rate_percent = cc > 0 ? (cd / cc * 100) : 0;
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      return base44.entities.CultureTransfer.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["culture-transfers", culture.id] });
      queryClient.invalidateQueries({ queryKey: ["culture-transfers"] });
      onClose();
    },
  });

  const isValid = formData.transfer_date && formData.transfer_type && formData.container_count;
  const set = (key, value) => setFormData({ ...formData, [key]: value });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Transfer — {culture.strain_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transfer Date *</Label>
              <Input type="date" value={formData.transfer_date} onChange={e => set("transfer_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Transfer Type *</Label>
              <Select value={formData.transfer_type} onValueChange={v => set("transfer_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSFER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source Generation *</Label>
              <Select value={formData.source_generation} onValueChange={v => set("source_generation", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_GENERATIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resulting Generation</Label>
              <Input value={resultingGeneration?.toUpperCase() || ""} readOnly className="bg-gray-50" />
              <p className="text-xs text-gray-500">Auto-calculated; capped at G3</p>
            </div>
            <div className="space-y-2">
              <Label>Container Count *</Label>
              <Input type="number" value={formData.container_count} onChange={e => set("container_count", e.target.value)} placeholder="e.g., 10" />
            </div>
            <div className="space-y-2">
              <Label>Container Type</Label>
              <Select value={formData.container_type} onValueChange={v => set("container_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CULTURE_CONTAINER_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="space-y-2 col-span-3">
              <Label>Sterilization Method</Label>
              <Select value={formData.sterilization_method} onValueChange={v => set("sterilization_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STERILIZATION_METHODS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temp (°F)</Label>
              <Input type="number" value={formData.sterilization_temp_f} onChange={e => set("sterilization_temp_f", e.target.value)} placeholder="250" />
            </div>
            <div className="space-y-2">
              <Label>PSI</Label>
              <Input type="number" value={formData.sterilization_psi} onChange={e => set("sterilization_psi", e.target.value)} placeholder="15" />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" value={formData.sterilization_duration_minutes} onChange={e => set("sterilization_duration_minutes", e.target.value)} placeholder="90" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label>Contamination Detected</Label>
              <Input type="number" value={formData.contamination_detected_count} onChange={e => set("contamination_detected_count", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Contaminant</Label>
              <Select value={formData.contamination_organism} onValueChange={v => set("contamination_organism", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTAMINATION_ORGANISMS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={formData.notes} onChange={e => set("notes", e.target.value)} placeholder="General notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => createMutation.mutate(formData)} disabled={!isValid || createMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Add Transfer</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}