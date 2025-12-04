import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus,
  Sprout,
  TrendingUp,
  MapPin,
  Sparkles,
  Crown,
  Calendar,
  Droplets,
  Edit,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

const fruitIcons = {
  apple: "🍎",
  pear: "🍐",
  peach: "🍑",
  cherry: "🍒",
  plum: "🌑",
  apricot: "🧡",
  citrus: "🍊",
  fig: "🫐",
  persimmon: "🟠",
  nut_tree: "🌰",
  mixed: "🍇",
  other: "🌳"
};

const statusColors = {
  planning: "bg-gray-100 text-gray-700",
  establishing: "bg-yellow-100 text-yellow-700",
  producing: "bg-green-100 text-green-700",
  mature: "bg-emerald-100 text-emerald-700",
  declining: "bg-orange-100 text-orange-700"
};

export default function OrchardManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrchard, setEditingOrchard] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedOrchard, setSelectedOrchard] = useState(null);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: orchards = [], isLoading } = useQuery({
    queryKey: ['orchards'],
    queryFn: () => base44.entities.Orchard.list('-created_date'),
    enabled: subscriptionData.isPro
  });

  const deleteOrchardMutation = useMutation({
    mutationFn: (id) => base44.entities.Orchard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchards'] });
    },
  });

  const generateAIRecommendationsMutation = useMutation({
    mutationFn: async (orchard) => {
      const prompt = `As an expert orchardist, provide comprehensive recommendations for this ${orchard.fruit_type} orchard:

Orchard Details:
- Fruit Type: ${orchard.fruit_type}
- Total Trees: ${orchard.total_trees || 'not specified'}
- Area: ${orchard.area_acres || 'not specified'} acres
- Soil Type: ${orchard.soil_type || 'not specified'}
- Irrigation: ${orchard.irrigation_system || 'not specified'}
- Slope: ${orchard.slope_percentage || 'not specified'}%
- Tree Spacing: ${orchard.tree_spacing || 'not specified'}
- Status: ${orchard.status}
- Current Pollination Strategy: ${orchard.pollination_strategy || 'not specified'}

Provide detailed recommendations covering:
1. Optimal tree spacing and layout for this fruit type and acreage
2. Pollination strategy - which varieties to plant together for cross-pollination
3. Irrigation system recommendations and water management
4. Soil amendments and pH requirements for this fruit type
5. Pest and disease management strategy specific to this fruit
6. Pruning schedule and techniques
7. Fertilization program with NPK ratios and timing
8. Expected timeline to first harvest and full production
9. Recommended rootstock options
10. Tips for maximizing yield and fruit quality

Format as a comprehensive management plan.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      // Update orchard with AI recommendations
      await base44.entities.Orchard.update(orchard.id, {
        ...orchard,
        ai_recommendations: result
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchards'] });
      setShowAIModal(false);
      setSelectedOrchard(null);
    },
  });

  const handleAddOrchard = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingOrchard(null);
    setShowAddModal(true);
  };

  const handleEdit = (orchard) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingOrchard(orchard);
    setShowAddModal(true);
  };

  const handleDelete = (orchardId) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    if (confirm('Are you sure you want to delete this orchard? This action cannot be undone.')) {
      deleteOrchardMutation.mutate(orchardId);
    }
  };

  const handleGetAIRecommendations = (orchard) => {
    setSelectedOrchard(orchard);
    setShowAIModal(true);
  };

  const filteredOrchards = orchards.filter(o => 
    filterStatus === "all" || o.status === filterStatus
  );

  const totalTrees = orchards.reduce((sum, o) => sum + (o.total_trees || 0), 0);
  const totalAcres = orchards.reduce((sum, o) => sum + (o.area_acres || 0), 0);
  const producingOrchards = orchards.filter(o => o.status === "producing" || o.status === "mature").length;

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Orchard Management</h1>
              <p className="text-gray-600 mt-1">AI-powered scalable orchard planning and tracking</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Orchard Management is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to access comprehensive orchard tracking with individual tree monitoring, AI-powered planning recommendations, and scalable management tools
              </p>

              <div className="max-w-md mx-auto mb-8 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">With Pro, you get:</h3>
                <ul className="space-y-3 text-left">
                  {[
                    "Track multiple orchards and thousands of trees",
                    "AI-generated planting and spacing recommendations",
                    "Pollination strategy planning",
                    "Individual tree health monitoring",
                    "Harvest yield tracking per tree",
                    "Pest and disease management",
                    "Pruning and fertilization schedules",
                    "ROI and production forecasting"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Sprout className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

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
            feature="Orchard management"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Orchard Management</h1>
              <p className="text-gray-600 mt-1">
                {orchards.length} orchards • {totalTrees} trees • {totalAcres.toFixed(1)} acres
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("PropertyMap"))}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View Map
            </Button>
            <Button 
              onClick={handleAddOrchard}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Orchard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orchards</p>
                  <p className="text-2xl font-bold text-green-700">{orchards.length}</p>
                </div>
                <Sprout className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trees</p>
                  <p className="text-2xl font-bold text-blue-700">{totalTrees}</p>
                </div>
                <Sprout className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Acreage</p>
                  <p className="text-2xl font-bold text-purple-700">{totalAcres.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Producing</p>
                  <p className="text-2xl font-bold text-amber-700">{producingOrchards}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className="bg-white">
            <TabsTrigger value="all">All Orchards</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="establishing">Establishing</TabsTrigger>
            <TabsTrigger value="producing">Producing</TabsTrigger>
            <TabsTrigger value="mature">Mature</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orchards Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrchards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orchards yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first orchard</p>
              <Button onClick={handleAddOrchard} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Orchard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrchards.map(orchard => (
              <Card 
                key={orchard.id}
                className="hover:shadow-xl transition-all duration-200 cursor-pointer border-l-4 border-l-green-500"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{fruitIcons[orchard.fruit_type]}</div>
                      <div>
                        <CardTitle className="text-lg">{orchard.orchard_name}</CardTitle>
                        <p className="text-sm text-gray-600 capitalize">
                          {orchard.fruit_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[orchard.status]}>
                      {orchard.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {orchard.total_trees && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Sprout className="w-4 h-4" />
                        <span>{orchard.total_trees} trees</span>
                      </div>
                    )}
                    {orchard.area_acres && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{orchard.area_acres} acres</span>
                      </div>
                    )}
                    {orchard.irrigation_system && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Droplets className="w-4 h-4" />
                        <span className="capitalize">{orchard.irrigation_system}</span>
                      </div>
                    )}
                    {orchard.planting_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(orchard.planting_date).getFullYear()}</span>
                      </div>
                    )}
                  </div>

                  {orchard.tree_varieties && orchard.tree_varieties.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-1">Varieties:</p>
                      <div className="flex flex-wrap gap-1">
                        {orchard.tree_varieties.slice(0, 3).map((v, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {v.variety_name} ({v.count})
                          </Badge>
                        ))}
                        {orchard.tree_varieties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{orchard.tree_varieties.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!orchard.ai_recommendations && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetAIRecommendations(orchard);
                        }}
                        className="flex-1"
                        disabled={generateAIRecommendationsMutation.isPending}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {generateAIRecommendationsMutation.isPending && selectedOrchard?.id === orchard.id ? "Generating..." : "Get AI Plan"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(orchard);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(orchard.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>

                  {orchard.ai_recommendations && (
                    <div className="pt-2 border-t">
                      <Badge className="bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Recommendations Available
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* AI Recommendations Modal - simplified for now */}
        {showAIModal && selectedOrchard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Generate AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Generate comprehensive AI-powered recommendations for <strong>{selectedOrchard.orchard_name}</strong> including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>Optimal tree spacing and layout</li>
                  <li>Pollination strategy</li>
                  <li>Irrigation recommendations</li>
                  <li>Soil management</li>
                  <li>Pest and disease control</li>
                  <li>Pruning and fertilization schedules</li>
                  <li>Production timeline</li>
                </ul>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAIModal(false);
                      setSelectedOrchard(null);
                    }}
                    disabled={generateAIRecommendationsMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => generateAIRecommendationsMutation.mutate(selectedOrchard)}
                    disabled={generateAIRecommendationsMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generateAIRecommendationsMutation.isPending ? "Generating..." : "Generate Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}