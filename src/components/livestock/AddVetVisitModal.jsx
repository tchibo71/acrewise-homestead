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
import { logVetVisitEvent } from "@/components/utils/farmHistoryLogger";

export default function AddVetVisitModal({ livestockId, onClose }) {
  const queryClient = useQueryClient();
  
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: animal } = useQuery({
    queryKey: ['livestock', livestockId],
    queryFn: async () => {
      const animals = await base44.entities.Livestock.list();
      return animals.find(a => a.id === livestockId) ?? null;
    },
    enabled: !!livestockId,
  });

  const showFamacha = animal?.animal_type === 'goat' || animal?.animal_type === 'sheep';

  const [formData, setFormData] = useState({
    livestock_id: livestockId,
    visit_date: new Date().toISOString().split('T')[0],
    visit_type: "checkup",
    veterinarian_name: "",
    diagnosis: "",
    treatment: "",
    medications: [],
    cost: "",
    famacha_score: "",
    body_condition_score: "",
    follow_up_date: "",
    notes: ""
  });

  const [medicationInput, setMedicationInput] = useState("");

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.VetVisit.create({
      ...data,
      cost: data.cost ? parseFloat(data.cost) : null,
      famacha_score: data.famacha_score ? parseInt(data.famacha_score) : null,
      body_condition_score: data.body_condition_score ? parseInt(data.body_condition_score) : null
    }),
    onSuccess: (newVisit) => {
      queryClient.invalidateQueries({ queryKey: ['vet-visits', livestockId] });
      queryClient.invalidateQueries({ queryKey: ['farm-activity-feed'] });
      logVetVisitEvent(newVisit);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if online
    if (!isOnline()) {
      try {
        await saveDraft('vet_visit', formData, currentUser?.email);
        alert("📱 Offline: Vet visit saved as draft. Will sync when online.");
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
      await saveDraft('vet_visit', formData, currentUser?.email);
      alert("✅ Draft saved! Will sync when online.");
      onClose();
    } catch (error) {
      alert("Failed to save draft");
    }
  };

  const addMedication = () => {
    if (medicationInput.trim()) {
      setFormData({
        ...formData,
        medications: [...formData.medications, medicationInput.trim()]
      });
      setMedicationInput("");
    }
  };

  const removeMedication = (index) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Veterinary Visit</DialogTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Visit Date *</Label>
              <Input
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Visit Type *</Label>
              <Select
                value={formData.visit_type}
                onValueChange={(value) => setFormData({...formData, visit_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="illness">Illness</SelectItem>
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Veterinarian Name</Label>
            <Input
              value={formData.veterinarian_name}
              onChange={(e) => setFormData({...formData, veterinarian_name: e.target.value})}
            />
          </div>

          <div>
            <Label>Diagnosis</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>Treatment</Label>
            <Textarea
              value={formData.treatment}
              onChange={(e) => setFormData({...formData, treatment: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>Medications</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={medicationInput}
                onChange={(e) => setMedicationInput(e.target.value)}
                placeholder="Enter medication name"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedication())}
              />
              <Button type="button" onClick={addMedication} variant="outline">
                Add
              </Button>
            </div>
            {formData.medications.length > 0 && (
              <div className="space-y-1">
                {formData.medications.map((med, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{med}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>

            <div>
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {showFamacha && (
              <div>
                <Label>FAMACHA Score</Label>
                <Select
                  value={formData.famacha_score}
                  onValueChange={(value) => setFormData({...formData, famacha_score: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="1–5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Healthy (red)</SelectItem>
                    <SelectItem value="2">2 — Mild</SelectItem>
                    <SelectItem value="3">3 — Moderate</SelectItem>
                    <SelectItem value="4">4 — Severe</SelectItem>
                    <SelectItem value="5">5 — Critical (white)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Eyelid color for parasite load</p>
              </div>
            )}

            <div className={showFamacha ? "" : "col-span-2"}>
              <Label>Body Condition Score</Label>
              <Select
                value={formData.body_condition_score}
                onValueChange={(value) => setFormData({...formData, body_condition_score: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="1–9" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Emaciated</SelectItem>
                  <SelectItem value="2">2 — Very thin</SelectItem>
                  <SelectItem value="3">3 — Thin</SelectItem>
                  <SelectItem value="4">4 — Borderline</SelectItem>
                  <SelectItem value="5">5 — Moderate</SelectItem>
                  <SelectItem value="6">6 — Good</SelectItem>
                  <SelectItem value="7">7 — Fleshy</SelectItem>
                  <SelectItem value="8">8 — Fat</SelectItem>
                  <SelectItem value="9">9 — Obese</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">1–9 scale</p>
            </div>
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
                {mutation.isPending ? "Adding..." : "Add Visit"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}