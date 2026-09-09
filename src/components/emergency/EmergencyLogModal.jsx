import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Save, Clock, Camera } from "lucide-react";
import { saveDraft } from "@/components/utils/offlineStorage";
import { logEmergencyLogEvent } from "@/components/utils/farmHistoryLogger";

export default function EmergencyLogModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    emergency_type: "other",
    severity: "high",
    timestamp: new Date().toISOString(),
    quick_description: "",
    location_on_property: ""
  });
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const createEmergencyMutation = useMutation({
    mutationFn: (data) => base44.entities.EmergencyLog.create(data),
    onSuccess: (newEmergency) => {
      queryClient.invalidateQueries({ queryKey: ['emergency-logs'] });
      queryClient.invalidateQueries({ queryKey: ['farm-activity-feed'] });
      logEmergencyLogEvent(newEmergency);
      onClose();
    },
  });

  const handleQuickSave = async () => {
    if (!formData.quick_description.trim()) {
      alert("Please provide at least a brief description");
      return;
    }

    setSaving(true);

    // Check if online
    if (!navigator.onLine) {
      // Save to IndexedDB as draft
      try {
        await saveDraft('emergency_log', formData, user?.email);
        alert("📱 Offline: Emergency saved as draft. Will sync when online.");
        onClose();
      } catch (error) {
        alert("Failed to save draft offline");
      }
      setSaving(false);
      return;
    }

    // Save to database if online
    try {
      await createEmergencyMutation.mutateAsync(formData);
      alert("✅ Emergency logged successfully");
    } catch (error) {
      // Fallback to draft if save fails
      try {
        await saveDraft('emergency_log', formData, user?.email);
        alert("⚠️ Server error: Saved as draft for later sync");
        onClose();
      } catch (draftError) {
        alert("Failed to save emergency log");
      }
    }
    
    setSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700 text-xl">
            <AlertTriangle className="w-6 h-6" />
            Emergency Log - Quick Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Online/Offline Status */}
          <div className="bg-gray-50 border rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-700">
                {navigator.onLine ? 'Online - will save immediately' : 'Offline - will save as draft'}
              </span>
            </div>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>

          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-2">
              ⚡ Quick Log for Emergencies
            </p>
            <p className="text-xs text-red-700">
              Fill in critical details now. You can add photos, costs, and detailed notes later from the Emergency Logs page.
              Timestamps are automatically recorded for insurance and vet records.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_type">Emergency Type *</Label>
              <Select
                value={formData.emergency_type}
                onValueChange={(value) => setFormData({...formData, emergency_type: value})}
              >
                <SelectTrigger id="emergency_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="predator_attack">Predator Attack</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="sudden_illness">Sudden Illness</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                  <SelectItem value="weather_damage">Weather Damage</SelectItem>
                  <SelectItem value="death">Death</SelectItem>
                  <SelectItem value="escape">Escape</SelectItem>
                  <SelectItem value="poisoning">Poisoning</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({...formData, severity: value})}
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="quick_description">What Happened? *</Label>
            <Textarea
              id="quick_description"
              value={formData.quick_description}
              onChange={(e) => setFormData({...formData, quick_description: e.target.value})}
              placeholder="Brief description of the emergency - you can add detailed notes later"
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="location">Location on Property</Label>
            <Input
              id="location"
              value={formData.location_on_property}
              onChange={(e) => setFormData({...formData, location_on_property: e.target.value})}
              placeholder="e.g., North pasture, Main barn, Chicken coop #2"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Timestamp:</strong> {new Date(formData.timestamp).toLocaleString()}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Exact time automatically recorded for insurance and veterinary records
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleQuickSave}
              disabled={saving || !formData.quick_description.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Quick Save Emergency"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}