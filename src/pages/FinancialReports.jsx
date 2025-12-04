import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";
import ExportButtons from "../components/utils/ExportButtons";

export default function FinancialReports() {
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-transaction_date'),
    enabled: subscriptionData.isPro
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
    enabled: subscriptionData.isPro
  });

  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
    enabled: subscriptionData.isPro
  });

  const totalIncome = transactions.filter(t => t.transaction_type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.transaction_type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalSales = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const incomeReportData = {
    title: "Income Report",
    subtitle: `Homestead Acres Financial Report - ${format(new Date(), 'MMMM d, yyyy')}`,
    fileName: "homestead-acres-income-report",
    columns: [
      { key: 'transaction_date', label: 'Date', format: (val) => format(new Date(val), 'MM/dd/yyyy') },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', format: (val) => `$${(val || 0).toFixed(2)}` }
    ],
    data: transactions.filter(t => t.transaction_type === "income")
  };

  const expenseReportData = {
    title: "Expense Report",
    subtitle: `Homestead Acres Financial Report - ${format(new Date(), 'MMMM d, yyyy')}`,
    fileName: "homestead-acres-expense-report",
    columns: [
      { key: 'transaction_date', label: 'Date', format: (val) => format(new Date(val), 'MM/dd/yyyy') },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount', format: (val) => `$${(val || 0).toFixed(2)}` }
    ],
    data: transactions.filter(t => t.transaction_type === "expense")
  };

  const salesReportData = {
    title: "Sales Report",
    subtitle: `Homestead Acres Sales Report - ${format(new Date(), 'MMMM d, yyyy')}`,
    fileName: "homestead-acres-sales-report",
    columns: [
      { key: 'sale_date', label: 'Date', format: (val) => format(new Date(val), 'MM/dd/yyyy') },
      { key: 'item_description', label: 'Item' },
      { key: 'buyer_name', label: 'Buyer' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'sale_price', label: 'Price', format: (val) => `$${(val || 0).toFixed(2)}` }
    ],
    data: sales
  };

  const summaryReportData = {
    title: "Financial Summary",
    subtitle: `Homestead Acres Complete Financial Report - ${format(new Date(), 'MMMM d, yyyy')}`,
    fileName: "homestead-acres-financial-summary",
    columns: [
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount', format: (val) => `$${(val || 0).toFixed(2)}` }
    ],
    data: [
      { category: 'Total Income', amount: totalIncome },
      { category: 'Total Expenses', amount: totalExpenses },
      { category: 'Total Sales', amount: totalSales },
      { category: 'Net Profit', amount: netProfit }
    ]
  };

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600 mt-1">Comprehensive financial analysis for your homestead</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Financial Reports is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to access detailed financial breakdowns, sales history, and comprehensive reports for your homestead.
              </p>
              <button
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-lg px-8 py-3 rounded-lg font-semibold"
              >
                <Crown className="w-5 h-5 mr-2 inline" />
                Upgrade to Pro
              </button>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Financial Reports"
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600 mt-1">Comprehensive financial analysis for your homestead</p>
            </div>
          </div>
          <ExportButtons 
            data={summaryReportData.data}
            columns={summaryReportData.columns}
            title={summaryReportData.title}
            subtitle={summaryReportData.subtitle}
            fileName={summaryReportData.fileName}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
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

          <Card>
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

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-blue-700">${totalSales.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${netProfit.toFixed(2)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Income Transactions</CardTitle>
                  <ExportButtons 
                    data={incomeReportData.data}
                    columns={incomeReportData.columns}
                    title={incomeReportData.title}
                    subtitle={incomeReportData.subtitle}
                    fileName={incomeReportData.fileName}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {transactions.filter(t => t.transaction_type === "income").length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.filter(t => t.transaction_type === "income").map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(transaction.transaction_date), 'MM/dd/yyyy')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">${(transaction.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No income transactions found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Expense Transactions</CardTitle>
                  <ExportButtons 
                    data={expenseReportData.data}
                    columns={expenseReportData.columns}
                    title={expenseReportData.title}
                    subtitle={expenseReportData.subtitle}
                    fileName={expenseReportData.fileName}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {transactions.filter(t => t.transaction_type === "expense").length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.filter(t => t.transaction_type === "expense").map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(transaction.transaction_date), 'MM/dd/yyyy')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">${(transaction.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No expense transactions found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Sales History</CardTitle>
                  <ExportButtons 
                    data={salesReportData.data}
                    columns={salesReportData.columns}
                    title={salesReportData.title}
                    subtitle={salesReportData.subtitle}
                    fileName={salesReportData.fileName}
                    variant="outline"
                    size="sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {sales.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sales.map((sale) => (
                          <tr key={sale.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(sale.sale_date), 'MM/dd/yyyy')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.item_description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.buyer_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{sale.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-medium">${(sale.sale_price || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No sales records found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}