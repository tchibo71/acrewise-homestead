import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Sprout, TrendingUp, Wind, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SeedBatchCard from "@/components/seed-starting/SeedBatchCard";
import AddSeedBatchModal from "@/components/seed-starting/AddSeedBatchModal";
import SeedBatchDetailDialog from "@/components/seed-starting/SeedBatchDetailDialog";
import { getSeedBatchStage } from "@/components/seed-starting/seedBatchConstants";

export default function SeedStarting() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["seed-batches"],
    queryFn: () => base44.entities.SeedBatch.list("-sow_date"),
  });

  const filteredBatches = batches.filter(b => {
    const q = searchTerm.toLowerCase();
    return b.crop_name?.toLowerCase().includes(q) || b.variety?.toLowerCase().includes(q);
  });

  const stats = {
    total: batches.length,
    germinating: batches.filter(b => getSeedBatchStage(b).key === "germinating").length,
    hardening: batches.filter(b => getSeedBatchStage(b).key === "hardening").length,
    ready: batches.filter(b => ["ready", "transplanted", "sold"].includes(getSeedBatchStage(b).key)).length,
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Seed Starting</h1>
              <p className="text-gray-600 mt-1">{stats.total} seed batches tracked</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> Add Seed Batch
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Batches</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Sprout className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Germinating</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.germinating}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hardening Off</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.hardening}</p>
                </div>
                <Wind className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready / Done</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.ready}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder="Search by crop or variety..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
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
        ) : filteredBatches.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No seed batches yet</h3>
              <p className="text-gray-500 mb-4">Start by sowing your first batch</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" /> Add Your First Batch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBatches.map(batch => (
              <SeedBatchCard key={batch.id} batch={batch} onDetails={setSelectedBatch} />
            ))}
          </div>
        )}

        {showAddModal && <AddSeedBatchModal onClose={() => setShowAddModal(false)} />}
        {selectedBatch && <SeedBatchDetailDialog batch={selectedBatch} onClose={() => setSelectedBatch(null)} />}
      </div>
    </div>
  );
}