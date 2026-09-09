import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  Search,
  Bug,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddBeeHiveModal from "@/components/bee-hive/AddBeeHiveModal";
import {
  HIVE_TYPE_LABELS,
  COLONY_STRENGTH_LABELS,
  HIVE_STATUS_LABELS,
  QUEEN_COLOR_HEX,
} from "@/components/bee-hive/beeHiveConstants";

function getStatusBadge(status) {
  const config = {
    active: { label: "Active", className: "bg-green-100 text-green-800", icon: CheckCircle },
    swarmed: { label: "Swarmed", className: "bg-blue-100 text-blue-800", icon: AlertTriangle },
    absconded: { label: "Absconded", className: "bg-orange-100 text-orange-800", icon: AlertTriangle },
    dead: { label: "Dead", className: "bg-red-100 text-red-800", icon: AlertTriangle },
    combined: { label: "Combined", className: "bg-purple-100 text-purple-800", icon: Activity },
  };
  const c = config[status] || config.active;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${c.className}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function HiveCard({ hive, inspectionCount, latestInspection }) {
  const navigate = useNavigate();

  return (
    <Card
      className="shadow-md bg-white/80 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-amber-500"
      onClick={() => navigate(`/BeeHiveDetail?id=${hive.id}`)}
    >
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">
              🐝
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{hive.hive_name}</h3>
              {hive.hive_type && (
                <p className="text-sm text-gray-500">{HIVE_TYPE_LABELS[hive.hive_type]}</p>
              )}
            </div>
          </div>
          {getStatusBadge(hive.status)}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {hive.colony_strength && (
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{COLONY_STRENGTH_LABELS[hive.colony_strength]}</span>
            </div>
          )}
          {hive.install_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Installed {hive.install_date}</span>
            </div>
          )}
          {hive.location_notes && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 truncate max-w-[150px]">{hive.location_notes}</span>
            </div>
          )}
        </div>

        {hive.queen_marked_color && hive.queen_marked_color !== "unmarked" && (
          <div className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full border border-gray-300"
              style={{ backgroundColor: QUEEN_COLOR_HEX[hive.queen_marked_color] }}
            />
            <span className="text-gray-600">Queen marked {hive.queen_marked_color}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {inspectionCount} inspection{inspectionCount !== 1 ? 's' : ''}
            {latestInspection && ` · last ${latestInspection.inspection_date}`}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BeeHiveManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: hives = [], isLoading } = useQuery({
    queryKey: ['bee-hives'],
    queryFn: () => base44.entities.BeeHive.list('-created_date'),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['all-hive-inspections'],
    queryFn: () => base44.entities.HiveInspection.list('-inspection_date', 200),
  });

  const filteredHives = hives.filter(hive => {
    const matchesSearch = hive.hive_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hive.location_notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || hive.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = hives.filter(h => h.status === "active").length;
  const attentionCount = hives.filter(h => ["swarmed", "absconded", "dead"].includes(h.status)).length;
  const totalInspections = inspections.length;

  const getInspectionData = (hiveId) => {
    const hiveInspections = inspections.filter(i => i.hive_id === hiveId);
    return {
      count: hiveInspections.length,
      latest: hiveInspections[0] || null,
    };
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Bee Hive Management</h1>
              <p className="text-gray-600 mt-1">{hives.length} hives tracked</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Hive
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Hives</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Needs Attention</p>
                  <p className="text-2xl font-bold text-orange-600">{attentionCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Inspections</p>
                  <p className="text-2xl font-bold text-amber-600">{totalInspections}</p>
                </div>
                <Activity className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search hives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="bg-white">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="swarmed">Swarmed</TabsTrigger>
              <TabsTrigger value="dead">Dead</TabsTrigger>
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
        ) : filteredHives.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bee hives yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first hive</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Hive
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHives.map(hive => {
              const { count, latest } = getInspectionData(hive.id);
              return (
                <HiveCard
                  key={hive.id}
                  hive={hive}
                  inspectionCount={count}
                  latestInspection={latest}
                />
              );
            })}
          </div>
        )}

        {showAddModal && (
          <AddBeeHiveModal onClose={() => setShowAddModal(false)} />
        )}
      </div>
    </div>
  );
}