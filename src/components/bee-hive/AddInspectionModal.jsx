import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check } from "lucide-react";
import {
  BROOD_PATTERNS,
  TEMPERAMENTS,
  STORES_LEVELS,
} from "@/components/bee-hive/beeHiveConstants";

export default function AddInspectionModal({ hive, onClose }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    inspection_date: today,
    brood_pattern: "",
    queen_seen: false,
    eggs_seen: false,
    varroa_mite_check_done: false,
    varroa_mite_count: "",
    temperament: "",
    stores_level: "",
    actions_taken: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = {
        hive_id: hive.id,
        inspection_date: data.inspection_date,
        brood_pattern: data.brood_pattern || undefined,
        queen_seen: data.queen_seen,
        eggs_seen: data.eggs_seen,
        varroa_mite_check_done: data.varroa_mite_check_done,
        varroa_mite_count: data.varroa_mite_count ? parseFloat(data.varroa_mite_count) : undefined,
        temperament: data.temperament || undefined,
        stores_level: data.stores_level || undefined,
        actions_taken: data.actions_taken || undefined,
        notes: data.notes || undefined,
      };
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined || submitData[key] === "") delete submitData[key];
      });
      return base44.entities.HiveInspection.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hive-inspections', hive.id] });
      queryClient.invalidateQueries({ queryKey: ['bee-hives'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!formData.inspection_date) return;
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Inspection — {hive.hive_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Inspection Date *</Label>
            <Input
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brood Pattern</Label>
              <Select
                value={formData.brood_pattern}
                onValueChange={(v) => setFormData({ ...formData, brood_pattern: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {BROOD_PATTERNS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temperament</Label>
              <Select
                value={formData.temperament}
                onValueChange={(v) => setFormData({ ...formData, temperament: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TEMPERAMENTS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Stores Level</Label>
            <Select
              value={formData.stores_level}
              onValueChange={(v) => setFormData({ ...formData, stores_level: v })}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {STORES_LEVELS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <Checkbox
                id="queen-seen"
                checked={formData.queen_seen}
                onCheckedChange={(v) => setFormData({ ...formData, queen_seen: v })}
              />
              <Label htmlFor="queen-seen" className="cursor-pointer">Queen seen</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="eggs-seen"
                checked={formData.eggs_seen}
                onCheckedChange={(v) => setFormData({ ...formData, eggs_seen: v })}
              />
              <Label htmlFor="eggs-seen" className="cursor-pointer">Eggs seen</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="varroa-check"
                checked={formData.varroa_mite_check_done}
                onCheckedChange={(v) => setFormData({ ...formData, varroa_mite_check_done: v })}
              />
              <Label htmlFor="varroa-check" className="cursor-pointer">Varroa mite check done</Label>
            </div>
          </div>

          {formData.varroa_mite_check_done && (
            <div className="space-y-2">
              <Label>Varroa Mite Count (mites per 100 bees)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.varroa_mite_count}
                onChange={(e) => setFormData({ ...formData, varroa_mite_count: e.target.value })}
                placeholder="e.g., 3"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Actions Taken</Label>
            <Textarea
              value={formData.actions_taken}
              onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })}
              placeholder="e.g., Added honey super, treated for mites..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional observations..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.inspection_date || createMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />Save Inspection</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}