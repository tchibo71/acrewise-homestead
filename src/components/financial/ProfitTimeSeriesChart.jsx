import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export default function ProfitTimeSeriesChart({ transactions }) {
  // Generate last 12 months
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    months.push({
      date: monthDate,
      label: format(monthDate, 'MMM'),
      fullLabel: format(monthDate, 'MMM yyyy'),
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    });
  }

  // Calculate monthly income/expense
  const monthlyData = months.map(month => {
    const monthTransactions = transactions.filter(tx => {
      if (!tx.transaction_date) return false;
      const txDate = parseISO(tx.transaction_date);
      return isWithinInterval(txDate, { start: month.start, end: month.end });
    });

    const income = monthTransactions
      .filter(t => t.transaction_type === "income")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expenses = monthTransactions
      .filter(t => t.transaction_type === "expense")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netProfit = income - expenses;

    return {
      month: month.label,
      fullMonth: month.fullLabel,
      income,
      expenses,
      netProfit,
      isProfit: netProfit >= 0
    };
  });

  const avgProfit = monthlyData.reduce((sum, m) => sum + m.netProfit, 0) / 12;
  const maxProfit = Math.max(...monthlyData.map(m => m.netProfit));
  const minProfit = Math.min(...monthlyData.map(m => m.netProfit));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-gray-900 mb-2">{data.fullMonth}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              Income: <span className="font-medium">${data.income.toFixed(2)}</span>
            </p>
            <p className="text-red-600">
              Expenses: <span className="font-medium">${data.expenses.toFixed(2)}</span>
            </p>
            <div className="border-t pt-1 mt-1">
              <p className={data.netProfit >= 0 ? "text-green-700" : "text-red-700"}>
                Net: <span className="font-bold">${data.netProfit.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = monthlyData.some(m => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Monthly Profit/Loss Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No transaction data for the last 12 months
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Monthly Profit/Loss (12 Months)
        </CardTitle>
        <div className="flex gap-4 text-sm mt-1">
          <span className="text-gray-500">
            Avg: <span className={`font-medium ${avgProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${avgProfit.toFixed(0)}/mo
            </span>
          </span>
          <span className="text-gray-500">
            Best: <span className="font-medium text-green-600">${maxProfit.toFixed(0)}</span>
          </span>
          <span className="text-gray-500">
            Worst: <span className={`font-medium ${minProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${minProfit.toFixed(0)}
            </span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v >= 0 ? v : v}`}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="netProfit"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#profitGradient)"
                dot={{ fill: "#6366f1", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Profitable Months</p>
            <p className="text-lg font-bold text-green-600">
              {monthlyData.filter(m => m.netProfit > 0).length}/12
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total Net</p>
            <p className={`text-lg font-bold ${monthlyData.reduce((s, m) => s + m.netProfit, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${monthlyData.reduce((s, m) => s + m.netProfit, 0).toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Trend</p>
            <p className={`text-lg font-bold ${
              monthlyData[11]?.netProfit >= monthlyData[0]?.netProfit ? 'text-green-600' : 'text-red-600'
            }`}>
              {monthlyData[11]?.netProfit >= monthlyData[0]?.netProfit ? '↑ Up' : '↓ Down'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}