import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";

export default function StartGrazingModal({ pasture, onClose }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    livestock_group: "",
    animal_count: "",
    start_date: today,
    notes: ""
  });

  const startGrazingMutation = useMutation({
    mutationFn: async (data) => {
      const submitData = {
        pasture_id: pasture.id,
        livestock_group: data.livestock_group || undefined,
        animal_count: data.animal_count ? parseInt(data.animal_count) : undefined,
        start_date: data.start_date,
        notes: data.notes || undefined
      };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined || submitData[key] === "") delete submitData[key];
      });
      await base44.entities.GrazingRecord.create(submitData);
      await base44.entities.Pasture.update(pasture.id, { status: "grazing" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastures'] });
      queryClient.invalidateQueries({ queryKey: ['grazing-records'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!formData.start_date) return;
    startGrazingMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Start Grazing — {pasture.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Livestock Group</Label>
            <Input
              value={formData.livestock_group}
              onChange={(e) => setFormData({ ...formData, livestock_group: e.target.value })}
              placeholder="e.g., Goat herd, Chicken flock, or specific animal IDs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Animal Count</Label>
              <Input
                type="number"
                value={formData.animal_count}
                onChange={(e) => setFormData({ ...formData, animal_count: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any observations about this grazing period..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.start_date || startGrazingMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {startGrazingMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />Start Grazing</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}