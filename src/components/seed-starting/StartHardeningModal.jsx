import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { generateHardeningSchedule, checkHardeningWeatherWarnings } from "@/components/utils/hardeningScheduleUtils";
import { fetchDailyForecast } from "@/components/utils/weatherUtils";

export default function StartHardeningModal({ batch, onClose }) {
  const queryClient = useQueryClient();
  const defaultCount = batch.seeds_germinated ?? batch.seeds_sown ?? "";
  const [formData, setFormData] = useState({
    hardening_start_date: new Date().toISOString().split("T")[0],
    hardening_started_count: defaultCount,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key, value) => setFormData({ ...formData, [key]: value });
  const isValid = formData.hardening_start_date && formData.hardening_started_count !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update the SeedBatch with hardening start info
      const submitData = { ...formData };
      if (submitData.hardening_started_count) submitData.hardening_started_count = parseFloat(submitData.hardening_started_count);
      Object.keys(submitData).forEach(k => { if (submitData[k] === "") delete submitData[k]; });
      await base44.entities.SeedBatch.update(batch.id, submitData);

      // 2. Generate the day-by-day hardening schedule
      const totalDays = batch.hardening_days_planned ?? 10;
      const cropLabel = [batch.crop_name, batch.variety].filter(Boolean).join(" ");
      const schedule = generateHardeningSchedule(formData.hardening_start_date, totalDays, cropLabel);

      // 3. Fetch weather forecast for the hardening window (best-effort, skips silently on failure)
      let warnings = {};
      try {
        const profiles = await base44.entities.FarmProfile.list();
        const profile = profiles[0];
        if (profile?.grid_coordinates) {
          const coords = profile.grid_coordinates.split(",").map(s => parseFloat(s.trim()));
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            const forecast = await fetchDailyForecast(coords[0], coords[1], 7);
            warnings = checkHardeningWeatherWarnings(schedule, forecast);
          }
        }
      } catch (e) {
        // Weather check is a nice-to-have; proceed without warnings
      }

      // 4. Create one ChecklistItem per day in the schedule
      const checklistItems = schedule.map(day => ({
        title: day.title,
        category: "gardening",
        frequency: "one_time",
        due_date: day.date,
        seed_batch_id: batch.id,
        enable_reminders: true,
        notes: warnings[day.date]
          ? `${day.description}\n\n⚠️ ${warnings[day.date]}`
          : day.description,
      }));
      if (checklistItems.length > 0) {
        await base44.entities.ChecklistItem.bulkCreate(checklistItems);
      }

      // 5. Invalidate queries and close
      queryClient.invalidateQueries({ queryKey: ["seed-batches"] });
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      onClose();
    } catch (e) {
      alert("Failed to start hardening off. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start Hardening Off — {batch.crop_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Seeds germinated: <span className="font-semibold">{batch.seeds_germinated ?? "—"}</span>
            <br />
            Hardening days planned: <span className="font-semibold">{batch.hardening_days_planned ?? 10}</span>
          </div>
          <div className="space-y-2">
            <Label>Hardening Start Date *</Label>
            <Input type="date" value={formData.hardening_start_date} onChange={e => set("hardening_start_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Seedlings Entering Hardening *</Label>
            <Input type="number" value={formData.hardening_started_count} onChange={e => set("hardening_started_count", e.target.value)} placeholder="defaults to seeds germinated" />
            <p className="text-xs text-gray-500">May be less than seeds germinated if some were culled.</p>
          </div>
          <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2">
            On submit, {batch.hardening_days_planned ?? 10} daily checklist tasks will be created automatically. Weather warnings (frost, high wind, heavy rain) will be added to affected days if forecast data is available.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting} className="bg-amber-600 hover:bg-amber-700">
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Start Hardening</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}