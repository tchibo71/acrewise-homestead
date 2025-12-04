import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus,
  Search,
  Heart,
  Activity,
  DollarSign,
  AlertCircle,
  Crown,
  Stethoscope
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import LivestockCard from "../components/livestock/LivestockCard";
import AddLivestockModal from "../components/livestock/AddLivestockModal";
import AIDiagnosticCenter from "../components/livestock/AIDiagnosticCenter";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

export default function LivestockManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: livestock = [], isLoading } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list('-created_date'),
  });

  const { data: vetVisits = [] } = useQuery({
    queryKey: ['vet-visits'],
    queryFn: () => base44.entities.VetVisit.list('-visit_date'),
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: () => base44.entities.Vaccination.list('-vaccination_date'),
  });

  const handleAddLivestock = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

  const filteredLivestock = livestock.filter(animal => {
    const matchesSearch = animal.name_or_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.breed?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || animal.animal_type === filterType;
    const matchesStatus = filterStatus === "all" || animal.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeLivestock = livestock.filter(a => a.status === "active");
  const upcomingVaccinations = vaccinations.filter(v => {
    if (!v.next_due_date) return false;
    const dueDate = new Date(v.next_due_date);
    const today = new Date();
    const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 30;
  });

  const recentVetVisits = vetVisits.filter(v => {
    const visitDate = new Date(v.visit_date);
    const daysDiff = Math.floor((new Date() - visitDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  });

  const types = [...new Set(livestock.map(a => a.animal_type))];

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Livestock Management</h1>
              <p className="text-gray-600 mt-1">Complete health and production tracking</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Livestock Management is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Upgrade to track births, weights, vaccinations, vet visits, and complete health records for all your animals
              </p>

              <div className="max-w-md mx-auto mb-8 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">With Pro, you can:</h3>
                <ul className="space-y-3 text-left">
                  {[
                    "Track unlimited livestock",
                    "Record birth dates and weights",
                    "Manage vaccination schedules",
                    "Log vet visits and diagnoses",
                    "Track production (eggs, milk, etc.)",
                    "Record sales and weights",
                    "Complete financial tracking"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro - Starting at $2.99/mo
              </Button>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Livestock management"
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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Livestock Management</h1>
              <p className="text-gray-600 mt-1">{activeLivestock.length} active animals</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowDiagnostic(true)}
              variant="outline"
              className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              AI Diagnostic
            </Button>
            <Button 
              onClick={handleAddLivestock}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Livestock
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Animals</p>
                  <p className="text-2xl font-bold text-gray-900">{activeLivestock.length}</p>
                </div>
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vaccinations Due</p>
                  <p className="text-2xl font-bold text-orange-600">{upcomingVaccinations.length}</p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Vet Visits</p>
                  <p className="text-2xl font-bold text-green-600">{recentVetVisits.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Link to={createPageUrl("FinancialManagement")}>
            <Card className="border-none shadow-md bg-white/80 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">View Financials</p>
                    <p className="text-sm font-semibold text-purple-600">Click to open →</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, tag, or breed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="sold">Sold</TabsTrigger>
              <TabsTrigger value="deceased">Deceased</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            All Types
          </Button>
          {types.map(type => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className={filterType === type ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>

        {/* Livestock Grid */}
        {isLoading ? (
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
        ) : filteredLivestock.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No livestock yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first animal</p>
              <Button onClick={handleAddLivestock} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Animal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLivestock.map(animal => (
              <LivestockCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}

        {showAddModal && (
          <AddLivestockModal onClose={() => setShowAddModal(false)} />
        )}

        {showDiagnostic && (
          <AIDiagnosticCenter onClose={() => setShowDiagnostic(false)} />
        )}
      </div>
    </div>
  );
}