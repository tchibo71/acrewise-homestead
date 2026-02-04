import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart } from "recharts";
import { PieChart } from "lucide-react";

const categoryLabels = {
  feed: "Feed",
  veterinary: "Veterinary",
  equipment: "Equipment",
  seeds_plants: "Seeds/Plants",
  fertilizer: "Fertilizer",
  livestock_purchase: "Livestock",
  infrastructure: "Infrastructure",
  utilities: "Utilities",
  labor: "Labor",
  other: "Other"
};

const categoryColors = [
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // violet
  "#f43f5e"  // rose
];

export default React.memo(function ExpenseParetoChart({ transactions }) {
  // Memoize expensive calculations
  const paretoData = React.useMemo(() => {
    // Filter only expenses
    const expenses = transactions.filter(t => t.transaction_type === "expense");
    
    // Group by category
    const categoryTotals = {};
    expenses.forEach(tx => {
      const cat = tx.category || "other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (tx.amount || 0);
    });

    // Sort by amount descending
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    const totalExpenses = sortedCategories.reduce((sum, [_, amt]) => sum + amt, 0);

    // Calculate cumulative percentage for Pareto
    let cumulative = 0;
    const data = sortedCategories.slice(0, 5).map(([category, amount], idx) => {
      cumulative += amount;
      return {
        category: categoryLabels[category] || category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        cumulative: (cumulative / totalExpenses) * 100,
        color: categoryColors[idx]
      };
    });

    // Add "Others" if there are more categories
    if (sortedCategories.length > 5) {
      const othersTotal = sortedCategories.slice(5).reduce((sum, [_, amt]) => sum + amt, 0);
      cumulative += othersTotal;
      data.push({
        category: "Others",
        amount: othersTotal,
        percentage: (othersTotal / totalExpenses) * 100,
        cumulative: 100,
        color: "#9ca3af"
      });
    }

    return data;
  }, [transactions]);

  if (paretoData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Top Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No expense data available
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-gray-900">{data.category}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium text-red-600">${data.amount.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Share: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Cumulative: <span className="font-medium text-purple-600">{data.cumulative.toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-600" />
          Top Expense Categories (Pareto)
        </CardTitle>
        <p className="text-sm text-gray-500">
          Top categories contributing to total expenses
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 11 }}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="amount" radius={[4, 4, 0, 0]}>
                {paretoData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
              <Line 
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ fill: "#7c3aed", r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {paretoData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.category}</span>
              <span className="font-medium">({item.percentage.toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});