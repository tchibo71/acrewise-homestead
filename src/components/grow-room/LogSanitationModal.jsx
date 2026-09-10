import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SANITATION_TYPES } from "./growRoomConstants";

export default function LogSanitationModal({ room, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    sanitation_date: new Date().toISOString().slice(0, 10),
    sanitation_type: "surface_wipe_down",
    performed_by: "",
    products_used: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.SanitationLog.create({
        ...data,
        grow_room_id: room.id,
      });
      await base44.entities.GrowRoom.update(room.id, {
        last_sanitized_date: data.sanitation_date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grow-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["sanitation-logs"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Sanitation — {room.room_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sanitation Date *</Label>
              <Input type="date" value={formData.sanitation_date} onChange={(e) => setFormData({ ...formData, sanitation_date: e.target.value })} required />
            </div>
            <div>
              <Label>Sanitation Type *</Label>
              <Select value={formData.sanitation_type} onValueChange={(v) => setFormData({ ...formData, sanitation_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SANITATION_TYPES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Performed By</Label>
            <Input value={formData.performed_by} onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })} placeholder="Who performed the sanitation" />
          </div>

          <div>
            <Label>Products Used</Label>
            <Input value={formData.products_used} onChange={(e) => setFormData({ ...formData, products_used: e.target.value })} placeholder="e.g., 70% isopropyl alcohol" />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="General notes" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {mutation.isPending ? "Saving..." : "Log Sanitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}