import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Truck, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { getAccountTypeLabel, getDeliveryMethodLabel, getFrequencyLabel, getUnitLabel } from "./wholesaleConstants";

export default function WholesaleAccountCard({ account, orderCount }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{account.account_name}</CardTitle>
            <p className="text-sm text-gray-600 mt-0.5">{getAccountTypeLabel(account.account_type)}</p>
          </div>
          <Badge className={account.active ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-600 border-gray-300"}>
            {account.active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {account.contact_name && (
          <p className="text-sm text-gray-700 font-medium">{account.contact_name}</p>
        )}

        <div className="space-y-1.5">
          {account.contact_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{account.contact_phone}</span>
            </div>
          )}
          {account.contact_email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{account.contact_email}</span>
            </div>
          )}
        </div>

        {account.standing_order_active && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
              <Package className="w-3.5 h-3.5" />
              Standing Order
            </div>
            <p className="text-xs text-blue-700">
              {account.standing_order_quantity || 0} {getUnitLabel(account.standing_order_unit)} · {getFrequencyLabel(account.standing_order_frequency)}
            </p>
            {account.standing_order_species?.length > 0 && (
              <p className="text-xs text-blue-600">
                {account.standing_order_species.join(", ")}
              </p>
            )}
            {account.delivery_day && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {account.delivery_day}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="w-4 h-4" />
            <span>{getDeliveryMethodLabel(account.delivery_method)}</span>
          </div>
          <span className="text-sm text-gray-500">{orderCount} orders</span>
        </div>

        {account.agreed_price_per_unit != null && (
          <p className="text-sm text-gray-600">
            Agreed: ${account.agreed_price_per_unit.toFixed(2)}/{getUnitLabel(account.standing_order_unit)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}