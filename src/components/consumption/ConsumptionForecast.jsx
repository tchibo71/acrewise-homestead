import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, AlertTriangle, Calendar, Brain, Package } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function ConsumptionForecast() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list('-created_date'),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: () => base44.entities.InventoryTransaction.list('-transaction_date'),
  });

  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  React.useEffect(() => {
    const calculateForecasts = async () => {
      setLoading(true);
      const consumptionForecasts = [];

      // Focus on consumable items (feed, medications, fertilizer)
      const consumableItems = inventory.filter(item => 
        ['feed', 'medication', 'fertilizer', 'seeds', 'bedding'].includes(item.category) &&
        item.current_quantity > 0
      );

      for (const item of consumableItems) {
        // Get transactions for this item (withdrawals only)
        const itemTransactions = transactions.filter(t => 
          t.inventory_item_id === item.id && 
          t.transaction_type === 'withdrawal' &&
          t.quantity > 0
        ).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

        if (itemTransactions.length < 2) {
          // Not enough data to forecast
          continue;
        }

        // Calculate consumption rate from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentTransactions = itemTransactions.filter(t => 
          new Date(t.transaction_date) >= thirtyDaysAgo
        );

        if (recentTransactions.length === 0) continue;

        const totalConsumed = recentTransactions.reduce((sum, t) => sum + t.quantity, 0);
        const daysCovered = recentTransactions.length > 0 
          ? differenceInDays(new Date(), new Date(recentTransactions[recentTransactions.length - 1].transaction_date))
          : 30;

        const dailyConsumption = daysCovered > 0 ? totalConsumed / daysCovered : 0;

        if (dailyConsumption === 0) continue;

        const daysRemaining = Math.floor(item.current_quantity / dailyConsumption);
        const runoutDate = new Date();
        runoutDate.setDate(runoutDate.getDate() + daysRemaining);

        // Determine urgency
        let urgency = 'good';
        if (daysRemaining <= 3) urgency = 'critical';
        else if (daysRemaining <= 7) urgency = 'high';
        else if (daysRemaining <= 14) urgency = 'medium';

        consumptionForecasts.push({
          item,
          dailyConsumption: dailyConsumption.toFixed(2),
          daysRemaining,
          runoutDate,
          urgency,
          currentQuantity: item.current_quantity,
          totalConsumed,
          daysCovered
        });
      }

      // Sort by urgency (critical first)
      consumptionForecasts.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, good: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

      setForecasts(consumptionForecasts);
      setLoading(false);
    };

    if (inventory.length > 0) {
      calculateForecasts();
    } else {
      setLoading(false);
    }
  }, [inventory, transactions, livestock]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Brain className="w-12 h-12 text-purple-600 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-600">Analyzing consumption patterns...</p>
        </CardContent>
      </Card>
    );
  }

  if (forecasts.length === 0) {
    return (
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-semibold">AI Consumption Forecasting Active</p>
              <p className="text-xs text-blue-700 mt-1">
                Log at least 2 inventory withdrawals for any consumable item to see AI-powered runout predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Consumption Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {forecasts.map((forecast, idx) => {
          const urgencyColors = {
            critical: 'border-red-500 bg-red-50',
            high: 'border-orange-500 bg-orange-50',
            medium: 'border-yellow-500 bg-yellow-50',
            good: 'border-green-500 bg-green-50'
          };

          const urgencyBadges = {
            critical: 'bg-red-600 text-white',
            high: 'bg-orange-600 text-white',
            medium: 'bg-yellow-600 text-white',
            good: 'bg-green-600 text-white'
          };

          const progressPercent = Math.max(0, Math.min(100, (forecast.daysRemaining / 30) * 100));

          return (
            <div key={idx} className={`border-l-4 ${urgencyColors[forecast.urgency]} rounded-lg p-4`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    {forecast.item.item_name}
                    {forecast.urgency === 'critical' && (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {forecast.item.brand && `${forecast.item.brand} • `}
                    {forecast.item.category.replace(/_/g, ' ')}
                  </p>
                </div>
                <Badge className={urgencyBadges[forecast.urgency]}>
                  {forecast.urgency}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-bold text-gray-900">
                    {forecast.currentQuantity} {forecast.item.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Daily Usage:</span>
                  <span className="font-semibold text-gray-700">
                    {forecast.dailyConsumption} {forecast.item.unit}/day
                  </span>
                </div>

                <Progress value={progressPercent} className="h-2" />

                <div className="flex items-center justify-between text-sm pt-2">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Runs out:</span>
                  </div>
                  <span className={`font-bold ${
                    forecast.urgency === 'critical' ? 'text-red-700' :
                    forecast.urgency === 'high' ? 'text-orange-700' :
                    forecast.urgency === 'medium' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {format(forecast.runoutDate, 'MMM d, yyyy')} ({forecast.daysRemaining} days)
                  </span>
                </div>

                <div className="bg-white/50 rounded p-2 mt-2">
                  <p className="text-xs text-gray-600">
                    <strong>AI Analysis:</strong> Based on {forecast.totalConsumed.toFixed(1)} {forecast.item.unit} consumed 
                    over {forecast.daysCovered} days
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
          <p className="text-xs text-purple-800">
            <strong>💡 AI Tip:</strong> Forecasts update automatically as you log inventory withdrawals. 
            Keep your inventory transactions up-to-date for accurate predictions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}