import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Edit,
  Trash2,
  Crown,
  FileText
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";
import AddStartupCostModal from "../components/farm-planning/AddStartupCostModal";
import AddBudgetModal from "../components/farm-planning/AddBudgetModal";
import AddLoanModal from "../components/farm-planning/AddLoanModal";

export default function FinancialPlanning() {
  const [activeSection, setActiveSection] = useState("startup");
  const [showStartupModal, setShowStartupModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: startupCosts = [] } = useQuery({
    queryKey: ['startup-costs'],
    queryFn: () => base44.entities.StartupCost.list('-purchase_date'),
    enabled: subscriptionData.isPro
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-year'),
    enabled: subscriptionData.isPro
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.FinancialLoan.list('-start_date'),
    enabled: subscriptionData.isPro
  });

  const deleteStartupMutation = useMutation({
    mutationFn: (id) => base44.entities.StartupCost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['startup-costs'] }),
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const deleteLoanMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialLoan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] }),
  });

  const totalStartupCosts = startupCosts.reduce((sum, c) => sum + (c.cost || 0), 0);
  const totalCurrentValue = startupCosts.reduce((sum, c) => sum + (c.current_value || 0), 0);
  const totalLoanBalance = loans.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.current_balance || 0), 0);

  const categoryColors = {
    land: "bg-green-100 text-green-700",
    buildings: "bg-blue-100 text-blue-700",
    equipment: "bg-purple-100 text-purple-700",
    livestock: "bg-orange-100 text-orange-700",
    vehicles: "bg-red-100 text-red-700",
    fencing: "bg-yellow-100 text-yellow-700",
    irrigation: "bg-cyan-100 text-cyan-700",
    legal_fees: "bg-gray-100 text-gray-700",
    permits: "bg-pink-100 text-pink-700",
    other: "bg-slate-100 text-slate-700"
  };

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Financial Planning</h1>
              <p className="text-gray-600 mt-1">Startup costs, budgets, and financial forecasting</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Financial Planning is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to track startup costs, create budgets, manage loans, and get AI-powered financial forecasts
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
            feature="Financial Planning"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Financial Planning</h1>
            <p className="text-gray-600 mt-1">Comprehensive financial tracking and forecasting</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Startup Investment</p>
                  <p className="text-2xl font-bold text-blue-700">${totalStartupCosts.toFixed(0)}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Asset Value</p>
                  <p className="text-2xl font-bold text-green-700">${totalCurrentValue.toFixed(0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding Loans</p>
                  <p className="text-2xl font-bold text-red-700">${totalLoanBalance.toFixed(0)}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="bg-white">
            <TabsTrigger value="startup">Startup Costs</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="loans">Loans & Financing</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Startup Costs Section */}
        {activeSection === "startup" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Startup & Capital Costs</h2>
              <Button onClick={() => { setEditingItem(null); setShowStartupModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Cost
              </Button>
            </div>

            {startupCosts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No startup costs recorded</h3>
                  <p className="text-gray-500 mb-4">Track land, equipment, buildings, and other initial investments</p>
                  <Button onClick={() => setShowStartupModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Cost
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {startupCosts.map(cost => (
                  <Card key={cost.id} className="border-l-4 border-l-emerald-600 hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{cost.item_name}</h3>
                            <Badge className={categoryColors[cost.category]}>
                              {cost.category.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">Cost: ${cost.cost.toFixed(2)}</span>
                            {cost.current_value && (
                              <span>Current Value: ${cost.current_value.toFixed(2)}</span>
                            )}
                            {cost.purchase_date && (
                              <span>Purchased: {new Date(cost.purchase_date).toLocaleDateString()}</span>
                            )}
                            {cost.useful_life_years && (
                              <span>Life: {cost.useful_life_years} years</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(cost); setShowStartupModal(true); }}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete this cost?')) deleteStartupMutation.mutate(cost.id); }}>
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

        {/* Budgets Section */}
        {activeSection === "budgets" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Farm Budgets</h2>
              <Button onClick={() => { setEditingItem(null); setShowBudgetModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </div>

            {budgets.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No budgets created</h3>
                  <p className="text-gray-500 mb-4">Create whole-farm, enterprise-specific, or partial budgets</p>
                  <Button onClick={() => setShowBudgetModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Budget
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {budgets.map(budget => (
                  <Card key={budget.id} className="border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{budget.budget_name}</h3>
                            <Badge variant="outline">{budget.year}</Badge>
                            <Badge className="capitalize">{budget.budget_type.replace(/_/g, ' ')}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Projected Revenue:</span>
                              <p className="font-semibold text-green-700">${(budget.projected_revenue || 0).toFixed(0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Actual Revenue:</span>
                              <p className="font-semibold text-green-700">${(budget.actual_revenue || 0).toFixed(0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Projected Expenses:</span>
                              <p className="font-semibold text-red-700">${(budget.projected_expenses || 0).toFixed(0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Actual Expenses:</span>
                              <p className="font-semibold text-red-700">${(budget.actual_expenses || 0).toFixed(0)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(budget); setShowBudgetModal(true); }}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete this budget?')) deleteBudgetMutation.mutate(budget.id); }}>
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

        {/* Loans Section */}
        {activeSection === "loans" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Loans & Financing</h2>
              <Button onClick={() => { setEditingItem(null); setShowLoanModal(true); }} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Loan
              </Button>
            </div>

            {loans.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No loans recorded</h3>
                  <p className="text-gray-500 mb-4">Track mortgages, equipment loans, and lines of credit</p>
                  <Button onClick={() => setShowLoanModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Loan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {loans.map(loan => (
                  <Card key={loan.id} className="border-l-4 border-l-red-600 hover:shadow-lg transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{loan.loan_name}</h3>
                            <Badge className="capitalize">{loan.loan_type.replace(/_/g, ' ')}</Badge>
                            <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                              {loan.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Lender: {loan.lender}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Original Amount:</span>
                              <p className="font-semibold">${(loan.original_amount || 0).toFixed(0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Current Balance:</span>
                              <p className="font-semibold text-red-700">${(loan.current_balance || 0).toFixed(0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Interest Rate:</span>
                              <p className="font-semibold">{loan.interest_rate}%</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Monthly Payment:</span>
                              <p className="font-semibold">${(loan.monthly_payment || 0).toFixed(0)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingItem(loan); setShowLoanModal(true); }}>
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete this loan?')) deleteLoanMutation.mutate(loan.id); }}>
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

        {showStartupModal && (
          <AddStartupCostModal
            cost={editingItem}
            onClose={() => { setShowStartupModal(false); setEditingItem(null); }}
          />
        )}

        {showBudgetModal && (
          <AddBudgetModal
            budget={editingItem}
            onClose={() => { setShowBudgetModal(false); setEditingItem(null); }}
          />
        )}

        {showLoanModal && (
          <AddLoanModal
            loan={editingItem}
            onClose={() => { setShowLoanModal(false); setEditingItem(null); }}
          />
        )}
      </div>
    </div>
  );
}