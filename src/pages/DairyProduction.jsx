import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Milk,
  Plus,
  TrendingUp,
  BarChart3,
  Calendar,
  Crown,
  GitBranch
} from "lucide-react";

import AddMilkProductionModal from "../components/dairy/AddMilkProductionModal";
import ProductionChart from "../components/dairy/ProductionChart";
import AnimalProductionReport from "../components/dairy/AnimalProductionReport";
import LineageProductionReport from "../components/dairy/LineageProductionReport";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

export default function DairyProduction() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: livestock = [] } = useQuery({
    queryKey: ['dairy-livestock'],
    queryFn: async () => {
      const animals = await base44.entities.Livestock.list();
      return animals.filter(a => 
        a.purpose === 'dairy' || a.purpose === 'multiple'
      );
    },
  });

  const { data: productions = [] } = useQuery({
    queryKey: ['milk-production'],
    queryFn: () => base44.entities.MilkProduction.list('-production_date'),
  });

  const handleAddProduction = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Milk className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dairy Production</h1>
              <p className="text-gray-600 mt-1">Track milk production and animal performance</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Dairy Production Tracking is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Track milk production, butterfat percentages, A2A2 status, and make data-driven breeding decisions with comprehensive production reports
              </p>

              <div className="max-w-md mx-auto mb-8 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">With Pro, you can:</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Log daily milk weights and quality metrics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">View production trends and charts over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <GitBranch className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Track offspring production for breeding decisions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Milk className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Monitor butterfat, protein, and A2A2 status</span>
                  </li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro - Starting at $2.99/mo
              </Button>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Dairy production tracking"
          />
        </div>
      </div>
    );
  }

  const totalProduction = productions.reduce((sum, p) => sum + (p.milk_weight_lbs || 0), 0);
  const avgDailyProduction = productions.length > 0 ? totalProduction / productions.length : 0;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Milk className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dairy Production</h1>
              <p className="text-gray-600 mt-1">{livestock.length} dairy animals tracked</p>
            </div>
          </div>
          <Button onClick={handleAddProduction} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Log Production
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Production</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProduction.toFixed(1)} lbs</p>
                </div>
                <Milk className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Per Milking</p>
                  <p className="text-2xl font-bold text-gray-900">{avgDailyProduction.toFixed(1)} lbs</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Records Logged</p>
                  <p className="text-2xl font-bold text-gray-900">{productions.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart">
              <BarChart3 className="w-4 h-4 mr-2" />
              Production Chart
            </TabsTrigger>
            <TabsTrigger value="animals">
              <Milk className="w-4 h-4 mr-2" />
              By Animal
            </TabsTrigger>
            <TabsTrigger value="lineage">
              <GitBranch className="w-4 h-4 mr-2" />
              Lineage Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-6">
            <ProductionChart productions={productions} livestock={livestock} />
          </TabsContent>

          <TabsContent value="animals" className="mt-6">
            <AnimalProductionReport livestock={livestock} productions={productions} />
          </TabsContent>

          <TabsContent value="lineage" className="mt-6">
            <LineageProductionReport livestock={livestock} productions={productions} />
          </TabsContent>
        </Tabs>

        {showAddModal && (
          <AddMilkProductionModal
            livestock={livestock}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    </div>
  );
}