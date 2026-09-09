import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import {
  HIVE_TYPES,
  QUEEN_COLORS,
  COLONY_STRENGTHS,
} from "@/components/bee-hive/beeHiveConstants";

export default function AddBeeHiveModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    hive_name: "",
    hive_type: "",
    install_date: "",
    queen_source: "",
    queen_marked_color: "",
    queen_last_seen_date: "",
    colony_strength: "",
    location_notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === undefined) delete submitData[key];
      });
      submitData.status = "active";
      return base44.entities.BeeHive.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bee-hives'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!formData.hive_name.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Bee Hive</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Hive Name *</Label>
            <Input
              value={formData.hive_name}
              onChange={(e) => setFormData({ ...formData, hive_name: e.target.value })}
              placeholder="e.g., Hive #1, North Apiary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hive Type</Label>
              <Select
                value={formData.hive_type}
                onValueChange={(v) => setFormData({ ...formData, hive_type: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {HIVE_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colony Strength</Label>
              <Select
                value={formData.colony_strength}
                onValueChange={(v) => setFormData({ ...formData, colony_strength: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select strength" /></SelectTrigger>
                <SelectContent>
                  {COLONY_STRENGTHS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Install Date</Label>
            <Input
              type="date"
              value={formData.install_date}
              onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Queen Source</Label>
              <Input
                value={formData.queen_source}
                onChange={(e) => setFormData({ ...formData, queen_source: e.target.value })}
                placeholder="e.g., Olivarez, local nuc"
              />
            </div>
            <div className="space-y-2">
              <Label>Queen Marked Color</Label>
              <Select
                value={formData.queen_marked_color}
                onValueChange={(v) => setFormData({ ...formData, queen_marked_color: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                <SelectContent>
                  {QUEEN_COLORS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Queen Last Seen Date</Label>
            <Input
              type="date"
              value={formData.queen_last_seen_date}
              onChange={(e) => setFormData({ ...formData, queen_last_seen_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Location Notes</Label>
            <Textarea
              value={formData.location_notes}
              onChange={(e) => setFormData({ ...formData, location_notes: e.target.value })}
              placeholder="e.g., South-facing, near the orchard, protected from wind"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.hive_name.trim() || createMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />Add Hive</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}