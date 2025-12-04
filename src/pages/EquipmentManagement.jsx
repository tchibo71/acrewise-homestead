import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Package,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "@/components/paywall/PaywallModal";
import AddEquipmentModal from "@/components/equipment/AddEquipmentModal";
import EquipmentCard from "@/components/equipment/EquipmentCard";
import ServiceAlertWidget from "@/components/equipment/ServiceAlertWidget";

export default function EquipmentManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("operational");
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-created_date'),
    enabled: subscriptionData.isPro
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['equipment-maintenance'],
    queryFn: () => base44.entities.EquipmentMaintenance.list('-maintenance_date'),
    enabled: subscriptionData.isPro
  });

  const handleAddEquipment = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.equipment_type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const needsMaintenance = equipment.filter(e => {
    if (!e.next_maintenance_due) return false;
    const daysUntil = Math.floor((new Date(e.next_maintenance_due) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  });

  const overdueMaintenance = equipment.filter(e => {
    if (!e.next_maintenance_due) return false;
    const daysUntil = Math.floor((new Date(e.next_maintenance_due) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil < 0;
  });

  const needsRepair = equipment.filter(e => 
    e.condition === 'needs_repair' || e.status === 'in_repair'
  );

  const totalValue = equipment.reduce((sum, item) => sum + (item.current_value || 0), 0);

  const types = [...new Set(equipment.map(e => e.equipment_type))];

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Equipment Management</h1>
              <p className="text-gray-600 mt-1">Track tools, machinery, and maintenance schedules</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Equipment Management is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to track all your equipment, schedule maintenance, monitor condition, and never miss important service dates
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
            feature="Equipment management"
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
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Equipment Management</h1>
              <p className="text-gray-600 mt-1">{equipment.length} items tracked</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddEquipment}
              className="bg-gray-700 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
            <Link to={createPageUrl("InventoryManagement")}>
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Inventory
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Equipment</p>
                  <p className="text-2xl font-bold text-gray-900">{equipment.length}</p>
                </div>
                <Wrench className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Maintenance</p>
                  <p className="text-2xl font-bold text-red-700">{overdueMaintenance.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Maintenance Due</p>
                  <p className="text-2xl font-bold text-yellow-700">{needsMaintenance.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-700">${totalValue.toFixed(0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Alert Widget - Predictive Maintenance */}
        <ServiceAlertWidget />

        {/* Urgent Alerts */}
        {(overdueMaintenance.length > 0 || needsRepair.length > 0) && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Urgent Attention Required</h3>
                  <ul className="space-y-1 text-sm text-red-800">
                    {overdueMaintenance.length > 0 && (
                      <li>• {overdueMaintenance.length} equipment has overdue maintenance</li>
                    )}
                    {needsRepair.length > 0 && (
                      <li>• {needsRepair.length} equipment needs repair</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="operational">Operational</TabsTrigger>
              <TabsTrigger value="in_repair">In Repair</TabsTrigger>
              <TabsTrigger value="out_of_service">Out of Service</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "bg-gray-700 hover:bg-gray-800" : ""}
          >
            All Types
          </Button>
          {types.map(type => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className={filterType === type ? "bg-gray-700 hover:bg-gray-800" : ""}
            >
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>

        {/* Equipment Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEquipment.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No equipment yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your tools and machinery</p>
              <Button onClick={handleAddEquipment} className="bg-gray-700 hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Equipment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map(item => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </div>
        )}

        {showAddModal && (
          <AddEquipmentModal onClose={() => setShowAddModal(false)} />
        )}
      </div>
    </div>
  );
}