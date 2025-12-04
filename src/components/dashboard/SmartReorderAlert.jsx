import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Package, AlertTriangle, TrendingDown, X, Settings, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { subMonths, isAfter, parseISO } from "date-fns";

export default function SmartReorderAlert() {
  const queryClient = useQueryClient();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Load user preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem('smartReorderPrefs');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setAlertsEnabled(prefs.enabled ?? true);
      setDismissedAlerts(prefs.dismissed ?? []);
    }
  }, []);

  // Save preferences
  const savePreferences = (enabled, dismissed) => {
    localStorage.setItem('smartReorderPrefs', JSON.stringify({
      enabled,
      dismissed,
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleToggleAlerts = (enabled) => {
    setAlertsEnabled(enabled);
    savePreferences(enabled, dismissedAlerts);
  };

  const handleDismissAlert = (itemId) => {
    const newDismissed = [...dismissedAlerts, { id: itemId, dismissedAt: new Date().toISOString() }];
    setDismissedAlerts(newDismissed);
    savePreferences(alertsEnabled, newDismissed);
  };

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: () => base44.entities.InventoryItem.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-3mo'],
    queryFn: () => base44.entities.FinancialTransaction.list('-transaction_date', 500),
    staleTime: 5 * 60 * 1000,
  });

  // Calculate average monthly consumption from purchase transactions over last 3 months
  const threeMonthsAgo = subMonths(new Date(), 3);
  
  const categoryPurchases = {};
  transactions.forEach(tx => {
    if (tx.transaction_type !== 'expense') return;
    if (!tx.transaction_date) return;
    
    const txDate = parseISO(tx.transaction_date);
    if (!isAfter(txDate, threeMonthsAgo)) return;
    
    // Map transaction categories to inventory categories
    const categoryMap = {
      'feed': 'feed',
      'seeds_plants': 'seed',
      'fertilizer': 'fertilizer',
      'veterinary': 'medication',
      'livestock_purchase': null // Not inventory
    };
    
    const invCategory = categoryMap[tx.category];
    if (!invCategory) return;
    
    if (!categoryPurchases[invCategory]) {
      categoryPurchases[invCategory] = {
        totalAmount: 0,
        count: 0
      };
    }
    categoryPurchases[invCategory].totalAmount += tx.amount || 0;
    categoryPurchases[invCategory].count += 1;
  });

  // Calculate monthly average per category
  const monthlyAverages = {};
  Object.keys(categoryPurchases).forEach(cat => {
    monthlyAverages[cat] = categoryPurchases[cat].totalAmount / 3; // 3 months
  });

  // Generate smart reorder alerts
  const reorderAlerts = [];
  
  // Key categories to monitor
  const keyCategories = ['feed', 'seed', 'fertilizer', 'medication', 'vaccine', 'supplement'];
  
  inventoryItems.forEach(item => {
    // Skip if alerts disabled for this item
    if (item.enable_low_stock_alert === false) return;
    
    // Skip dismissed alerts (dismissed within last 7 days)
    const dismissedEntry = dismissedAlerts.find(d => d.id === item.id);
    if (dismissedEntry) {
      const dismissedDate = new Date(dismissedEntry.dismissedAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (dismissedDate > sevenDaysAgo) return;
    }
    
    // Only monitor key categories
    if (!keyCategories.includes(item.category)) return;
    
    const currentQty = item.current_quantity || 0;
    const minQty = item.minimum_quantity || 0;
    
    // Method 1: Below minimum quantity threshold
    if (minQty > 0 && currentQty <= minQty) {
      reorderAlerts.push({
        id: item.id,
        name: item.item_name,
        category: item.category,
        currentQty,
        minQty,
        unit: item.unit_type,
        reason: 'below_minimum',
        severity: currentQty === 0 ? 'critical' : 'warning',
        supplier: item.supplier,
        estimatedCost: item.unit_cost ? item.unit_cost * (item.reorder_quantity || minQty) : null
      });
      return;
    }
    
    // Method 2: Smart prediction based on purchase history
    const categoryAvg = monthlyAverages[item.category];
    if (categoryAvg && item.unit_cost) {
      // Estimate units purchased monthly (based on spend / unit cost)
      const estimatedMonthlyUsage = categoryAvg / item.unit_cost;
      
      // If current quantity is less than 1 month of estimated usage, alert
      if (currentQty > 0 && currentQty < estimatedMonthlyUsage * 0.75) {
        reorderAlerts.push({
          id: item.id,
          name: item.item_name,
          category: item.category,
          currentQty,
          estimatedMonthlyUsage: Math.round(estimatedMonthlyUsage),
          unit: item.unit_type,
          reason: 'predicted_shortage',
          severity: currentQty < estimatedMonthlyUsage * 0.25 ? 'critical' : 'warning',
          supplier: item.supplier,
          weeksRemaining: Math.round((currentQty / estimatedMonthlyUsage) * 4)
        });
      }
    }
  });

  // Sort by severity
  reorderAlerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return 0;
  });

  if (!alertsEnabled) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Package className="w-4 h-4" />
              <span className="text-sm">Smart Reorder Alerts disabled</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleToggleAlerts(true)}
            >
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reorderAlerts.length === 0) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              Inventory Status
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-sm">
            All inventory levels are healthy. No reorder needed.
          </p>
          {showSettings && (
            <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
              <Label htmlFor="alerts-toggle" className="text-sm text-green-700">
                Enable smart alerts
              </Label>
              <Switch 
                id="alerts-toggle"
                checked={alertsEnabled}
                onCheckedChange={handleToggleAlerts}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-5 h-5" />
            Low Stock Alerts ({reorderAlerts.length})
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showSettings && (
          <div className="p-3 bg-white rounded-lg border border-orange-200 mb-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="alerts-toggle-main" className="text-sm">
                Enable smart reorder alerts
              </Label>
              <Switch 
                id="alerts-toggle-main"
                checked={alertsEnabled}
                onCheckedChange={handleToggleAlerts}
              />
            </div>
          </div>
        )}

        {reorderAlerts.slice(0, 4).map(alert => (
          <div 
            key={alert.id} 
            className={`p-3 rounded-lg border ${
              alert.severity === 'critical' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-white border-orange-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Package className={`w-4 h-4 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <span className="font-medium text-sm truncate">{alert.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {alert.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <TrendingDown className="w-3 h-3" />
                  <span>
                    {alert.currentQty} {alert.unit} remaining
                    {alert.reason === 'below_minimum' && ` (min: ${alert.minQty})`}
                    {alert.reason === 'predicted_shortage' && alert.weeksRemaining !== undefined && 
                      ` (~${alert.weeksRemaining} weeks left)`
                    }
                  </span>
                </div>
                {alert.supplier && (
                  <p className="text-xs text-gray-500 mt-1">
                    Supplier: {alert.supplier}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                onClick={() => handleDismissAlert(alert.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {reorderAlerts.length > 4 && (
          <p className="text-xs text-orange-700 text-center pt-2">
            +{reorderAlerts.length - 4} more items low
          </p>
        )}

        <Link to={createPageUrl("InventoryManagement")}>
          <Button variant="outline" size="sm" className="w-full mt-2">
            <Package className="w-4 h-4 mr-2" />
            Manage Inventory
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}