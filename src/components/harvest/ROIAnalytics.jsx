import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Sprout, Target, Package } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function ROIAnalytics() {
  const [showCalculations, setShowCalculations] = React.useState(false);
  const { data: harvests = [] } = useQuery({
    queryKey: ['harvest-records'],
    queryFn: () => base44.entities.HarvestRecord.list('-harvest_date'),
  });

  const { data: gardens = [] } = useQuery({
    queryKey: ['garden-plots'],
    queryFn: () => base44.entities.GardenPlot.list(),
  });

  const { data: orchards = [] } = useQuery({
    queryKey: ['orchards'],
    queryFn: () => base44.entities.Orchard.list(),
  });

  const { data: production = [] } = useQuery({
    queryKey: ['production'],
    queryFn: () => base44.entities.Production.list('-production_date'),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: async () => {
      const txns = await base44.entities.FinancialTransaction.list('-transaction_date');
      return txns.filter(t => t.transaction_type === 'expense');
    },
  });

  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  // Lazy calculations - only run when user requests
  const calculateGardenROI = React.useCallback(() => {
    if (!showCalculations) return [];
    return gardens.map(garden => {
      const gardenHarvests = harvests.filter(h => h.garden_plot_id === garden.id);
      const totalValue = gardenHarvests.reduce((sum, h) => sum + (h.market_value || h.actual_sale_value || 0), 0);
      const totalHarvested = gardenHarvests.reduce((sum, h) => sum + h.quantity_harvested, 0);
      
      // Estimate costs from expenses linked to this plot or general gardening
      const relatedExpenses = expenses.filter(e => 
        e.category === 'seeds_plants' || e.category === 'fertilizer'
      );
      const estimatedCost = relatedExpenses.length > 0 
        ? relatedExpenses.reduce((sum, e) => sum + e.amount, 0) / gardens.length 
        : 0;

      const roi = estimatedCost > 0 ? ((totalValue - estimatedCost) / estimatedCost * 100) : 0;
      const yieldPerSqFt = garden.area_sq_ft > 0 ? totalValue / garden.area_sq_ft : 0;

      return {
        name: garden.plot_name,
        totalValue: totalValue.toFixed(2),
        estimatedCost: estimatedCost.toFixed(2),
        roi: roi.toFixed(1),
        yieldPerSqFt: yieldPerSqFt.toFixed(2),
        totalHarvested,
        harvestCount: gardenHarvests.length
      };
    }).filter(g => g.harvestCount > 0);
  }, [gardens, harvests, expenses, showCalculations]);

  // Calculate cost per dozen eggs
  const calculateEggROI = React.useCallback(() => {
    if (!showCalculations) return null;
    const eggProduction = production.filter(p => p.production_type === 'eggs');
    if (eggProduction.length === 0) return null;

    const totalEggs = eggProduction.reduce((sum, p) => {
      const dozens = p.unit === 'dozen' ? p.quantity : p.quantity / 12;
      return sum + dozens;
    }, 0);

    // Calculate feed costs for egg-laying livestock
    const feedExpenses = expenses.filter(e => e.category === 'feed');
    const chickens = livestock.filter(l => l.animal_type === 'chicken' && l.purpose === 'eggs');
    
    const estimatedFeedCost = feedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const costPerDozen = totalEggs > 0 ? estimatedFeedCost / totalEggs : 0;

    // Market price estimate for eggs
    const avgMarketPrice = 6.00; // $6/dozen average
    const totalMarketValue = totalEggs * avgMarketPrice;
    const profit = totalMarketValue - estimatedFeedCost;
    const roi = estimatedFeedCost > 0 ? (profit / estimatedFeedCost * 100) : 0;

    return {
      totalDozens: totalEggs.toFixed(1),
      costPerDozen: costPerDozen.toFixed(2),
      totalFeedCost: estimatedFeedCost.toFixed(2),
      estimatedValue: totalMarketValue.toFixed(2),
      profit: profit.toFixed(2),
      roi: roi.toFixed(1),
      chickenCount: chickens.length
    };
  }, [production, expenses, showCalculations]);

  const gardenROI = calculateGardenROI();
  const eggROI = calculateEggROI();

  const hasData = gardenROI.length > 0 || eggROI;

  const canCalculate = harvests.length > 0 || production.length > 0;

  if (!showCalculations) {
    return (
      <Card className="border-purple-300 bg-purple-50">
        <CardContent className="py-8 text-center">
          <Target className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-purple-900 mb-2">ROI Analytics Ready</h3>
          <p className="text-sm text-purple-700 mb-4">
            {canCalculate 
              ? "Click below to calculate detailed return on investment metrics"
              : "Start logging harvests and production to see your ROI"}
          </p>
          {canCalculate && (
            <Button 
              onClick={() => setShowCalculations(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Calculate ROI
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="border-purple-300 bg-purple-50">
        <CardContent className="py-8 text-center">
          <Target className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold text-purple-900 mb-2">No ROI Data Yet</h3>
          <p className="text-sm text-purple-700">
            Log more harvests and production records to see detailed analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Return on Investment Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Egg Production ROI */}
          {eggROI && (
            <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Egg Production Analysis
                </h3>
                <Badge className={parseFloat(eggROI.roi) > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                  {parseFloat(eggROI.roi) > 0 ? '+' : ''}{eggROI.roi}% ROI
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Total Dozens Produced</p>
                  <p className="text-xl font-bold text-gray-900">{eggROI.totalDozens}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Cost Per Dozen</p>
                  <p className="text-xl font-bold text-orange-700">${eggROI.costPerDozen}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Market Value</p>
                  <p className="text-xl font-bold text-green-700">${eggROI.estimatedValue}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Feed Cost</p>
                  <p className="text-xl font-bold text-red-700">${eggROI.totalFeedCost}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Net Profit</p>
                  <p className={`text-xl font-bold ${parseFloat(eggROI.profit) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${eggROI.profit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Laying Hens</p>
                  <p className="text-xl font-bold text-blue-700">{eggROI.chickenCount}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded p-3 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>💡 Analysis:</strong> At ${eggROI.costPerDozen}/dozen vs $6.00 market average, 
                  your eggs are {parseFloat(eggROI.costPerDozen) < 6 ? 'profitable' : 'above market cost'}. 
                  {parseFloat(eggROI.roi) > 0 
                    ? ` Your ${eggROI.roi}% ROI justifies your Harmony Pro subscription!`
                    : ' Consider optimizing feed costs or increasing flock size.'}
                </p>
              </div>
            </div>
          )}

          {/* Garden/Raised Bed ROI */}
          {gardenROI.length > 0 && (
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-600" />
                Garden Plot Performance
              </h3>

              <div className="space-y-3">
                {gardenROI.map((garden, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{garden.name}</h4>
                      <Badge className={parseFloat(garden.roi) > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                        {parseFloat(garden.roi) > 0 ? '+' : ''}{garden.roi}% ROI
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">Market Value</p>
                        <p className="font-bold text-green-700">${garden.totalValue}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Input Costs</p>
                        <p className="font-bold text-red-700">${garden.estimatedCost}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Yield/Sq Ft</p>
                        <p className="font-bold text-blue-700">${garden.yieldPerSqFt}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Harvests</p>
                        <p className="font-bold text-purple-700">{garden.harvestCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 rounded p-3 mt-4">
                <p className="text-xs text-green-800">
                  <strong>💰 ROI Insight:</strong> Track which plots generate the best returns per square foot 
                  to optimize your planting strategy and prove the value of your homesteading efforts.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}