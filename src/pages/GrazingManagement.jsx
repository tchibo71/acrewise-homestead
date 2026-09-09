import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  Search,
  Footprints,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
  Play,
  Square
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddPastureModal from "@/components/grazing/AddPastureModal";
import StartGrazingModal from "@/components/grazing/StartGrazingModal";
import { logGrazingEndEvent } from "@/components/utils/farmHistoryLogger";

function getDaysSince(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status) {
  const config = {
    resting: { label: "Resting", className: "bg-green-100 text-green-800", icon: CheckCircle },
    grazing: { label: "Grazing", className: "bg-blue-100 text-blue-800", icon: Footprints },
    needs_attention: { label: "Needs Attention", className: "bg-orange-100 text-orange-800", icon: AlertTriangle }
  };
  const c = config[status] || config.resting;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.className}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function PastureCard({ pasture, grazingRecords, onStartGrazing, onEndGrazing }) {
  const queryClient = useQueryClient();
  const daysSinceGrazed = getDaysSince(pasture.last_grazed_date);
  const restPeriod = pasture.rest_period_days || 21;
  const isOverdue = daysSinceGrazed !== null && daysSinceGrazed >= restPeriod && pasture.status === "resting";
  const activeGrazingRecord = grazingRecords.find(
    r => r.pasture_id === pasture.id && !r.end_date
  );

  const endGrazingMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      if (activeGrazingRecord) {
        await base44.entities.GrazingRecord.update(activeGrazingRecord.id, { end_date: today });
      }
      await base44.entities.Pasture.update(pasture.id, {
        status: "resting",
        last_grazed_date: today
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastures'] });
      queryClient.invalidateQueries({ queryKey: ['grazing-records'] });
      queryClient.invalidateQueries({ queryKey: ['farm-activity-feed'] });
      logGrazingEndEvent(pasture, activeGrazingRecord);
    },
  });

  return (
    <Card className={`shadow-md bg-white/80 ${isOverdue ? 'border-2 border-orange-400' : ''}`}>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{pasture.name}</h3>
            {pasture.acreage && (
              <p className="text-sm text-gray-500">{pasture.acreage} acres</p>
            )}
          </div>
          {getStatusBadge(pasture.status)}
        </div>

        {pasture.location_notes && (
          <p className="text-sm text-gray-600">{pasture.location_notes}</p>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {daysSinceGrazed !== null
                ? `${daysSinceGrazed} day${daysSinceGrazed !== 1 ? 's' : ''} since grazed`
                : "Never grazed"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Rest period: {restPeriod} days</span>
          </div>
        </div>

        {isOverdue && (
          <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-800 font-medium">
              Ready to regraze — past {restPeriod}-day rest period
            </p>
          </div>
        )}

        {activeGrazingRecord && (
          <div className="text-sm text-blue-700 bg-blue-50 rounded-lg p-2.5">
            <Footprints className="w-4 h-4 inline mr-1.5" />
            Grazing since {activeGrazingRecord.start_date}
            {activeGrazingRecord.livestock_group && ` — ${activeGrazingRecord.livestock_group}`}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {pasture.status === "grazing" ? (
            <Button
              onClick={() => endGrazingMutation.mutate()}
              disabled={endGrazingMutation.isPending}
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              {endGrazingMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              End Grazing
            </Button>
          ) : (
            <Button
              onClick={() => onStartGrazing(pasture)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Grazing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GrazingManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [grazingPasture, setGrazingPasture] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: pastures = [], isLoading } = useQuery({
    queryKey: ['pastures'],
    queryFn: () => base44.entities.Pasture.list('-created_date'),
  });

  const { data: grazingRecords = [] } = useQuery({
    queryKey: ['grazing-records'],
    queryFn: () => base44.entities.GrazingRecord.list('-start_date'),
  });

  const filteredPastures = pastures.filter(pasture => {
    const matchesSearch = pasture.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pasture.location_notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || pasture.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const grazingCount = pastures.filter(p => p.status === "grazing").length;
  const restingCount = pastures.filter(p => p.status === "resting").length;
  const overdueCount = pastures.filter(p => {
    const days = getDaysSince(p.last_grazed_date);
    return days !== null && days >= (p.rest_period_days || 21) && p.status === "resting";
  }).length;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Footprints className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Grazing Management</h1>
              <p className="text-gray-600 mt-1">{pastures.length} pastures tracked</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Pasture
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Currently Grazing</p>
                  <p className="text-2xl font-bold text-blue-600">{grazingCount}</p>
                </div>
                <Footprints className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Resting</p>
                  <p className="text-2xl font-bold text-green-600">{restingCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready to Regraze</p>
                  <p className="text-2xl font-bold text-orange-600">{overdueCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search pastures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="grazing">Grazing</TabsTrigger>
              <TabsTrigger value="resting">Resting</TabsTrigger>
              <TabsTrigger value="needs_attention">Attention</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
        ) : filteredPastures.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Footprints className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No pastures yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first pasture</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Pasture
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPastures.map(pasture => (
              <PastureCard
                key={pasture.id}
                pasture={pasture}
                grazingRecords={grazingRecords}
                onStartGrazing={(p) => setGrazingPasture(p)}
                onEndGrazing={() => {}}
              />
            ))}
          </div>
        )}

        {showAddModal && (
          <AddPastureModal onClose={() => setShowAddModal(false)} />
        )}

        {grazingPasture && (
          <StartGrazingModal
            pasture={grazingPasture}
            onClose={() => setGrazingPasture(null)}
          />
        )}
      </div>
    </div>
  );
}