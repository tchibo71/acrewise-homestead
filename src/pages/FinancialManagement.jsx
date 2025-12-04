import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import TransactionList from "../components/financial/TransactionList";
import AddTransactionModal from "../components/financial/AddTransactionModal";
import COGSCalculator from "../components/financial/COGSCalculator";
import ExpenseParetoChart from "../components/financial/ExpenseParetoChart";
import ProfitTimeSeriesChart from "../components/financial/ProfitTimeSeriesChart";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

export default function FinancialManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-transaction_date'),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  const { data: production = [] } = useQuery({
    queryKey: ['production-cogs'],
    queryFn: () => base44.entities.Production.list('-production_date'),
  });

  const handleAddTransaction = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

  const totalIncome = transactions
    .filter(t => t.transaction_type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.transaction_type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalSales = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Financial Management</h1>
              <p className="text-gray-600 mt-1">Track income, expenses, and profitability</p>
            </div>
          </div>

          {/* Free Tier: Notes-Only Quick Entry */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Quick Financial Notes
                <Badge className="bg-green-100 text-green-700 border-green-300 ml-2">Free</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Jot down simple financial notes for your homestead. Upgrade to Pro for full accounting features.
              </p>
              <textarea
                className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder="E.g., Bought chicken feed - $45, Sold 2 dozen eggs - $12, Vet visit scheduled..."
              />
              <p className="text-xs text-gray-500 mt-2">
                * Notes are not saved. Upgrade for persistent tracking, charts, and reports.
              </p>
            </CardContent>
          </Card>

          {/* Locked Pro Features Preview */}
          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock Full Financial Suite</h3>
                <p className="text-gray-600 mb-4 max-w-md">
                  Get P&L dashboards, expense tracking, COGS calculators, and export tools
                </p>
                <Button
                  size="lg"
                  onClick={() => setShowPaywall(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade to Pro
                </Button>
              </div>
            </div>
            
            {/* Blurred preview of Pro features */}
            <CardContent className="py-8 opacity-40">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-green-700">$2,450.00</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">$1,230.00</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-green-700">$1,220.00</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-purple-700">$890.00</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Charts & Reports Preview</p>
              </div>
            </CardContent>
          </Card>

          {/* Pro Features List */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">What's Included in Pro Financial Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Profit & Loss Dashboard", desc: "Real-time P&L with visual charts" },
                  { title: "Expense Tracking", desc: "Categorize and track all farm expenses" },
                  { title: "COGS Calculator", desc: "Calculate cost per unit produced" },
                  { title: "Sales & Order Tracking", desc: "Track sales, customers, and orders" },
                  { title: "Yield-to-Revenue Calculator", desc: "Convert production to revenue estimates" },
                  { title: "Export to CSV/PDF", desc: "Download reports for tax prep" }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{feature.title}</p>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Financial management"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Financial Management</h1>
              <p className="text-gray-600 mt-1">Track your homestead's financial health</p>
            </div>
          </div>
          <Button 
            onClick={handleAddTransaction}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-green-700">${totalIncome.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-700">${totalExpenses.toFixed(2)}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${netProfit.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-purple-700">${totalSales.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Charts - horizontal scroll on mobile */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto md:overflow-visible">
            <div className="min-w-[400px] md:min-w-0">
              <ExpenseParetoChart transactions={transactions} />
            </div>
          </div>
          <div className="overflow-x-auto md:overflow-visible">
            <div className="min-w-[400px] md:min-w-0">
              <ProfitTimeSeriesChart transactions={transactions} />
            </div>
          </div>
        </div>

        {/* COGS Profitability Indicator */}
        <COGSCalculator transactions={transactions} production={production} />

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <Tabs value={filterPeriod} onValueChange={setFilterPeriod}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="year">This Year</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={filterCategory} onValueChange={setFilterCategory}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">All Categories</TabsTrigger>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="veterinary">Veterinary</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Transactions List */}
        <TransactionList 
          transactions={transactions}
          filterPeriod={filterPeriod}
          filterCategory={filterCategory}
        />

        {showAddModal && (
          <AddTransactionModal onClose={() => setShowAddModal(false)} />
        )}
      </div>
    </div>
  );
}