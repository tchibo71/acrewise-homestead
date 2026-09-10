import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LogReadingModal({ room, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    current_temp_f: room.current_temp_f ?? "",
    current_humidity_percent: room.current_humidity_percent ?? "",
    current_co2_ppm: room.current_co2_ppm ?? "",
    last_reading_date: new Date().toISOString().slice(0, 10),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const submitData = { last_reading_date: data.last_reading_date };
      ["current_temp_f", "current_humidity_percent", "current_co2_ppm"].forEach(f => {
        if (data[f] !== "" && data[f] != null) {
          submitData[f] = parseFloat(data[f]);
        }
      });
      return base44.entities.GrowRoom.update(room.id, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grow-rooms"] });
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
          <DialogTitle>Log Reading — {room.room_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label>Reading Date</Label>
            <Input type="date" value={formData.last_reading_date} onChange={(e) => setFormData({ ...formData, last_reading_date: e.target.value })} required />
          </div>

          {(room.target_temp_f || room.target_humidity_percent || room.target_co2_ppm) && (
            <div className="rounded-lg bg-gray-50 border p-3 text-sm text-gray-600">
              <p className="font-medium mb-1">Targets:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {room.target_temp_f && <span>Temp: {room.target_temp_f}°F</span>}
                {room.target_humidity_percent && <span>Humidity: {room.target_humidity_percent}%</span>}
                {room.target_co2_ppm && <span>CO₂: {room.target_co2_ppm} ppm</span>}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
              {mutation.isPending ? "Saving..." : "Save Reading"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}