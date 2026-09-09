import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, Waves } from "lucide-react";
import { fetchFloodZone, fetchWetlands } from "@/components/utils/siteDataUtils";

export default function AddPastureModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    acreage: "",
    location_notes: "",
    rest_period_days: 21,
    notes: "",
    latitude: "",
    longitude: "",
    flood_zone: "",
    wetlands_present: null
  });
  const [fetchingSiteData, setFetchingSiteData] = useState(false);
  const [siteDataError, setSiteDataError] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.acreage) {
        submitData.acreage = parseFloat(submitData.acreage);
      } else {
        delete submitData.acreage;
      }
      if (submitData.rest_period_days) {
        submitData.rest_period_days = parseInt(submitData.rest_period_days);
      }
      if (submitData.latitude) {
        submitData.latitude = parseFloat(submitData.latitude);
      } else {
        delete submitData.latitude;
      }
      if (submitData.longitude) {
        submitData.longitude = parseFloat(submitData.longitude);
      } else {
        delete submitData.longitude;
      }
      if (submitData.wetlands_present === null || submitData.wetlands_present === "") {
        delete submitData.wetlands_present;
      }
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "") delete submitData[key];
      });
      submitData.status = "resting";
      return base44.entities.Pasture.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastures'] });
      onClose();
    },
  });

  const hasCoords = formData.latitude && formData.longitude &&
    !isNaN(parseFloat(formData.latitude)) && !isNaN(parseFloat(formData.longitude));

  const handleFetchSiteData = async () => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    setFetchingSiteData(true);
    setSiteDataError(null);

    try {
      const [floodResult, wetlandsResult] = await Promise.all([
        fetchFloodZone(lat, lng),
        fetchWetlands(lat, lng)
      ]);

      const updates = {};
      if (floodResult?.flood_zone) {
        updates.flood_zone = floodResult.flood_zone;
      }
      if (wetlandsResult) {
        updates.wetlands_present = wetlandsResult.wetlands_present;
      }

      setFormData(prev => ({ ...prev, ...updates }));
    } catch (error) {
      setSiteDataError("Failed to fetch site data. Please try again.");
    } finally {
      setFetchingSiteData(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Pasture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Pasture Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., North Field, Back 40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Acreage</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.acreage}
                onChange={(e) => setFormData({ ...formData, acreage: e.target.value })}
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label>Rest Period (days)</Label>
              <Input
                type="number"
                value={formData.rest_period_days}
                onChange={(e) => setFormData({ ...formData, rest_period_days: e.target.value })}
                placeholder="21"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location Notes</Label>
            <Input
              value={formData.location_notes}
              onChange={(e) => setFormData({ ...formData, location_notes: e.target.value })}
              placeholder="e.g., North of the barn, near the creek"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g., 36.123456"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g., -86.123456"
              />
            </div>
          </div>

          {/* Fetch Site Data Button */}
          <div>
            <Button
              type="button"
              variant="outline"
              disabled={!hasCoords || fetchingSiteData}
              onClick={handleFetchSiteData}
              title={!hasCoords ? "Enter latitude and longitude first" : ""}
              className="w-full"
            >
              {fetchingSiteData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching Site Data...
                </>
              ) : (
                <>
                  <Waves className="w-4 h-4 mr-2" />
                  Fetch Site Data
                </>
              )}
            </Button>
            {siteDataError && (
              <p className="text-sm text-red-600 mt-1">{siteDataError}</p>
            )}
          </div>

          {/* Fetched site data display */}
          {(formData.flood_zone || formData.wetlands_present !== null) && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-cyan-900">Fetched Site Data</p>
              {formData.flood_zone && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Flood Zone:</span>
                  <span className="font-medium text-cyan-800">{formData.flood_zone}</span>
                </div>
              )}
              {formData.wetlands_present !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Wetlands Present:</span>
                  <span className="font-medium text-cyan-800">{formData.wetlands_present ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Soil type, forage quality, any issues..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || createMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {createMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Check className="w-4 h-4 mr-2" />Add Pasture</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}