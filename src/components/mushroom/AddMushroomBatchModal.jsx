import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import {
  MUSHROOM_SPECIES, SUBSTRATE_TYPES, CONTAINER_TYPES,
  SPAWN_SOURCING, SPAWN_TYPES, generateLotNumber,
} from "./mushroomBatchConstants";

export default function AddMushroomBatchModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    batch_name: "",
    species: "oyster",
    strain_name: "",
    substrate_type: "sawdust",
    container_type: "grain_bag",
    container_count: "",
    inoculation_date: "",
    spawn_sourcing: "purchased",
    spawn_source: "",
    spawn_type: "grain_spawn",
    spawn_cost: "",
    spawn_culture_transfer_id: "",
    grow_room_id: "",
    notes: "",
  });

  const { data: cultureTransfers = [] } = useQuery({
    queryKey: ["culture-transfers"],
    queryFn: () => base44.entities.CultureTransfer.list("-transfer_date"),
  });

  const { data: growRooms = [] } = useQuery({
    queryKey: ["grow-rooms"],
    queryFn: () => base44.entities.GrowRoom.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      ["container_count", "spawn_cost"].forEach(f => {
        if (submitData[f]) submitData[f] = parseFloat(submitData[f]);
        else delete submitData[f];
      });
      if (submitData.spawn_sourcing === "self_produced") {
        delete submitData.spawn_source;
        delete submitData.spawn_type;
        delete submitData.spawn_cost;
      } else {
        delete submitData.spawn_culture_transfer_id;
      }
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      submitData.lot_number = generateLotNumber(submitData.species, submitData.inoculation_date);
      submitData.status = "inoculated";
      return base44.entities.MushroomBatch.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mushroom-batches"] });
      onClose();
    },
  });

  const isValid = formData.batch_name && formData.species && formData.inoculation_date && formData.spawn_sourcing &&
    (formData.spawn_sourcing === "purchased" || formData.spawn_culture_transfer_id);
  const set = (key, value) => setFormData({ ...formData, [key]: value });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Mushroom Batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Batch Name *</Label>
              <Input value={formData.batch_name} onChange={e => set("batch_name", e.target.value)} placeholder="e.g., Oyster Block Run 1" />
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
            <div className="space-y-2">
              <Label>Strain Name</Label>
              <Input value={formData.strain_name} onChange={e => set("strain_name", e.target.value)} placeholder="e.g., Blue Oyster" />
            </div>
            <div className="space-y-2">
              <Label>Inoculation Date *</Label>
              <Input type="date" value={formData.inoculation_date} onChange={e => set("inoculation_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Substrate Type</Label>
              <Select value={formData.substrate_type} onValueChange={v => set("substrate_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSTRATE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Container Type</Label>
              <Select value={formData.container_type} onValueChange={v => set("container_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Container Count</Label>
              <Input type="number" value={formData.container_count} onChange={e => set("container_count", e.target.value)} placeholder="e.g., 10" />
            </div>
            <div className="space-y-2">
              <Label>Grow Room</Label>
              <Select value={formData.grow_room_id} onValueChange={v => set("grow_room_id", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {growRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>Spawn Sourcing *</Label>
            <Select value={formData.spawn_sourcing} onValueChange={v => set("spawn_sourcing", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPAWN_SOURCING.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {formData.spawn_sourcing === "purchased" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Spawn Source</Label>
                <Input value={formData.spawn_source} onChange={e => set("spawn_source", e.target.value)} placeholder="e.g., Field & Forest" />
              </div>
              <div className="space-y-2">
                <Label>Spawn Type</Label>
                <Select value={formData.spawn_type} onValueChange={v => set("spawn_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPAWN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Spawn Cost ($)</Label>
                <Input type="number" step="0.01" value={formData.spawn_cost} onChange={e => set("spawn_cost", e.target.value)} placeholder="0.00" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Source Culture Transfer *</Label>
              <Select value={formData.spawn_culture_transfer_id} onValueChange={v => set("spawn_culture_transfer_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select a transfer..." /></SelectTrigger>
                <SelectContent>
                  {cultureTransfers.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.transfer_type?.replace(/_/g, " ")} — {t.transfer_date ? new Date(t.transfer_date).toLocaleDateString() : "—"} ({t.resulting_generation?.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Select the CultureTransfer record this spawn was produced from.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={formData.notes} onChange={e => set("notes", e.target.value)} placeholder="General notes" />
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