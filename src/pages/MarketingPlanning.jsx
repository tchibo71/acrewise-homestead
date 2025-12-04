import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  Package,
  TrendingUp,
  Target,
  Edit,
  Trash2,
  Crown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";
import AddMarketingPlanModal from "../components/farm-planning/AddMarketingPlanModal";

const categoryColors = {
  meat: "bg-red-100 text-red-700",
  eggs: "bg-yellow-100 text-yellow-700",
  dairy: "bg-blue-100 text-blue-700",
  produce: "bg-green-100 text-green-700",
  value_added: "bg-purple-100 text-purple-700",
  fiber: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700"
};

const channelColors = {
  direct_consumer: "bg-green-100 text-green-700",
  farmers_market: "bg-orange-100 text-orange-700",
  csa: "bg-blue-100 text-blue-700",
  restaurant: "bg-purple-100 text-purple-700",
  wholesale: "bg-red-100 text-red-700",
  online: "bg-cyan-100 text-cyan-700",
  farm_store: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700"
};

export default function MarketingPlanning() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: marketingPlans = [], isLoading } = useQuery({
    queryKey: ['marketing-plans'],
    queryFn: () => base44.entities.MarketingPlan.list('-created_date'),
    enabled: subscriptionData.isPro
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingPlan.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-plans'] });
    },
  });

  const handleAdd = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingPlan(null);
    setShowAddModal(true);
  };

  const handleEdit = (plan) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingPlan(plan);
    setShowAddModal(true);
  };

  const handleDelete = (planId) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    if (confirm('Are you sure you want to delete this marketing plan?')) {
      deleteMutation.mutate(planId);
    }
  };

  const totalProducts = marketingPlans.length;
  const directToConsumer = marketingPlans.filter(p => p.sales_channel === 'direct_consumer').length;

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Marketing & Sales</h1>
              <p className="text-gray-600 mt-1">Product planning and market strategies</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Marketing & Sales is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to access AI-powered market analysis, competitor insights, branding strategies, and sales channel planning
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
            feature="Marketing & Sales Planning"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Marketing & Sales</h1>
              <p className="text-gray-600 mt-1">{totalProducts} products planned</p>
            </div>
          </div>
          <Button onClick={handleAdd} className="bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-pink-50 to-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-pink-700">{totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Direct-to-Consumer</p>
                  <p className="text-2xl font-bold text-green-700">{directToConsumer}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sales Channels</p>
                  <p className="text-2xl font-bold text-blue-700">{new Set(marketingPlans.map(p => p.sales_channel)).size}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Plans List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : marketingPlans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No marketing plans yet</h3>
              <p className="text-gray-500 mb-4">Start planning your product marketing and sales strategies</p>
              <Button onClick={handleAdd} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {marketingPlans.map(plan => (
              <Card key={plan.id} className="border-l-4 border-l-pink-600 hover:shadow-lg transition-shadow">
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <h3 className="text-xl font-semibold text-gray-900">{plan.product_name}</h3>
                        <Badge className={categoryColors[plan.product_category]}>
                          {plan.product_category.replace(/_/g, ' ')}
                        </Badge>
                        <Badge className={channelColors[plan.sales_channel]}>
                          {plan.sales_channel.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {plan.price_per_unit && (
                          <div className="text-sm">
                            <span className="text-gray-600">Price: </span>
                            <span className="font-semibold text-gray-900">
                              ${plan.price_per_unit}/{plan.unit_type}
                            </span>
                          </div>
                        )}
                        {plan.target_customer && (
                          <div className="text-sm">
                            <span className="text-gray-600">Target: </span>
                            <span className="text-gray-900">{plan.target_customer}</span>
                          </div>
                        )}
                        {plan.distribution_method && (
                          <div className="text-sm">
                            <span className="text-gray-600">Distribution: </span>
                            <span className="text-gray-900">{plan.distribution_method}</span>
                          </div>
                        )}
                        {plan.annual_production_goal && (
                          <div className="text-sm">
                            <span className="text-gray-600">Annual Goal: </span>
                            <span className="font-semibold text-gray-900">{plan.annual_production_goal} units</span>
                          </div>
                        )}
                      </div>

                      {plan.unique_selling_points && plan.unique_selling_points.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Unique Selling Points:</p>
                          <div className="flex flex-wrap gap-2">
                            {plan.unique_selling_points.map((usp, idx) => (
                              <Badge key={idx} variant="outline">{usp}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {plan.ai_marketing_analysis && (
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-3">
                          <p className="text-sm font-semibold text-purple-900 mb-1">AI Marketing Analysis:</p>
                          <p className="text-sm text-purple-800">{plan.ai_marketing_analysis}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddMarketingPlanModal
            plan={editingPlan}
            onClose={() => {
              setShowAddModal(false);
              setEditingPlan(null);
            }}
          />
        )}
      </div>
    </div>
  );
}