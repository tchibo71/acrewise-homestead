import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Sprout, Target, Package, Heart, ChevronUp, ChevronDown, Wind } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function ROIAnalytics() {
  const [showCalculations, setShowCalculations] = React.useState(false);
  const [seedSortKey, setSeedSortKey] = React.useState('variety');
  const [seedSortDir, setSeedSortDir] = React.useState('asc');
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

  const { data: transactions = [] } = useQuery({
    queryKey: ['financial-transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-transaction_date'),
  });

  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  const { data: seedBatches = [] } = useQuery({
    queryKey: ['seed-batches'],
    queryFn: () => base44.entities.SeedBatch.list('-sow_date'),
  });

  const { data: cropPlans = [] } = useQuery({
    queryKey: ['crop-plans'],
    queryFn: () => base44.entities.CropPlan.list(),
  });

  const { data: farmProfile = null } = useQuery({
    queryKey: ['farm-profile'],
    queryFn: async () => {
      const profiles = await base44.entities.FarmProfile.list();
      return profiles[0] || null;
    },
  });

  // Lazy calculations - only run when user requests
  const calculateGardenROI = React.useCallback(() => {
    if (!showCalculations) return [];
    return gardens.map(garden => {
      const gardenHarvests = harvests.filter(h => h.garden_plot_id === garden.id);
      const totalValue = gardenHarvests.reduce((sum, h) => sum + (h.market_value || h.actual_sale_value || 0), 0);
      const totalHarvested = gardenHarvests.reduce((sum, h) => sum + h.quantity_harvested, 0);
      
      // Estimate costs from expenses linked to this plot or general gardening
      const relatedExpenses = transactions.filter(e => 
        e.transaction_type === 'expense' && (e.category === 'seeds_plants' || e.category === 'fertilizer')
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
  }, [gardens, harvests, transactions, showCalculations]);

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
    const feedExpenses = transactions.filter(e => e.transaction_type === 'expense' && e.category === 'feed');
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
  }, [production, transactions, showCalculations]);

  // Calculate per-animal livestock profitability
  const calculateLivestockProfitability = React.useCallback(() => {
    if (!showCalculations) return null;
    if (livestock.length === 0) return null;

    const results = livestock.map(animal => {
      const animalTxns = transactions.filter(t => t.livestock_id === animal.id);
      const totalCost = (animal.acquisition_cost || 0) +
        animalTxns.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
      const incomeFromTxns = animalTxns.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);

      let saleIncome = 0;
      if (animal.status === 'sold') {
        const saleRecord = sales.find(s => s.livestock_id === animal.id);
        if (saleRecord) {
          saleIncome = saleRecord.sale_price || 0;
        }
      }
      const totalIncome = incomeFromTxns + saleIncome;
      const netProfit = totalIncome - totalCost;

      return {
        id: animal.id,
        name: animal.name_or_tag || 'Unknown',
        type: animal.animal_type,
        status: animal.status,
        totalCost,
        totalIncome,
        netProfit,
        hasSale: animal.status === 'sold' && !!sales.find(s => s.livestock_id === animal.id)
      };
    });

    const grandTotalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
    const grandTotalIncome = results.reduce((sum, r) => sum + r.totalIncome, 0);
    const grandNetProfit = grandTotalIncome - grandTotalCost;
    const totalAcreage = farmProfile?.total_acreage;
    const incomePerAcre = totalAcreage > 0 ? grandTotalIncome / totalAcreage : null;

    return {
      animals: results,
      grandTotalCost,
      grandTotalIncome,
      grandNetProfit,
      incomePerAcre
    };
  }, [livestock, transactions, sales, farmProfile, showCalculations]);

  // Calculate seed starting performance metrics
  const calculateSeedStartingPerformance = React.useCallback(() => {
    if (!showCalculations) return null;
    if (seedBatches.length === 0) return null;

    const batchData = seedBatches.map(batch => {
      const batchExpenses = transactions.filter(
        t => t.transaction_type === 'expense' && t.seed_batch_id === batch.id
      );
      const expenseTotal = batchExpenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalCost = (batch.seed_cost || 0) + expenseTotal;

      const germinationRate = batch.seeds_sown > 0
        ? (batch.seeds_germinated || 0) / batch.seeds_sown
        : 0;
      const hardeningSurvivalRate = batch.hardening_started_count > 0
        ? (batch.hardening_survived_count || 0) / batch.hardening_started_count
        : 0;
      const overallSurvivalRate = batch.seeds_sown > 0
        ? (batch.hardening_survived_count || 0) / batch.seeds_sown
        : 0;

      const costPerGerminated = batch.seeds_germinated > 0
        ? totalCost / batch.seeds_germinated
        : null;
      const costPerSurviving = batch.hardening_survived_count > 0
        ? totalCost / batch.hardening_survived_count
        : null;

      const cropPlan = batch.crop_plan_id
        ? cropPlans.find(cp => cp.id === batch.crop_plan_id)
        : null;
      const year = cropPlan?.year || null;

      return {
        id: batch.id,
        cropName: batch.crop_name,
        variety: batch.variety || '—',
        year,
        seedsSown: batch.seeds_sown || 0,
        seedsGerminated: batch.seeds_germinated || 0,
        hardeningStarted: batch.hardening_started_count || 0,
        hardeningSurvived: batch.hardening_survived_count || 0,
        germinationRate,
        hardeningSurvivalRate,
        overallSurvivalRate,
        totalCost,
        costPerGerminated,
        costPerSurviving,
      };
    });

    // Summary grouping by crop_name + variety across all years
    const varietyMap = {};
    batchData.forEach(b => {
      const key = `${b.cropName}|||${b.variety}`;
      if (!varietyMap[key]) {
        varietyMap[key] = {
          cropName: b.cropName,
          variety: b.variety,
          batchCount: 0,
          germinationRates: [],
          hardeningSurvivalRates: [],
          overallSurvivalRates: [],
          years: [],
        };
      }
      const v = varietyMap[key];
      v.batchCount++;
      v.germinationRates.push(b.germinationRate);
      if (b.hardeningStarted > 0) v.hardeningSurvivalRates.push(b.hardeningSurvivalRate);
      v.overallSurvivalRates.push(b.overallSurvivalRate);
      if (b.year) v.years.push(b.year);
    });

    const varietySummary = Object.values(varietyMap).map(v => ({
      cropName: v.cropName,
      variety: v.variety,
      batchCount: v.batchCount,
      avgGerminationRate: v.germinationRates.length > 0
        ? v.germinationRates.reduce((s, r) => s + r, 0) / v.germinationRates.length
        : 0,
      avgHardeningSurvivalRate: v.hardeningSurvivalRates.length > 0
        ? v.hardeningSurvivalRates.reduce((s, r) => s + r, 0) / v.hardeningSurvivalRates.length
        : null,
      avgOverallSurvivalRate: v.overallSurvivalRates.length > 0
        ? v.overallSurvivalRates.reduce((s, r) => s + r, 0) / v.overallSurvivalRates.length
        : 0,
      years: v.years.length > 0
        ? `${Math.min(...v.years)}–${Math.max(...v.years)}`
        : '—',
    }));

    return { batches: batchData, varietySummary };
  }, [seedBatches, transactions, cropPlans, showCalculations]);

  const gardenROI = calculateGardenROI();
  const eggROI = calculateEggROI();
  const livestockROI = calculateLivestockProfitability();
  const seedPerformance = calculateSeedStartingPerformance();

  const sortedSeedBatches = React.useMemo(() => {
    if (!seedPerformance) return [];
    const sorted = [...seedPerformance.batches];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (seedSortKey) {
        case 'variety':
          aVal = `${a.cropName} ${a.variety}`;
          bVal = `${b.cropName} ${b.variety}`;
          break;
        case 'germinationRate':
          aVal = a.germinationRate;
          bVal = b.germinationRate;
          break;
        case 'hardeningSurvivalRate':
          aVal = a.hardeningSurvivalRate;
          bVal = b.hardeningSurvivalRate;
          break;
        case 'overallSurvivalRate':
          aVal = a.overallSurvivalRate;
          bVal = b.overallSurvivalRate;
          break;
        case 'costPerSurviving':
          aVal = a.costPerSurviving ?? Infinity;
          bVal = b.costPerSurviving ?? Infinity;
          break;
        default:
          aVal = a[seedSortKey] ?? 0;
          bVal = b[seedSortKey] ?? 0;
      }
      if (typeof aVal === 'string') {
        return seedSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return seedSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [seedPerformance, seedSortKey, seedSortDir]);

  const handleSeedSort = (key) => {
    if (seedSortKey === key) {
      setSeedSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSeedSortKey(key);
      setSeedSortDir('asc');
    }
  };

  const hasData = gardenROI.length > 0 || eggROI || livestockROI || seedPerformance;

  const canCalculate = harvests.length > 0 || production.length > 0 || livestock.length > 0 || seedBatches.length > 0;

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

          {/* Livestock Profitability */}
          {livestockROI && livestockROI.animals.length > 0 && (
            <div className="bg-white rounded-lg p-4 border-2 border-rose-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600" />
                  Livestock Profitability
                </h3>
                <Badge className={livestockROI.grandNetProfit >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                  {livestockROI.grandNetProfit >= 0 ? '+' : ''}${livestockROI.grandNetProfit.toFixed(2)} Net
                </Badge>
              </div>

              {/* Summary Row */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Total Cost (All Animals)</p>
                    <p className="text-lg font-bold text-red-700">${livestockROI.grandTotalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Income (All Animals)</p>
                    <p className="text-lg font-bold text-green-700">${livestockROI.grandTotalIncome.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Net Profit/Loss</p>
                    <p className={`text-lg font-bold ${livestockROI.grandNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {livestockROI.grandNetProfit >= 0 ? '+' : ''}${livestockROI.grandNetProfit.toFixed(2)}
                    </p>
                  </div>
                  {livestockROI.incomePerAcre !== null && (
                    <div>
                      <p className="text-xs text-gray-600">Income Per Acre</p>
                      <p className="text-lg font-bold text-blue-700">${livestockROI.incomePerAcre.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Per-Animal Breakdown */}
              <div className="space-y-3">
                {livestockROI.animals.map((animal) => (
                  <div key={animal.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {animal.name}
                        {animal.hasSale && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">Sold</Badge>
                        )}
                      </h4>
                      <Badge className={animal.netProfit >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                        {animal.netProfit >= 0 ? '+' : ''}${animal.netProfit.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-600">Total Cost</p>
                        <p className="font-bold text-red-700">${animal.totalCost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Income</p>
                        <p className="font-bold text-green-700">${animal.totalIncome.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-rose-50 rounded p-3 mt-4">
                <p className="text-xs text-rose-800">
                  <strong>📊 Profitability Insight:</strong> Track acquisition costs and ongoing expenses against
                  income from sales and production to identify your most profitable animals.
                  {livestockROI.incomePerAcre !== null && ` Your livestock generates $${livestockROI.incomePerAcre.toFixed(2)} per acre.`}
                </p>
              </div>
            </div>
          )}

          {/* Seed Starting Performance */}
          {seedPerformance && seedPerformance.batches.length > 0 && (
            <div className="bg-white rounded-lg p-4 border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  Seed Starting Performance
                </h3>
                <Badge className="bg-emerald-600 text-white">
                  {seedPerformance.batches.length} batches
                </Badge>
              </div>

              {/* Per-batch table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-xs text-gray-600">
                      <th className="text-left py-2 px-2 cursor-pointer hover:text-emerald-700" onClick={() => handleSeedSort('variety')}>
                        <span className="inline-flex items-center gap-1">Variety {seedSortKey === 'variety' && (seedSortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                      </th>
                      <th className="text-center py-2 px-2 cursor-pointer hover:text-emerald-700" onClick={() => handleSeedSort('germinationRate')}>
                        <span className="inline-flex items-center gap-1">Germ. Rate {seedSortKey === 'germinationRate' && (seedSortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                      </th>
                      <th className="text-center py-2 px-2 cursor-pointer hover:text-emerald-700" onClick={() => handleSeedSort('hardeningSurvivalRate')}>
                        <span className="inline-flex items-center gap-1">Hardening Survival {seedSortKey === 'hardeningSurvivalRate' && (seedSortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                      </th>
                      <th className="text-center py-2 px-2 cursor-pointer hover:text-emerald-700" onClick={() => handleSeedSort('overallSurvivalRate')}>
                        <span className="inline-flex items-center gap-1">Overall Survival {seedSortKey === 'overallSurvivalRate' && (seedSortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                      </th>
                      <th className="text-right py-2 px-2">Total Cost</th>
                      <th className="text-right py-2 px-2">Cost / Germ. Seedling</th>
                      <th className="text-right py-2 px-2 cursor-pointer hover:text-emerald-700" onClick={() => handleSeedSort('costPerSurviving')}>
                        <span className="inline-flex items-center gap-1">Cost / Surviving Plant {seedSortKey === 'costPerSurviving' && (seedSortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSeedBatches.map(b => (
                      <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <div className="font-medium text-gray-900">{b.cropName}</div>
                          <div className="text-xs text-gray-500">{b.variety}{b.year ? ` · ${b.year}` : ''}</div>
                        </td>
                        <td className="text-center py-2 px-2">
                          <span className={`font-medium ${(b.germinationRate * 100) >= 80 ? 'text-green-700' : (b.germinationRate * 100) >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                            {(b.germinationRate * 100).toFixed(0)}%
                          </span>
                          <div className="text-xs text-gray-400">{b.seedsGerminated}/{b.seedsSown}</div>
                        </td>
                        <td className="text-center py-2 px-2">
                          {b.hardeningStarted > 0 ? (
                            <>
                              <span className={`font-medium ${(b.hardeningSurvivalRate * 100) >= 80 ? 'text-green-700' : (b.hardeningSurvivalRate * 100) >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                                {(b.hardeningSurvivalRate * 100).toFixed(0)}%
                              </span>
                              <div className="text-xs text-gray-400">{b.hardeningSurvived}/{b.hardeningStarted}</div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">Not started</span>
                          )}
                        </td>
                        <td className="text-center py-2 px-2">
                          <span className={`font-medium ${(b.overallSurvivalRate * 100) >= 60 ? 'text-green-700' : (b.overallSurvivalRate * 100) >= 30 ? 'text-amber-700' : 'text-red-700'}`}>
                            {(b.overallSurvivalRate * 100).toFixed(0)}%
                          </span>
                          <div className="text-xs text-gray-400">{b.hardeningSurvived}/{b.seedsSown}</div>
                        </td>
                        <td className="text-right py-2 px-2 font-medium text-gray-900">${b.totalCost.toFixed(2)}</td>
                        <td className="text-right py-2 px-2 text-gray-700">
                          {b.costPerGerminated !== null ? `$${b.costPerGerminated.toFixed(2)}` : <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="text-right py-2 px-2 text-gray-700">
                          {b.costPerSurviving !== null ? `$${b.costPerSurviving.toFixed(2)}` : <span className="text-gray-400">N/A</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Variety Summary across years */}
              {seedPerformance.varietySummary.length > 1 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <Wind className="w-4 h-4 text-emerald-600" />
                    Variety Performance Over Time
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200 text-xs text-gray-600">
                          <th className="text-left py-2 px-2">Crop / Variety</th>
                          <th className="text-center py-2 px-2">Batches</th>
                          <th className="text-center py-2 px-2">Years</th>
                          <th className="text-center py-2 px-2">Avg Germ. Rate</th>
                          <th className="text-center py-2 px-2">Avg Hardening Survival</th>
                          <th className="text-center py-2 px-2">Avg Overall Survival</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seedPerformance.varietySummary.map((v, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-2">
                              <div className="font-medium text-gray-900">{v.cropName}</div>
                              <div className="text-xs text-gray-500">{v.variety}</div>
                            </td>
                            <td className="text-center py-2 px-2 text-gray-700">{v.batchCount}</td>
                            <td className="text-center py-2 px-2 text-gray-500 text-xs">{v.years}</td>
                            <td className="text-center py-2 px-2">
                              <span className={`font-medium ${(v.avgGerminationRate * 100) >= 80 ? 'text-green-700' : (v.avgGerminationRate * 100) >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                                {(v.avgGerminationRate * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="text-center py-2 px-2">
                              {v.avgHardeningSurvivalRate !== null ? (
                                <span className={`font-medium ${(v.avgHardeningSurvivalRate * 100) >= 80 ? 'text-green-700' : (v.avgHardeningSurvivalRate * 100) >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                                  {(v.avgHardeningSurvivalRate * 100).toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">No hardening</span>
                              )}
                            </td>
                            <td className="text-center py-2 px-2">
                              <span className={`font-medium ${(v.avgOverallSurvivalRate * 100) >= 60 ? 'text-green-700' : (v.avgOverallSurvivalRate * 100) >= 30 ? 'text-amber-700' : 'text-red-700'}`}>
                                {(v.avgOverallSurvivalRate * 100).toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-emerald-50 rounded p-3 mt-4">
                <p className="text-xs text-emerald-800">
                  <strong>🌱 Seed Starting Insight:</strong> Germination rate and hardening survival rate are shown
                  as separate columns so you can trace a low overall survival to whichever stage caused it.
                  Cost per surviving plant is your true cost per usable plant — the metric that matters for
                  pricing seedlings or comparing varieties.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}