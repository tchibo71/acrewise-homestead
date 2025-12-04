import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function InventoryCard({ item }) {
  const isLowStock = item.current_quantity <= (item.minimum_quantity || 0);
  const stockPercentage = item.minimum_quantity 
    ? (item.current_quantity / (item.minimum_quantity * 2)) * 100 
    : 100;
  
  const isExpiringSoon = item.expiration_date && (() => {
    const daysUntil = Math.floor((new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30;
  })();

  const categoryColors = {
    feed: "bg-amber-100 text-amber-700",
    seed: "bg-green-100 text-green-700",
    fertilizer: "bg-lime-100 text-lime-700",
    medication: "bg-red-100 text-red-700",
    vaccine: "bg-pink-100 text-pink-700",
    supplement: "bg-purple-100 text-purple-700",
    bedding: "bg-blue-100 text-blue-700",
    tools: "bg-gray-100 text-gray-700",
    other: "bg-slate-100 text-slate-700"
  };

  return (
    <Link to={createPageUrl(`InventoryDetail?id=${item.id}`)}>
      <Card className={`hover:shadow-xl transition-all duration-300 cursor-pointer ${isLowStock ? 'border-l-4 border-l-orange-500' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{item.item_name}</CardTitle>
              {item.brand && (
                <p className="text-sm text-gray-600 mt-1">{item.brand}</p>
              )}
            </div>
            <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={categoryColors[item.category] || categoryColors.other}>
              {item.category.replace(/_/g, ' ')}
            </Badge>
            {isLowStock && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Low Stock
              </Badge>
            )}
            {isExpiringSoon && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                <Calendar className="w-3 h-3 mr-1" />
                Expiring Soon
              </Badge>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Stock Level</span>
              <span className={`font-semibold ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                {item.current_quantity} {item.unit_type}
              </span>
            </div>
            <Progress 
              value={Math.min(stockPercentage, 100)} 
              className={`h-2 ${isLowStock ? '[&>div]:bg-orange-500' : ''}`}
            />
            {item.minimum_quantity && (
              <p className="text-xs text-gray-500 mt-1">
                Min: {item.minimum_quantity} {item.unit_type}
              </p>
            )}
          </div>

          {item.total_value && (
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>Total Value</span>
              </div>
              <span className="font-semibold text-gray-900">
                ${item.total_value.toFixed(2)}
              </span>
            </div>
          )}

          {item.storage_location && (
            <p className="text-sm text-gray-600">
              📍 {item.storage_location}
            </p>
          )}

          {item.expiration_date && (
            <p className={`text-sm ${isExpiringSoon ? 'text-yellow-700 font-medium' : 'text-gray-600'}`}>
              Expires: {format(new Date(item.expiration_date), 'MMM d, yyyy')}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}