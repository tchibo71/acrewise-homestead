import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Printer, Calendar, DollarSign, Beaker } from "lucide-react";
import { format } from "date-fns";
import { getUnitLabel, getSpeciesLabel, isInvoiceOverdue, daysPastDelivery } from "./wholesaleConstants";

const deliveryStatusColors = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-300",
  delivered: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300",
};

const invoiceStatusColors = {
  draft: "bg-gray-100 text-gray-600 border-gray-300",
  sent: "bg-amber-100 text-amber-700 border-amber-300",
  paid: "bg-green-100 text-green-700 border-green-300",
  overdue: "bg-red-100 text-red-700 border-red-300",
};

export default function WholesaleOrderCard({ order, accountName, onPrintInvoice }) {
  const overdue = isInvoiceOverdue(order);
  const daysPast = daysPastDelivery(order);

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${overdue ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{accountName || "Unknown Account"}</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              {order.invoice_number || "No invoice #"} · {getSpeciesLabel(order.species)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge className={invoiceStatusColors[order.invoice_status] || invoiceStatusColors.draft}>
              {order.invoice_status || "draft"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdue && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700 font-medium">
              Invoice overdue — {daysPast} days past delivery
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-400">Delivery</p>
              <p className="font-medium text-gray-900">
                {order.delivery_date ? format(new Date(order.delivery_date), 'MMM d, yyyy') : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="font-medium text-gray-900">
                ${(order.total_amount || (order.quantity * order.price_per_unit) || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {order.quantity || 0} {getUnitLabel(order.unit)} @ ${(order.price_per_unit || 0).toFixed(2)}
          </span>
          <Badge className={deliveryStatusColors[order.delivery_status] || deliveryStatusColors.scheduled}>
            {order.delivery_status || "scheduled"}
          </Badge>
        </div>

        {order.fulfilled_from_flush_ids?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
            <Beaker className="w-3.5 h-3.5" />
            <span>Fulfilled from {order.fulfilled_from_flush_ids.length} flush(es)</span>
          </div>
        )}

        {order.payment_received_date && (
          <p className="text-xs text-green-600">
            Paid: {format(new Date(order.payment_received_date), 'MMM d, yyyy')}
          </p>
        )}

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={(e) => { e.stopPropagation(); onPrintInvoice(order); }}
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" />
          Print Invoice
        </Button>
      </CardContent>
    </Card>
  );
}