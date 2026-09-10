import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Store, AlertTriangle, FileText, Truck, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WholesaleAccountCard from "@/components/wholesale/WholesaleAccountCard";
import WholesaleOrderCard from "@/components/wholesale/WholesaleOrderCard";
import AddWholesaleAccountModal from "@/components/wholesale/AddWholesaleAccountModal";
import AddWholesaleOrderModal from "@/components/wholesale/AddWholesaleOrderModal";
import { printWholesaleInvoice } from "@/components/wholesale/invoicePrinter";
import { isInvoiceOverdue } from "@/components/wholesale/wholesaleConstants";

export default function MushroomWholesale() {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderTab, setOrderTab] = useState("upcoming");

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["wholesale-accounts"],
    queryFn: () => base44.entities.WholesaleAccount.list("-created_date"),
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["wholesale-orders"],
    queryFn: () => base44.entities.WholesaleOrder.list("-delivery_date"),
  });

  const { data: flushes = [] } = useQuery({
    queryKey: ["mushroom-flushes"],
    queryFn: () => base44.entities.MushroomFlush.list("-harvest_date"),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["mushroom-batches"],
    queryFn: () => base44.entities.MushroomBatch.list("-created_date"),
  });

  const accountMap = useMemo(() => {
    const m = {};
    accounts.forEach(a => { m[a.id] = a; });
    return m;
  }, [accounts]);

  const orderCountByAccount = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      counts[o.wholesale_account_id] = (counts[o.wholesale_account_id] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const overdueInvoices = orders.filter(isInvoiceOverdue);

  // Sort orders by delivery_date (ascending for upcoming, descending for past)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(a.delivery_date || a.order_date) - new Date(b.delivery_date || b.order_date));
  }, [orders]);

  const upcomingOrders = sortedOrders.filter(o => {
    if (o.delivery_status === "cancelled") return false;
    return o.delivery_status !== "delivered";
  });

  const pastOrders = sortedOrders.filter(o => o.delivery_status === "delivered").reverse();

  const displayedOrders = orderTab === "upcoming" ? upcomingOrders : pastOrders;

  const totalOutstanding = orders
    .filter(o => o.invoice_status !== "paid" && o.delivery_status !== "cancelled")
    .reduce((sum, o) => sum + (o.total_amount || (o.quantity * o.price_per_unit) || 0), 0);

  const totalRevenue = orders
    .filter(o => o.invoice_status === "paid")
    .reduce((sum, o) => sum + (o.total_amount || (o.quantity * o.price_per_unit) || 0), 0);

  const handlePrintInvoice = (order) => {
    const account = accountMap[order.wholesale_account_id];
    printWholesaleInvoice(order, account);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Wholesale</h1>
              <p className="text-gray-600 mt-1">{accounts.length} accounts · {orders.length} orders</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowOrderModal(true)} variant="outline" disabled={accounts.length === 0}>
              <Plus className="w-4 h-4 mr-2" /> New Order
            </Button>
            <Button onClick={() => setShowAccountModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> New Account
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{accounts.filter(a => a.active).length}</p>
                </div>
                <Store className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Invoices</p>
                  <p className="text-2xl font-bold text-red-700">{overdueInvoices.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-amber-700">${totalOutstanding.toFixed(0)}</p>
                </div>
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue (Paid)</p>
                  <p className="text-2xl font-bold text-green-700">${totalRevenue.toFixed(0)}</p>
                </div>
                <Truck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue alert banner */}
        {overdueInvoices.length > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Overdue Invoices</h3>
                  <p className="text-sm text-red-800">
                    {overdueInvoices.length} invoice(s) sent but unpaid past 30 days from delivery. Follow up with customers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Accounts</h2>
          {accountsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No wholesale accounts yet</h3>
                <p className="text-gray-500 mb-4">Add a restaurant, co-op, or distributor to start tracking orders</p>
                <Button onClick={() => setShowAccountModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> New Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map(account => (
                <WholesaleAccountCard
                  key={account.id}
                  account={account}
                  orderCount={orderCountByAccount[account.id] || 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Orders</h2>
            <Tabs value={orderTab} onValueChange={setOrderTab}>
              <TabsList className="bg-white">
                <TabsTrigger value="upcoming">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Upcoming ({upcomingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past ({pastOrders.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {ordersLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : displayedOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {accounts.length === 0 ? "Create an account first" : "No orders yet"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {accounts.length === 0 ? "Add a wholesale account to start creating orders" : "Create your first wholesale order"}
                </p>
                {accounts.length > 0 && (
                  <Button onClick={() => setShowOrderModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" /> New Order
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedOrders.map(order => (
                <WholesaleOrderCard
                  key={order.id}
                  order={order}
                  accountName={accountMap[order.wholesale_account_id]?.account_name}
                  onPrintInvoice={handlePrintInvoice}
                />
              ))}
            </div>
          )}
        </div>

        {showAccountModal && <AddWholesaleAccountModal onClose={() => setShowAccountModal(false)} />}
        {showOrderModal && (
          <AddWholesaleOrderModal
            accounts={accounts}
            flushes={flushes}
            batches={batches}
            onClose={() => setShowOrderModal(false)}
          />
        )}
      </div>
    </div>
  );
}