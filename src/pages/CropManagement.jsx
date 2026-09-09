import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  Sprout,
  TestTube,
  Bug,
  Edit,
  Trash2,
  Crown,
  TrendingUp,
  ListChecks
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";
import AddCropPlanModal from "../components/farm-planning/AddCropPlanModal";
import AddSoilTestModal from "../components/farm-planning/AddSoilTestModal";
import AddPestManagementModal from "../components/farm-planning/AddPestManagementModal";
import ROIAnalytics from "../components/harvest/ROIAnalytics";
import AddHarvestModal from "../components/harvest/AddHarvestModal";
import AddRecommendationsToChecklist from "@/components/checklists/AddRecommendationsToChecklist";

export default function CropManagement() {
  const [activeSection, setActiveSection] = useState("crops");
  const [showCropModal, setShowCropModal] = useState(false);
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [showPestModal, setShowPestModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistRecommendations, setChecklistRecommendations] = useState("");
  const [checklistSourceCategory, setChecklistSourceCategory] = useState("");
  const [checklistSourceTitle, setChecklistSourceTitle] = useState("");
  const queryClient = useQueryClient();

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: crops = [] } = useQuery({
    queryKey: ['crop-plans'],
    queryFn: () => base44.entities.CropPlan.list('-planting_date'),
    enabled: subscriptionData.isPro
  });

  const { data: soilTests = [] } = useQuery({
    queryKey: ['soil-tests'],
    queryFn: () => base44.entities.SoilTest.list('-test_date'),
    enabled: subscriptionData.isPro
  });

  const { data: pestRecords = [] } = useQuery({
    queryKey: ['pest-management'],
    queryFn: () => base44.entities.PestManagement.list('-date_identified'),
    enabled: subscriptionData.isPro
  });

  const deleteCropMutation = useMutation({
    mutationFn: (id) => base44.entities.CropPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crop-plans'] }),
  });

  const deleteSoilMutation = useMutation({
    mutationFn: (id) => base44.entities.SoilTest.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['soil-tests'] }),
  });

  const deletePestMutation = useMutation({
    mutationFn: (id) => base44.entities.PestManagement.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pest-management'] }),
  });

  const currentYearCrops = crops.filter(c => c.year === new Date().getFullYear());
  const totalPlannedAcreage = currentYearCrops.reduce((sum, c) => sum + (c.acreage || 0), 0);

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-lime-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Crop Management</h1>
              <p className="text-gray-600 mt-1">Planting, rotation, soil health, and pest control</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Crop Management is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to access AI-powered crop planning, rotation recommendations, soil testing, and integrated pest management
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
            feature="Crop Management"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-lime-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Crop Management</h1>
            <p className="text-gray-600 mt-1">Comprehensive crop planning and monitoring</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Crops</p>
                  <p className="text-2xl font-bold text-green-700">{currentYearCrops.length}</p>
                </div>
                <Sprout className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planted Acreage</p>
                  <p className="text-2xl font-bold text-blue-700">{totalPlannedAcreage.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Soil Tests</p>
                  <p className="text-2xl font-bold text-purple-700">{soilTests.length}</p>
                </div>
                <TestTube className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI Analytics - Show harvest-to-revenue correlation */}
        <ROIAnalytics />

        {/* Section Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="bg-white">
            <TabsTrigger value="crops">Crop Plans</TabsTrigger>
            <TabsTrigger value="harvests">Harvest Records</TabsTrigger>
            <TabsTrigger value="soil">Soil Health</TabsTrigger>
            <TabsTrigger value="pest">Pest Management</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Crop Plans Section */}
        {activeSection === "crops" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Crop Planning & Rotation</h2>
              <Button onClick={() => { setEditingItem(null); setShowCropModal(true); }} className="bg-lime-600 hover:bg-lime-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Crop Plan
              </Button>
            </div>

            {crops.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No crop plans yet</h3>
                  <p className="text-gray-500 mb-4">Start planning your crops with AI-powered recommendations</p>
                  <Button onClick={() => setShowCropModal(true)} className="bg-lime-600 hover:bg-lime-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {crops.map(crop => (
                  <Card key={crop.id} className="border-l-4 border-l-lime-600 hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{crop.crop_name}</h3>
                            {crop.variety && <Badge variant="outline">{crop.variety}</Badge>}
                            <Badge>{crop.year}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            {crop.location && <span><strong>Location:</strong> {crop.location}</span>}
                            {crop.acreage && <span><strong>Acreage:</strong> {crop.acreage}</span>}
                            {crop.planting_date && <span><strong>Planting:</strong> {new Date(crop.planting_date).toLocaleDateString()}</span>}
                            {crop.harvest_date && <span><strong>Harvest:</strong> {new Date(crop.harvest_date).toLocaleDateString()}</span>}
                          </div>
                          {crop.ai_recommendations && (
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-2">
                              <p className="text-sm font-semibold text-purple-900 mb-1">AI Recommendations:</p>
                              <p className="text-sm text-purple-800">{crop.ai_recommendations}</p>
                              <Button variant="ghost" size="sm" className="mt-2 text-green-700 hover:bg-green-100 p-0 h-auto" onClick={() => { setChecklistRecommendations(crop.ai_recommendations); setChecklistSourceCategory("gardening"); setChecklistSourceTitle(crop.crop_name); setShowChecklistModal(true); }}>
                                <ListChecks className="w-4 h-4 mr-1" />
                                Add to Checklist
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(crop); setShowCropModal(true); }}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete this crop plan?')) deleteCropMutation.mutate(crop.id); }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Soil Health Section */}
        {activeSection === "soil" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Soil Testing & Nutrient Management</h2>
              <Button onClick={() => { setEditingItem(null); setShowSoilModal(true); }} className="bg-lime-600 hover:bg-lime-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Soil Test
              </Button>
            </div>

            {soilTests.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No soil tests recorded</h3>
                  <p className="text-gray-500 mb-4">Track soil health with regular testing and AI analysis</p>
                  <Button onClick={() => setShowSoilModal(true)} className="bg-lime-600 hover:bg-lime-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Test
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {soilTests.map(test => (
                  <Card key={test.id} className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{test.location}</h3>
                            <Badge>{new Date(test.test_date).toLocaleDateString()}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            {test.ph_level && <span><strong>pH:</strong> {test.ph_level}</span>}
                            {test.nitrogen_level && <span><strong>N:</strong> {test.nitrogen_level}</span>}
                            {test.phosphorus_level && <span><strong>P:</strong> {test.phosphorus_level}</span>}
                            {test.potassium_level && <span><strong>K:</strong> {test.potassium_level}</span>}
                          </div>
                          {test.ai_analysis && (
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-2">
                              <p className="text-sm font-semibold text-purple-900 mb-1">AI Analysis:</p>
                              <p className="text-sm text-purple-800">{test.ai_analysis}</p>
                              <Button variant="ghost" size="sm" className="mt-2 text-green-700 hover:bg-green-100 p-0 h-auto" onClick={() => { setChecklistRecommendations(test.ai_analysis); setChecklistSourceCategory("composting"); setChecklistSourceTitle(test.location); setShowChecklistModal(true); }}>
                                <ListChecks className="w-4 h-4 mr-1" />
                                Add to Checklist
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(test); setShowSoilModal(true); }}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete this soil test?')) deleteSoilMutation.mutate(test.id); }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Harvest Records Section */}
        {activeSection === "harvests" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Harvest Records & ROI Tracking</h2>
              <Button onClick={() => { setEditingItem(null); setShowHarvestModal(true); }} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Log Harvest
              </Button>
            </div>

            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="py-4">
                <p className="text-sm text-blue-800">
                  <strong>💰 ROI Insights:</strong> Each harvest record calculates your return on investment automatically. 
                  See detailed ROI analytics above to understand which crops are most profitable.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pest Management Section */}
        {activeSection === "pest" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Pest & Disease Management</h2>
              <Button onClick={() => { setEditingItem(null); setShowPestModal(true); }} className="bg-lime-600 hover:bg-lime-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </div>

            {pestRecords.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No pest records yet</h3>
                  <p className="text-gray-500 mb-4">Track pests and diseases with AI-powered treatment recommendations</p>
                  <Button onClick={() => setShowPestModal(true)} className="bg-lime-600 hover:bg-lime-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Record
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pestRecords.map(record => (
                  <Card key={record.id} className="border-l-4 border-l-orange-600 hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{record.pest_name}</h3>
                            <Badge className="capitalize">{record.pest_type}</Badge>
                            <Badge variant={record.severity === 'critical' ? 'destructive' : 'default'}>
                              {record.severity}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <p><strong>Affected:</strong> {record.affected_crop_or_animal}</p>
                            <p><strong>Location:</strong> {record.location}</p>
                            {record.treatment_method && <p><strong>Treatment:</strong> {record.treatment_method}</p>}
                          </div>
                          {record.ai_recommendations && (
                            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-2">
                              <p className="text-sm font-semibold text-purple-900 mb-1">AI Recommendations:</p>
                              <p className="text-sm text-purple-800">{record.ai_recommendations}</p>
                              <Button variant="ghost" size="sm" className="mt-2 text-green-700 hover:bg-green-100 p-0 h-auto" onClick={() => { setChecklistRecommendations(record.ai_recommendations); setChecklistSourceCategory("gardening"); setChecklistSourceTitle(record.pest_name); setShowChecklistModal(true); }}>
                                <ListChecks className="w-4 h-4 mr-1" />
                                Add to Checklist
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(record); setShowPestModal(true); }}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete this record?')) deletePestMutation.mutate(record.id); }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {showCropModal && (
          <AddCropPlanModal
            crop={editingItem}
            onClose={() => { setShowCropModal(false); setEditingItem(null); }}
          />
        )}

        {showSoilModal && (
          <AddSoilTestModal
            test={editingItem}
            onClose={() => { setShowSoilModal(false); setEditingItem(null); }}
          />
        )}

        {showPestModal && (
          <AddPestManagementModal
            record={editingItem}
            onClose={() => { setShowPestModal(false); setEditingItem(null); }}
          />
        )}

        {showHarvestModal && (
          <AddHarvestModal
            harvest={editingItem}
            onClose={() => { setShowHarvestModal(false); setEditingItem(null); }}
            />
            )}

            <AddRecommendationsToChecklist
            isOpen={showChecklistModal}
            onClose={() => setShowChecklistModal(false)}
            recommendationsText={checklistRecommendations}
            sourceCategory={checklistSourceCategory}
            sourceTitle={checklistSourceTitle}
            />
            </div>
            </div>
            );
            }