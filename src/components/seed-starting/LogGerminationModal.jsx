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
import { GERMINATION_LOSS_REASONS } from "./seedBatchConstants";

export default function LogGerminationModal({ batch, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    germination_check_date: new Date().toISOString().split("T")[0],
    seeds_germinated: "",
    germination_loss_reason: "none",
    germination_notes: "",
  });

  const showLossPrompt = useMemo(() => {
    const sown = batch.seeds_sown || 0;
    const germ = parseFloat(formData.seeds_germinated) || 0;
    return sown > 0 && germ < sown * 0.8;
  }, [batch.seeds_sown, formData.seeds_germinated]);

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.seeds_germinated) submitData.seeds_germinated = parseFloat(submitData.seeds_germinated);
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      return base44.entities.SeedBatch.update(batch.id, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seed-batches"] });
      onClose();
    },
  });

  const set = (key, value) => setFormData({ ...formData, [key]: value });
  const isValid = formData.germination_check_date && formData.seeds_germinated !== "";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Germination — {batch.crop_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Seeds sown: <span className="font-semibold">{batch.seeds_sown}</span>
          </div>
          <div className="space-y-2">
            <Label>Germination Check Date *</Label>
            <Input type="date" value={formData.germination_check_date} onChange={e => set("germination_check_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Seeds Germinated *</Label>
            <Input type="number" value={formData.seeds_germinated} onChange={e => set("seeds_germinated", e.target.value)} placeholder={`out of ${batch.seeds_sown} sown`} />
          </div>
          {showLossPrompt && (
            <>
              <Alert className="border-amber-300 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Germination rate is below 80%. Please record a loss reason.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label>Germination Loss Reason</Label>
                <Select value={formData.germination_loss_reason} onValueChange={v => set("germination_loss_reason", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GERMINATION_LOSS_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Germination Notes</Label>
                <Textarea value={formData.germination_notes} onChange={e => set("germination_notes", e.target.value)} placeholder="What happened?" rows={3} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => updateMutation.mutate(formData)} disabled={!isValid || updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Save</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}