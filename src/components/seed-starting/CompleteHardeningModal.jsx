import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { HARDENING_LOSS_REASONS } from "./seedBatchConstants";

export default function CompleteHardeningModal({ batch, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    hardening_completed_date: new Date().toISOString().split("T")[0],
    hardening_survived_count: "",
    hardening_loss_reason: "none",
    hardening_notes: "",
  });

  const showLossPrompt = useMemo(() => {
    const started = batch.hardening_started_count || 0;
    const survived = parseFloat(formData.hardening_survived_count) || 0;
    return started > 0 && survived < started * 0.8;
  }, [batch.hardening_started_count, formData.hardening_survived_count]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.hardening_survived_count) submitData.hardening_survived_count = parseFloat(submitData.hardening_survived_count);
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      return base44.entities.SeedBatch.update(batch.id, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seed-batches"] });
      onClose();
    },
  });

  const set = (key, value) => setFormData({ ...formData, [key]: value });
  const isValid = formData.hardening_completed_date && formData.hardening_survived_count !== "";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Hardening — {batch.crop_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Seedlings started hardening: <span className="font-semibold">{batch.hardening_started_count ?? "—"}</span>
          </div>
          <div className="space-y-2">
            <Label>Hardening Completed Date *</Label>
            <Input type="date" value={formData.hardening_completed_date} onChange={e => set("hardening_completed_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Seedlings Survived *</Label>
            <Input type="number" value={formData.hardening_survived_count} onChange={e => set("hardening_survived_count", e.target.value)} placeholder={`out of ${batch.hardening_started_count ?? "?"} started`} />
          </div>
          {showLossPrompt && (
            <>
              <Alert className="border-amber-300 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Survival rate is below 80%. Please record a loss reason.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Hardening Loss Reason</Label>
                <Select value={formData.hardening_loss_reason} onValueChange={v => set("hardening_loss_reason", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HARDENING_LOSS_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hardening Notes</Label>
                <Textarea value={formData.hardening_notes} onChange={e => set("hardening_notes", e.target.value)} placeholder="What happened?" rows={3} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => updateMutation.mutate(formData)} disabled={!isValid || updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
            {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Complete</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}