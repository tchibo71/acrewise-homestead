import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";

export default function StartHardeningModal({ batch, onClose }) {
  const queryClient = useQueryClient();
  const defaultCount = batch.seeds_germinated ?? batch.seeds_sown ?? "";
  const [formData, setFormData] = useState({
    hardening_start_date: new Date().toISOString().split("T")[0],
    hardening_started_count: defaultCount,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.hardening_started_count) submitData.hardening_started_count = parseFloat(submitData.hardening_started_count);
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      return base44.entities.SeedBatch.update(batch.id, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seed-batches"] });
      // TODO: Create hardening_days_planned days worth of ChecklistItem records linked via seed_batch_id.
      // Schedule content will be provided in the next prompt.
      onClose();
    },
  });

  const set = (key, value) => setFormData({ ...formData, [key]: value });
  const isValid = formData.hardening_start_date && formData.hardening_started_count !== "";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start Hardening Off — {batch.crop_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Seeds germinated: <span className="font-semibold">{batch.seeds_germinated ?? "—"}</span>
            <br />
            Hardening days planned: <span className="font-semibold">{batch.hardening_days_planned ?? 10}</span>
          </div>
          <div className="space-y-2">
            <Label>Hardening Start Date *</Label>
            <Input type="date" value={formData.hardening_start_date} onChange={e => set("hardening_start_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Seedlings Entering Hardening *</Label>
            <Input type="number" value={formData.hardening_started_count} onChange={e => set("hardening_started_count", e.target.value)} placeholder="defaults to seeds germinated" />
            <p className="text-xs text-gray-500">May be less than seeds germinated if some were culled.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => updateMutation.mutate(formData)} disabled={!isValid || updateMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
            {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Start Hardening</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}