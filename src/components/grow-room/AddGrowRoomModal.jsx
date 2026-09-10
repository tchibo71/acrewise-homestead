import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ROOM_TYPES } from "./growRoomConstants";

export default function AddGrowRoomModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    room_name: "",
    room_type: "fruiting_chamber",
    target_temp_f: "",
    target_humidity_percent: "",
    target_co2_ppm: "",
    has_hepa_filtration: false,
    current_temp_f: "",
    current_humidity_percent: "",
    current_co2_ppm: "",
    last_reading_date: "",
    last_sanitized_date: "",
    sanitation_frequency_days: "7",
    capacity_description: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      ["target_temp_f", "target_humidity_percent", "target_co2_ppm", "current_temp_f", "current_humidity_percent", "current_co2_ppm", "sanitation_frequency_days"].forEach(f => {
        if (submitData[f] === "" || submitData[f] == null) {
          delete submitData[f];
        } else {
          submitData[f] = parseFloat(submitData[f]);
        }
      });
      return base44.entities.GrowRoom.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grow-rooms"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Grow Room</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Room Name *</Label>
              <Input
                value={formData.room_name}
                onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                required
                placeholder="e.g., Main Fruiting Chamber"
              />
            </div>
            <div>
              <Label>Room Type *</Label>
              <Select
                value={formData.room_type}
                onValueChange={(value) => setFormData({ ...formData, room_type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Target Environment</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Temp (°F)</Label>
                <Input type="number" value={formData.target_temp_f} onChange={(e) => setFormData({ ...formData, target_temp_f: e.target.value })} placeholder="e.g., 72" />
              </div>
              <div>
                <Label>Humidity (%)</Label>
                <Input type="number" value={formData.target_humidity_percent} onChange={(e) => setFormData({ ...formData, target_humidity_percent: e.target.value })} placeholder="e.g., 85" />
              </div>
              <div>
                <Label>CO₂ (ppm)</Label>
                <Input type="number" value={formData.target_co2_ppm} onChange={(e) => setFormData({ ...formData, target_co2_ppm: e.target.value })} placeholder="e.g., 1000" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Reading (optional)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Temp (°F)</Label>
                <Input type="number" value={formData.current_temp_f} onChange={(e) => setFormData({ ...formData, current_temp_f: e.target.value })} placeholder="—" />
              </div>
              <div>
                <Label>Humidity (%)</Label>
                <Input type="number" value={formData.current_humidity_percent} onChange={(e) => setFormData({ ...formData, current_humidity_percent: e.target.value })} placeholder="—" />
              </div>
              <div>
                <Label>CO₂ (ppm)</Label>
                <Input type="number" value={formData.current_co2_ppm} onChange={(e) => setFormData({ ...formData, current_co2_ppm: e.target.value })} placeholder="—" />
              </div>
            </div>
            <div className="mt-3">
              <Label>Reading Date</Label>
              <Input type="date" value={formData.last_reading_date} onChange={(e) => setFormData({ ...formData, last_reading_date: e.target.value })} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Last Sanitized Date</Label>
              <Input type="date" value={formData.last_sanitized_date} onChange={(e) => setFormData({ ...formData, last_sanitized_date: e.target.value })} />
            </div>
            <div>
              <Label>Sanitation Frequency (days)</Label>
              <Input type="number" value={formData.sanitation_frequency_days} onChange={(e) => setFormData({ ...formData, sanitation_frequency_days: e.target.value })} placeholder="e.g., 7" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>HEPA Filtration</Label>
              <p className="text-xs text-gray-500">Room has HEPA filtration installed</p>
            </div>
            <Switch checked={formData.has_hepa_filtration} onCheckedChange={(v) => setFormData({ ...formData, has_hepa_filtration: v })} />
          </div>

          <div>
            <Label>Capacity Description</Label>
            <Input value={formData.capacity_description} onChange={(e) => setFormData({ ...formData, capacity_description: e.target.value })} placeholder="e.g., 12 shelving units, 200 jars" />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="General notes" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {createMutation.isPending ? "Adding..." : "Add Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}