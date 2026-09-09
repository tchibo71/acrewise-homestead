import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { saveDraft, isOnline } from "@/components/utils/offlineStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, WifiOff } from "lucide-react";
import { logWeightRecordEvent } from "@/components/utils/farmHistoryLogger";

export default function AddWeightRecordModal({ livestockId, onClose }) {
  const queryClient = useQueryClient();
  
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    livestock_id: livestockId,
    weight: "",
    weight_unit: "lbs",
    measurement_date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const record = await base44.entities.WeightRecord.create({
        ...data,
        weight: parseFloat(data.weight)
      });
      
      // Update livestock current weight
      const animals = await base44.entities.Livestock.list();
      const animal = animals.find(a => a.id === livestockId);
      if (animal) {
        await base44.entities.Livestock.update(livestockId, {
          ...animal,
          current_weight: parseFloat(data.weight),
          weight_unit: data.weight_unit
        });
      }
      
      return record;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['weight-records', livestockId] });
      queryClient.invalidateQueries({ queryKey: ['livestock', livestockId] });
      queryClient.invalidateQueries({ queryKey: ['farm-activity-feed'] });
      logWeightRecordEvent(record);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if online
    if (!isOnline()) {
      try {
        await saveDraft('weight_record', formData, currentUser?.email);
        alert("📱 Offline: Weight record saved as draft. Will sync when online.");
        onClose();
      } catch (error) {
        alert("Failed to save draft offline");
      }
      return;
    }

    mutation.mutate(formData);
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft('weight_record', formData, currentUser?.email);
      alert("✅ Draft saved! Will sync when online.");
      onClose();
    } catch (error) {
      alert("Failed to save draft");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Weight Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isOnline() && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800 font-medium">
                Offline Mode - Will save as draft
              </p>
            </div>
          )}

          <div>
            <Label>Weight *</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                required
                className="flex-1"
              />
              <Select
                value={formData.weight_unit}
                onValueChange={(value) => setFormData({...formData, weight_unit: value})}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Measurement Date *</Label>
            <Input
              type="date"
              value={formData.measurement_date}
              onChange={(e) => setFormData({...formData, measurement_date: e.target.value})}
              required
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>

          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Adding..." : "Add Record"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}