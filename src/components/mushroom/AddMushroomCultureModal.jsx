import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import { MUSHROOM_SPECIES } from "./mushroomBatchConstants";
import { ORIGIN_TYPES } from "./mushroomLabConstants";

export default function AddMushroomCultureModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    strain_name: "",
    species: "oyster",
    origin_type: "tissue_culture_clone",
    source: "",
    isolation_or_purchase_date: "",
    agar_recipe: "pda_potato_dextrose",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      submitData.is_active = true;
      return base44.entities.MushroomCulture.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mushroom-cultures"] });
      onClose();
    },
  });

  const isValid = formData.strain_name && formData.species && formData.origin_type;
  const set = (key, value) => setFormData({ ...formData, [key]: value });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Mushroom Culture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strain Name *</Label>
              <Input value={formData.strain_name} onChange={e => set("strain_name", e.target.value)} placeholder="e.g., Blue Oyster" />
            </div>
            <div className="space-y-2">
              <Label>Species *</Label>
              <Select value={formData.species} onValueChange={v => set("species", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MUSHROOM_SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Origin Type *</Label>
              <Select value={formData.origin_type} onValueChange={v => set("origin_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGIN_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Source</Label>
              <Input value={formData.source} onChange={e => set("source", e.target.value)} placeholder="Supplier name or 'self-isolated from...'" />
            </div>
            <div className="space-y-2">
              <Label>Isolation/Purchase Date</Label>
              <Input type="date" value={formData.isolation_or_purchase_date} onChange={e => set("isolation_or_purchase_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Agar Recipe</Label>
              <Select value={formData.agar_recipe} onValueChange={v => set("agar_recipe", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pda_potato_dextrose">PDA (Potato Dextrose)</SelectItem>
                  <SelectItem value="mea_malt_extract">MEA (Malt Extract)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Add Culture</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}