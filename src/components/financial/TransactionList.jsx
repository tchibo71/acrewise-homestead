import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";

const categoryColors = {
  feed: "bg-amber-100 text-amber-700",
  veterinary: "bg-blue-100 text-blue-700",
  equipment: "bg-gray-100 text-gray-700",
  seeds_plants: "bg-green-100 text-green-700",
  fertilizer: "bg-lime-100 text-lime-700",
  livestock_purchase: "bg-purple-100 text-purple-700",
  infrastructure: "bg-indigo-100 text-indigo-700",
  utilities: "bg-cyan-100 text-cyan-700",
  labor: "bg-orange-100 text-orange-700",
  sales: "bg-emerald-100 text-emerald-700",
  products: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-700"
};

export default function TransactionList({ transactions, filterPeriod, filterCategory }) {
  const filteredTransactions = transactions.filter(t => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    
    if (filterPeriod !== "all") {
      const txDate = new Date(t.transaction_date);
      const now = new Date();
      
      if (filterPeriod === "month") {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      
      if (filterPeriod === "year") {
        return txDate.getFullYear() === now.getFullYear();
      }
    }
    
    return true;
  });

  if (filteredTransactions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <p className="text-gray-500">No transactions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTransactions.map(transaction => (
        <Card key={transaction.id} className={`border-l-4 ${
          transaction.transaction_type === "income" ? "border-l-green-500" : "border-l-red-500"
        }`}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {transaction.transaction_type === "income" ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                    <p className="text-sm text-gray-600">{transaction.vendor_customer}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={categoryColors[transaction.category]}>
                    {transaction.category.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-gray-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                  </Badge>
                  <Badge variant="outline" className="text-gray-600 capitalize">
                    {transaction.payment_method}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  transaction.transaction_type === "income" ? "text-green-700" : "text-red-700"
                }`}>
                  {transaction.transaction_type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}