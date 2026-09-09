import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sprout,
  MapPin,
  Search,
  Loader2,
  Snowflake,
  Calendar,
  Info,
  Leaf
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import PlantRecommendationCard from "@/components/planting/PlantRecommendationCard";

const USDA_ZONES = [
  "1a","1b","2a","2b","3a","3b","4a","4b","5a","5b",
  "6a","6b","7a","7b","8a","8b","9a","9b","10a","10b","11a","11b","12a","12b","13a","13b"
];

export default function WhatToPlantNow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedZone, setSelectedZone] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addedCrops, setAddedCrops] = useState(new Set());
  const [addedSecondPlantings, setAddedSecondPlantings] = useState(new Set());

  // Load farm profile to get saved zone
  const { data: farmProfiles = [] } = useQuery({
    queryKey: ['farm-profiles'],
    queryFn: () => base44.entities.FarmProfile.list()
  });

  // Load existing crop plans to mark already-added crops
  const { data: cropPlans = [] } = useQuery({
    queryKey: ['crop-plans'],
    queryFn: () => base44.entities.CropPlan.list('-planting_date')
  });

  useEffect(() => {
    if (farmProfiles.length > 0 && farmProfiles[0].usda_zone && !selectedZone) {
      setSelectedZone(farmProfiles[0].usda_zone);
    }
  }, [farmProfiles, selectedZone]);

  // Mark already-planned crops
  useEffect(() => {
    const planned = new Set(
      cropPlans
        .filter(p => p.year === new Date().getFullYear() && !p.is_second_planting)
        .map(p => p.crop_name?.toLowerCase())
    );
    setAddedCrops(planned);

    const secondPlanned = new Set(
      cropPlans
        .filter(p => p.year === new Date().getFullYear() && p.is_second_planting)
        .map(p => p.crop_name?.toLowerCase())
    );
    setAddedSecondPlantings(secondPlanned);
  }, [cropPlans]);

  const saveZoneMutation = useMutation({
    mutationFn: async ({ profileId, zone }) => {
      if (profileId) {
        return base44.entities.FarmProfile.update(profileId, { usda_zone: zone });
      } else {
        return base44.entities.FarmProfile.create({ farm_name: "My Homestead", usda_zone: zone });
      }
    },
  });

  const addToPlanMutation = useMutation({
    mutationFn: (crop) => {
      const today = new Date();
      const plantingDate = today.toISOString().split("T")[0];
      const harvestDate = new Date(
        today.getTime() + (crop.days_to_harvest || 0) * 86400000
      ).toISOString().split("T")[0];

      let plantingMethod = "direct_sow";
      if (crop.start_indoors_dates) plantingMethod = "start_indoors";
      else if (crop.transplant_dates) plantingMethod = "transplant_seedling";

      return base44.entities.CropPlan.create({
        crop_name: crop.name,
        year: today.getFullYear(),
        planting_date: plantingDate,
        harvest_date: harvestDate,
        days_to_harvest: crop.days_to_harvest,
        planting_method: plantingMethod,
        start_indoors_date: crop.start_indoors_dates ? plantingDate : null,
        hardening_days: crop.hardening_days || null,
        frost_tolerance: crop.frost_tolerance || null,
        germination_days: crop.germination_days || null,
        succession_interval_days: crop.succession_interval_days || 0,
        is_second_planting: false,
        notes: `Auto-added from planting recommendations. ${crop.description || ""}`.trim(),
        ai_recommendations: `Spacing: ${crop.spacing || "N/A"}. Soil temp: ${crop.soil_temperature || "N/A"}. Watering: ${crop.watering || "N/A"}. Companions: ${(crop.companion_plants || []).join(", ")}. Harvest: ${crop.harvest_tips || "N/A"}`,
      });
    },
    onSuccess: (data, crop) => {
      setAddedCrops(prev => new Set([...prev, crop.name.toLowerCase()]));
      queryClient.invalidateQueries(['crop-plans']);
      toast({ title: `${crop.name} added to your garden plan` });
    },
    onError: () => {
      toast({ title: "Could not add crop to plan", variant: "destructive" });
    },
  });

  const addSecondPlantingMutation = useMutation({
    mutationFn: (crop) => {
      const year = new Date().getFullYear();
      let plantingDateStr = new Date().toISOString().split("T")[0];
      // Try to parse the second planting window for a better date
      if (crop.second_planting_window) {
        const match = crop.second_planting_window.match(/(\w+)\s+(\d+)/);
        if (match) {
          const date = new Date(`${match[1]} ${match[2]}, ${year}`);
          if (!isNaN(date)) {
            plantingDateStr = date.toISOString().split("T")[0];
          }
        }
      }
      const plantingDate = new Date(plantingDateStr);
      const harvestDate = new Date(
        plantingDate.getTime() + (crop.days_to_harvest || 0) * 86400000
      ).toISOString().split("T")[0];

      return base44.entities.CropPlan.create({
        crop_name: crop.name,
        year: year,
        planting_date: plantingDateStr,
        harvest_date: harvestDate,
        days_to_harvest: crop.days_to_harvest,
        planting_method: crop.start_indoors_dates ? "start_indoors" : "direct_sow",
        frost_tolerance: crop.frost_tolerance || null,
        germination_days: crop.germination_days || null,
        is_second_planting: true,
        notes: `Second/succession planting. Window: ${crop.second_planting_window}. ${crop.description || ""}`.trim(),
        ai_recommendations: `Second planting window: ${crop.second_planting_window}. Spacing: ${crop.spacing || "N/A"}. Harvest: ${crop.harvest_tips || "N/A"}`,
      });
    },
    onSuccess: (data, crop) => {
      setAddedSecondPlantings(prev => new Set([...prev, crop.name.toLowerCase()]));
      queryClient.invalidateQueries(['crop-plans']);
      toast({ title: `${crop.name} second planting added` });
    },
    onError: () => {
      toast({ title: "Could not add second planting", variant: "destructive" });
    },
  });

  const handleGetRecommendations = async () => {
    if (!selectedZone) {
      toast({ title: "Please select your USDA zone first", variant: "destructive" });
      return;
    }

    setLoading(true);
    setRecommendations(null);

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    try {
      // Save zone to farm profile
      const profile = farmProfiles[0];
      saveZoneMutation.mutate({ profileId: profile?.id, zone: selectedZone });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a gardening expert. Today is ${dateStr}. The user is in USDA hardiness zone ${selectedZone}.

List the vegetables, herbs, and fruits that have an OPEN PLANTING WINDOW right now (this week) in zone ${selectedZone}. Consider the current season, frost dates typical for this zone, and which crops thrive when planted at this time of year.

For each crop, provide:
- name: crop name
- category: vegetable, herb, or fruit
- difficulty: easy, moderate, or challenging
- days_to_harvest: number of days from planting/transplanting to harvest
- germination_days: number of days for seeds to germinate
- planting_depth: e.g., "0.5 inches deep"
- spacing: e.g., "4 inches apart, 12 inches between rows"
- soil_temperature: ideal soil temp range for germination, e.g., "45°F - 75°F"
- sunlight_hours: e.g., "Full sun (6+ hours)" or "Partial shade (4 hours)"
- watering: brief watering instructions
- companion_plants: array of 3-5 companion plant names
- harvest_tips: brief harvest readiness signs
- description: one sentence describing the crop
- frost_tolerance: one of "Frost tolerant" (survives hard frost), "Half-hardy" (survives light frost), "Frost sensitive" (killed by any frost)
- start_indoors_relative: relative timing for starting seeds indoors, e.g., "6-8 weeks before last frost" — null if not applicable for this crop
- start_indoors_dates: calculated calendar date range for zone ${selectedZone}, e.g., "Jan 25 – Feb 15" — null if not applicable
- hardening_days: number of days to harden off seedlings before transplanting (typically 7) — null if not started indoors
- transplant_relative: relative timing for transplanting seedlings outdoors, e.g., "1-2 weeks after last frost" — null if not applicable
- transplant_dates: calculated calendar date range for zone ${selectedZone} — null if not applicable
- direct_sow_relative: relative timing for direct sowing outdoors, e.g., "2-4 weeks before last frost" — null if not applicable
- direct_sow_dates: calculated calendar date range for zone ${selectedZone} — null if not applicable
- second_planting_possible: boolean — can this crop be planted a second time later in the season?
- second_planting_window: date range for the second planting, e.g., "Aug 1 – Aug 15" — null if not possible
- succession_interval_days: how often to re-plant for continuous harvest, in days (e.g., 14 for radishes every 2 weeks) — 0 if not applicable

Also provide:
- first_frost_date: typical first fall frost date for zone ${selectedZone}
- last_frost_date: typical last spring frost date for zone ${selectedZone}
- zone_summary: a brief summary of what's happening this week in this zone

Return only crops that can genuinely be planted outdoors or started indoors right now. For each crop, include whichever planting methods apply (start_indoors, direct_sow, or both). Not all crops support all methods — set inapplicable fields to null.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            crops: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  difficulty: { type: "string" },
                  days_to_harvest: { type: "number" },
                  germination_days: { type: "number" },
                  planting_depth: { type: "string" },
                  spacing: { type: "string" },
                  soil_temperature: { type: "string" },
                  sunlight_hours: { type: "string" },
                  watering: { type: "string" },
                  companion_plants: { type: "array", items: { type: "string" } },
                  harvest_tips: { type: "string" },
                  description: { type: "string" },
                  frost_tolerance: { type: "string" },
                  start_indoors_relative: { type: "string" },
                  start_indoors_dates: { type: "string" },
                  hardening_days: { type: "number" },
                  transplant_relative: { type: "string" },
                  transplant_dates: { type: "string" },
                  direct_sow_relative: { type: "string" },
                  direct_sow_dates: { type: "string" },
                  second_planting_possible: { type: "boolean" },
                  second_planting_window: { type: "string" },
                  succession_interval_days: { type: "number" },
                },
              },
            },
            first_frost_date: { type: "string" },
            last_frost_date: { type: "string" },
            zone_summary: { type: "string" },
          },
        },
      });

      setRecommendations(result);
    } catch (err) {
      toast({ title: "Could not fetch recommendations. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="w-7 h-7 text-green-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">What to Plant Now</h1>
        </div>
        <p className="text-sm text-gray-600">
          Get zone-specific planting recommendations for this week — powered by AI with live web data.
        </p>
      </div>

      {/* Zone Selector */}
      <Card className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-green-600" />
                Your USDA Hardiness Zone
              </label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select your zone (1a – 13b)" />
                </SelectTrigger>
                <SelectContent>
                  {USDA_ZONES.map((zone) => (
                    <SelectItem key={zone} value={zone}>Zone {zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGetRecommendations}
              disabled={loading || !selectedZone}
              className="bg-green-600 hover:bg-green-700 text-white sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  What Can I Plant?
                </>
              )}
            </Button>
          </div>

          {/* Find zone link */}
          <p className="text-xs text-gray-500 mt-2">
            Don't know your zone?{" "}
            <a
              href="https://planthardiness.ars.usda.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 underline hover:text-green-800"
            >
              Look it up by zip code
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600 text-sm">
            Searching for crops you can plant this week in zone {selectedZone}...
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && recommendations && (
        <>
          {/* Frost dates & summary */}
          {(recommendations.first_frost_date || recommendations.last_frost_date || recommendations.zone_summary) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {recommendations.first_frost_date && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Snowflake className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-600 font-medium">First Fall Frost</p>
                      <p className="text-sm font-bold text-blue-900">{recommendations.first_frost_date}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {recommendations.last_frost_date && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600 shrink-0" />
                    <div>
                      <p className="text-xs text-orange-600 font-medium">Last Spring Frost</p>
                      <p className="text-sm font-bold text-orange-900">{recommendations.last_frost_date}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {recommendations.zone_summary && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3 flex items-start gap-2">
                    <Info className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-green-600 font-medium">This Week in Zone {selectedZone}</p>
                      <p className="text-xs text-green-900">{recommendations.zone_summary}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Crop count */}
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {recommendations.crops?.length || 0} Crops Ready to Plant
            </h2>
          </div>

          {/* Crop grid */}
          {recommendations.crops?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.crops.map((crop, i) => (
                <PlantRecommendationCard
                  key={i}
                  crop={crop}
                  onAddToPlan={(c) => addToPlanMutation.mutate(c)}
                  onAddSecondPlanting={(c) => addSecondPlantingMutation.mutate(c)}
                  added={addedCrops.has(crop.name?.toLowerCase())}
                  secondAdded={addedSecondPlantings.has(crop.name?.toLowerCase())}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">
                  No crops have an open planting window right now in zone {selectedZone}.
                  Try again next week or consider starting seeds indoors.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !recommendations && (
        <Card className="bg-gradient-to-br from-amber-50 to-green-50 border-green-200">
          <CardContent className="p-8 text-center">
            <Sprout className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ready to Plan Your Garden</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Select your USDA zone above and we'll search for crops that can be planted
              right now in your area — with planting depth, spacing, watering, companion plants, and harvest tips.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}