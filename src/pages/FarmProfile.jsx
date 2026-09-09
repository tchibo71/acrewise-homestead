import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Plus,
  Trash2,
  Sparkles,
  Save,
  CheckCircle2,
  Crown,
  Search,
  Loader2,
  ListChecks
} from "lucide-react";
import { checkSubscription } from "@/components/utils/subscriptionUtils";

import PaywallModal from "../components/paywall/PaywallModal";
import PhotoAnalysisUploader from "@/components/farm-profile/PhotoAnalysisUploader";
import AddRecommendationsToChecklist from "@/components/checklists/AddRecommendationsToChecklist";
import SiteDataCard from "@/components/farm-profile/SiteDataCard";

export default function FarmProfile() {
  const queryClient = useQueryClient();
  const [showPaywall, setShowPaywall] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['farm-profile'],
    queryFn: async () => {
      const profiles = await base44.entities.FarmProfile.list();
      return profiles[0] || null;
    },
    enabled: subscriptionData.isPro
  });

  const { data: propertyMap } = useQuery({
    queryKey: ['property-map'],
    queryFn: async () => {
      const maps = await base44.entities.PropertyMap.list();
      return maps[0] || null;
    },
    enabled: subscriptionData.isPro
  });

  const [formData, setFormData] = useState({
    farm_name: "",
    location_address: "",
    grid_coordinates: "",
    plat_map_number: "",
    total_acreage: "",
    usable_acreage: "",
    soil_types: [],
    infrastructure: [],
    water_sources: [],
    soil_series: "",
    flood_zone: "",
    is_in_floodplain: null,
    elevation_ft: null,
    hardiness_zone: "",
    wetlands_present: null,
    site_data_fetched_date: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        farm_name: profile.farm_name || "",
        location_address: profile.location_address || "",
        grid_coordinates: profile.grid_coordinates || "",
        plat_map_number: profile.plat_map_number || "",
        total_acreage: profile.total_acreage || "",
        usable_acreage: profile.usable_acreage || "",
        soil_types: profile.soil_types || [],
        infrastructure: profile.infrastructure || [],
        water_sources: profile.water_sources || [],
        soil_series: profile.soil_series || "",
        flood_zone: profile.flood_zone || "",
        is_in_floodplain: profile.is_in_floodplain ?? null,
        elevation_ft: profile.elevation_ft ?? null,
        hardiness_zone: profile.hardiness_zone || "",
        wetlands_present: profile.wetlands_present ?? null,
        site_data_fetched_date: profile.site_data_fetched_date || ""
      });
      if (profile.ai_recommendations) {
        setAiRecommendations(profile.ai_recommendations);
      }
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return await base44.entities.FarmProfile.update(profile.id, data);
      } else {
        return await base44.entities.FarmProfile.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleGeocodeAddress = async () => {
    if (!formData.location_address) {
      alert("Please enter an address first");
      return;
    }

    setGeocoding(true);
    try {
      // ONE backend call: geocodes the address AND fetches all site data
      const response = await base44.functions.invoke("fetchSiteData", {
        address: formData.location_address,
      });
      const data = response?.data ?? response;

      if (data.error) {
        alert(data.error);
        return;
      }

      const lat = data.coordinates.lat;
      const lon = data.coordinates.lon;
      const formattedAddress = data.formatted_address || formData.location_address;

      // Build the full update: coordinates + all site data in one shot
      const fullUpdate = {
        ...formData,
        grid_coordinates: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
        location_address: formattedAddress,
        soil_series: data.soil_series?.soil_series ?? formData.soil_series,
        flood_zone: data.flood_zone?.flood_zone ?? formData.flood_zone,
        is_in_floodplain: data.flood_zone?.is_in_floodplain ?? formData.is_in_floodplain,
        elevation_ft: data.elevation?.elevation_ft ?? formData.elevation_ft,
        hardiness_zone: data.hardiness_zone?.hardiness_zone ?? formData.hardiness_zone,
        wetlands_present: data.wetlands?.wetlands_present ?? formData.wetlands_present,
        site_data_fetched_date: new Date().toISOString().split("T")[0],
        ai_recommendations: aiRecommendations,
        last_updated: new Date().toISOString().split("T")[0],
      };

      setFormData(fullUpdate);

      // Update user's property location for weather
      await base44.auth.updateMe({
        property_latitude: lat,
        property_longitude: lon,
      });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });

      // Save everything to the profile so it persists and displays immediately
      await saveMutation.mutateAsync(fullUpdate);
    } catch (error) {
      const msg = error?.response?.data?.error || error?.data?.error || error.message || "Failed to geocode address";
      alert(msg);
    } finally {
      setGeocoding(false);
    }
  };

  const generateAIMutation = useMutation({
    mutationFn: async () => {
      const prompt = `As an expert permaculture designer and farm planner, analyze this farm profile and provide comprehensive recommendations:

Farm Profile:
- Name: ${formData.farm_name}
- Location: ${formData.location_address}
- Total Acreage: ${formData.total_acreage || 'Unknown'}
- Usable Acreage: ${formData.usable_acreage || 'Unknown'}
- Soil Types: ${formData.soil_types.map(s => s.soil_type).join(', ') || 'Unknown'}
- Existing Infrastructure: ${formData.infrastructure.map(i => i.type).join(', ') || 'None'}
- Water Sources: ${formData.water_sources.map(w => w.source_type).join(', ') || 'None'}

Provide detailed, actionable recommendations for:
1. Property improvements and optimal layout
2. Infrastructure priorities based on current setup
3. Water management and irrigation strategies
4. Soil health and amendment strategies
5. Crop selection based on location and soil
6. Livestock integration possibilities
7. Permaculture zones and design principles
8. Long-term sustainability strategies

Format as clear, numbered sections with specific actionable advice.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true
      });

      return result;
    },
    onSuccess: (data) => {
      setAiRecommendations(data);
      setLoadingAI(false);
    },
    onError: () => {
      setLoadingAI(false);
    }
  });

  const handleGenerateAI = () => {
    setLoadingAI(true);
    generateAIMutation.mutate();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveMutation.mutateAsync({
      ...formData,
      ai_recommendations: aiRecommendations,
      last_updated: new Date().toISOString().split('T')[0]
    });
  };

  const handleSaveSiteData = async (siteData) => {
    await saveMutation.mutateAsync({
      ...formData,
      ...siteData,
      ai_recommendations: aiRecommendations,
      last_updated: new Date().toISOString().split('T')[0]
    });
  };

  const addSoilType = () => {
    setFormData({
      ...formData,
      soil_types: [...formData.soil_types, { soil_type: "", location: "", depth: "", acreage: "" }]
    });
  };

  const removeSoilType = (index) => {
    setFormData({
      ...formData,
      soil_types: formData.soil_types.filter((_, i) => i !== index)
    });
  };

  const updateSoilType = (index, field, value) => {
    const updated = [...formData.soil_types];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, soil_types: updated });
  };

  const addInfrastructure = () => {
    setFormData({
      ...formData,
      infrastructure: [...formData.infrastructure, { type: "", description: "", condition: "good", year_built: "" }]
    });
  };

  const removeInfrastructure = (index) => {
    setFormData({
      ...formData,
      infrastructure: formData.infrastructure.filter((_, i) => i !== index)
    });
  };

  const updateInfrastructure = (index, field, value) => {
    const updated = [...formData.infrastructure];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, infrastructure: updated });
  };

  const addWaterSource = () => {
    setFormData({
      ...formData,
      water_sources: [...formData.water_sources, { source_type: "", capacity: "", location: "" }]
    });
  };

  const removeWaterSource = (index) => {
    setFormData({
      ...formData,
      water_sources: formData.water_sources.filter((_, i) => i !== index)
    });
  };

  const updateWaterSource = (index, field, value) => {
    const updated = [...formData.water_sources];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, water_sources: updated });
  };

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Farm Profile is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Upgrade to create your comprehensive farm profile with AI-powered recommendations
              </p>
              <Button
                size="lg"
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Farm Profile"
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <p className="text-gray-600">Loading farm profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Farm Profile</h1>
              <p className="text-gray-600 mt-1">Location, acreage, and infrastructure with AI recommendations</p>
            </div>
          </div>
          {formData.grid_coordinates && (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              GPS Calculated
            </Badge>
          )}
        </div>

        {saved && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Profile saved successfully!</span>
              </div>
            </CardContent>
          </Card>
        )}

        <PhotoAnalysisUploader
          formData={formData}
          onApply={(newData) => setFormData(newData)}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Farm Name *</Label>
                <Input
                  value={formData.farm_name}
                  onChange={(e) => setFormData({...formData, farm_name: e.target.value})}
                  placeholder="e.g., Green Valley Farm"
                  required
                />
              </div>

              <div>
                <Label>Physical Address *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.location_address}
                    onChange={(e) => setFormData({...formData, location_address: e.target.value})}
                    placeholder="123 Farm Road, City, State ZIP"
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={geocoding || !formData.location_address}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {geocoding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Get GPS
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your property address and click "Get GPS" to automatically calculate coordinates
                </p>
              </div>

              <div>
                <Label>GPS Coordinates</Label>
                <Input
                  value={formData.grid_coordinates}
                  onChange={(e) => setFormData({...formData, grid_coordinates: e.target.value})}
                  placeholder="40.7128, -74.0060 (auto-calculated from address)"
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically calculated when you enter address, or manually entered
                </p>
              </div>

              <div>
                <Label>Plat/Parcel Number</Label>
                <Input
                  value={formData.plat_map_number}
                  onChange={(e) => setFormData({...formData, plat_map_number: e.target.value})}
                  placeholder="Legal plat or parcel identification"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Total Acreage</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_acreage}
                    onChange={(e) => setFormData({...formData, total_acreage: e.target.value})}
                    placeholder="e.g., 10.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    May be auto-found from address or enter manually
                  </p>
                </div>
                <div>
                  <Label>Usable Acreage</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.usable_acreage}
                    onChange={(e) => setFormData({...formData, usable_acreage: e.target.value})}
                    placeholder="e.g., 8.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Soil Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Soil Types</CardTitle>
                <Button type="button" onClick={addSoilType} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Soil Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.soil_types.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No soil types added yet</p>
              ) : (
                formData.soil_types.map((soil, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Soil Type {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSoilType(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Soil type"
                        value={soil.soil_type}
                        onChange={(e) => updateSoilType(index, 'soil_type', e.target.value)}
                      />
                      <Input
                        placeholder="Location"
                        value={soil.location}
                        onChange={(e) => updateSoilType(index, 'location', e.target.value)}
                      />
                      <Input
                        placeholder="Depth"
                        value={soil.depth}
                        onChange={(e) => updateSoilType(index, 'depth', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Acreage"
                        value={soil.acreage}
                        onChange={(e) => updateSoilType(index, 'acreage', e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Infrastructure */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Infrastructure</CardTitle>
                <Button type="button" onClick={addInfrastructure} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Infrastructure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.infrastructure.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No infrastructure added yet</p>
              ) : (
                formData.infrastructure.map((infra, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Infrastructure {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInfrastructure(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Type (barn, fence, etc.)"
                        value={infra.type}
                        onChange={(e) => updateInfrastructure(index, 'type', e.target.value)}
                      />
                      <Input
                        placeholder="Year built"
                        value={infra.year_built}
                        onChange={(e) => updateInfrastructure(index, 'year_built', e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Description"
                      value={infra.description}
                      onChange={(e) => updateInfrastructure(index, 'description', e.target.value)}
                    />
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={infra.condition}
                      onChange={(e) => updateInfrastructure(index, 'condition', e.target.value)}
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Water Sources */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Water Sources</CardTitle>
                <Button type="button" onClick={addWaterSource} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Water Source
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.water_sources.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No water sources added yet</p>
              ) : (
                formData.water_sources.map((water, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Water Source {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWaterSource(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Source type (well, pond, etc.)"
                        value={water.source_type}
                        onChange={(e) => updateWaterSource(index, 'source_type', e.target.value)}
                      />
                      <Input
                        placeholder="Capacity"
                        value={water.capacity}
                        onChange={(e) => updateWaterSource(index, 'capacity', e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Location"
                      value={water.location}
                      onChange={(e) => updateWaterSource(index, 'location', e.target.value)}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Site Data */}
          <SiteDataCard
            profile={profile}
            propertyMap={propertyMap}
            onSave={handleSaveSiteData}
          />

          {/* AI Recommendations */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Recommendations
                </CardTitle>
                <Button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={loadingAI || !formData.farm_name}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loadingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI Recommendations
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiRecommendations ? (
                <>
                  <Textarea
                    value={aiRecommendations}
                    onChange={(e) => setAiRecommendations(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowChecklistModal(true)}
                    className="mt-2 bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <ListChecks className="w-4 h-4 mr-2" />
                    Add Recommendations to Checklist
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Fill in your farm details and generate AI-powered recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </form>

        <AddRecommendationsToChecklist
          isOpen={showChecklistModal}
          onClose={() => setShowChecklistModal(false)}
          recommendationsText={aiRecommendations}
          sourceCategory="property_engineering"
          sourceTitle={formData.farm_name}
        />
      </div>
    </div>
  );
}