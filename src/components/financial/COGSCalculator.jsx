import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Egg,
  Milk,
  Droplets,
  Settings,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, subMonths } from "date-fns";

const productionIcons = {
  eggs: Egg,
  milk: Milk,
  honey: Droplets,
  fiber: Droplets,
  meat: Droplets,
  other: Droplets
};

const productionColors = {
  eggs: "from-amber-500 to-orange-500",
  milk: "from-blue-500 to-cyan-500",
  honey: "from-yellow-500 to-amber-500",
  fiber: "from-purple-500 to-pink-500",
  meat: "from-red-500 to-rose-500",
  other: "from-gray-500 to-slate-500"
};

export default function COGSCalculator({ transactions = [], production = [] }) {
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = React.useState(false);
  const [laborRate, setLaborRate] = React.useState(15);

  // Fetch farm profile for labor rate
  const { data: farmProfiles = [] } = useQuery({
    queryKey: ['farm-profile-cogs'],
    queryFn: () => base44.entities.FarmProfile.list(),
  });

  const farmProfile = farmProfiles[0];

  React.useEffect(() => {
    if (farmProfile?.labor_rate_per_hour) {
      setLaborRate(farmProfile.labor_rate_per_hour);
    }
  }, [farmProfile]);

  const updateLaborRateMutation = useMutation({
    mutationFn: async (newRate) => {
      if (farmProfile) {
        return base44.entities.FarmProfile.update(farmProfile.id, { labor_rate_per_hour: newRate });
      } else {
        return base44.entities.FarmProfile.create({ 
          farm_name: "My Farm", 
          labor_rate_per_hour: newRate 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-profile-cogs'] });
      setShowSettings(false);
    }
  });

  // Calculate COGS for each production type
  const cogsData = useMemo(() => {
    // Get date range for calculations (last 3 months for relevance)
    const endDate = new Date();
    const startDate = subMonths(endDate, 3);

    // Filter transactions to expense categories that affect COGS
    const cogsCategories = ['feed', 'veterinary', 'labor', 'equipment', 'utilities'];
    const relevantExpenses = transactions.filter(t => 
      t.transaction_type === 'expense' && 
      cogsCategories.includes(t.category) &&
      new Date(t.transaction_date) >= startDate
    );

    // Sum expenses by category
    const expensesByCategory = relevantExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
      return acc;
    }, {});

    const totalCOGSExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

    // Filter production to same time period
    const relevantProduction = production.filter(p => 
      new Date(p.production_date) >= startDate
    );

    // Group production by type
    const productionByType = relevantProduction.reduce((acc, p) => {
      if (!acc[p.production_type]) {
        acc[p.production_type] = {
          totalQuantity: 0,
          unit: p.unit,
          records: []
        };
      }
      acc[p.production_type].totalQuantity += p.quantity || 0;
      acc[p.production_type].records.push(p);
      return acc;
    }, {});

    // Calculate total production units for allocation
    const totalProductionUnits = Object.values(productionByType).reduce(
      (sum, p) => sum + p.totalQuantity, 0
    );

    // Calculate COGS per unit for each production type
    const cogsByProduct = Object.entries(productionByType).map(([type, data]) => {
      // Allocate expenses proportionally based on production volume
      const allocationRatio = totalProductionUnits > 0 
        ? data.totalQuantity / totalProductionUnits 
        : 0;
      
      const allocatedExpenses = totalCOGSExpenses * allocationRatio;
      const cogsPerUnit = data.totalQuantity > 0 
        ? allocatedExpenses / data.totalQuantity 
        : 0;

      // Estimate labor cost (assume 0.1 hours per unit on average, adjustable)
      const laborHoursPerUnit = type === 'eggs' ? 0.02 : type === 'milk' ? 0.15 : 0.1;
      const laborCostPerUnit = laborHoursPerUnit * laborRate;

      const totalCostPerUnit = cogsPerUnit + laborCostPerUnit;

      // Get typical market price for profitability calculation
      const marketPrices = {
        eggs: 5.00, // per dozen
        milk: 8.00, // per gallon
        honey: 12.00, // per pound
        fiber: 15.00, // per pound
        meat: 6.00, // per pound
        other: 5.00
      };

      const marketPrice = marketPrices[type] || 5.00;
      const profitMargin = marketPrice > 0 
        ? ((marketPrice - totalCostPerUnit) / marketPrice) * 100 
        : 0;

      return {
        type,
        unit: data.unit,
        totalQuantity: data.totalQuantity,
        allocatedExpenses,
        cogsPerUnit,
        laborCostPerUnit,
        totalCostPerUnit,
        marketPrice,
        profitMargin,
        isProfitable: profitMargin > 0
      };
    });

    return {
      cogsByProduct,
      expensesByCategory,
      totalCOGSExpenses,
      periodStart: startDate,
      periodEnd: endDate
    };
  }, [transactions, production, laborRate]);

  const getProfitabilityIndicator = (margin) => {
    if (margin >= 30) return { color: "bg-green-100 text-green-800 border-green-200", label: "Highly Profitable", icon: TrendingUp };
    if (margin >= 10) return { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Profitable", icon: TrendingUp };
    if (margin >= 0) return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Break Even", icon: Minus };
    return { color: "bg-red-100 text-red-800 border-red-200", label: "Loss", icon: TrendingDown };
  };

  return (
    <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Profitability Indicator (COGS)
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure labor rate</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-gray-500">
          Cost of Goods Sold analysis for last 3 months
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings && (
          <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
            <Label htmlFor="labor-rate">Labor Rate ($/hour)</Label>
            <div className="flex gap-2">
              <Input
                id="labor-rate"
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <Button 
                size="sm"
                onClick={() => updateLaborRateMutation.mutate(laborRate)}
                disabled={updateLaborRateMutation.isPending}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Used to calculate labor costs in COGS
            </p>
          </div>
        )}

        {cogsData.cogsByProduct.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No production data available</p>
            <p className="text-sm">Log production to see COGS analysis</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cogsData.cogsByProduct.map((item) => {
              const Icon = productionIcons[item.type] || Droplets;
              const colorClass = productionColors[item.type] || productionColors.other;
              const indicator = getProfitabilityIndicator(item.profitMargin);
              const IndicatorIcon = indicator.icon;

              return (
                <div 
                  key={item.type}
                  className="p-4 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold capitalize">{item.type}</h4>
                        <p className="text-sm text-gray-500">
                          {item.totalQuantity.toFixed(1)} {item.unit} produced
                        </p>
                      </div>
                    </div>
                    <Badge className={`${indicator.color} flex items-center gap-1`}>
                      <IndicatorIcon className="w-3 h-3" />
                      {indicator.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-gray-500">COGS/Unit</p>
                      <p className="font-semibold">${item.cogsPerUnit.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-gray-500">Labor/Unit</p>
                      <p className="font-semibold">${item.laborCostPerUnit.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-purple-600">Total Cost/Unit</p>
                      <p className="font-bold text-purple-700">${item.totalCostPerUnit.toFixed(2)}</p>
                    </div>
                    <div className={`p-2 rounded ${item.isProfitable ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={item.isProfitable ? 'text-green-600' : 'text-red-600'}>Margin</p>
                      <p className={`font-bold ${item.isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                        {item.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Info className="w-3 h-3" />
                    <span>Based on ${item.marketPrice.toFixed(2)}/{item.unit} market price</span>
                  </div>
                </div>
              );
            })}

            {/* Expense Breakdown */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Expense Categories Included</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(cogsData.expensesByCategory).map(([category, amount]) => (
                  <Badge key={category} variant="outline" className="capitalize">
                    {category}: ${amount.toFixed(2)}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total COGS Expenses: ${cogsData.totalCOGSExpenses.toFixed(2)} 
                <span className="ml-2">
                  ({format(cogsData.periodStart, 'MMM d')} - {format(cogsData.periodEnd, 'MMM d, yyyy')})
                </span>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}