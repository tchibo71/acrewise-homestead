import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, DoorOpen, AlertTriangle, Beaker, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GrowRoomCard from "@/components/grow-room/GrowRoomCard";
import AddGrowRoomModal from "@/components/grow-room/AddGrowRoomModal";
import LogSanitationModal from "@/components/grow-room/LogSanitationModal";
import LogReadingModal from "@/components/grow-room/LogReadingModal";
import { isSanitationOverdue } from "@/components/grow-room/growRoomConstants";

export default function GrowRoomManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [sanitationRoom, setSanitationRoom] = useState(null);
  const [readingRoom, setReadingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["grow-rooms"],
    queryFn: () => base44.entities.GrowRoom.list("-created_date"),
  });

  const { data: batches = [] } = useQuery({
    queryKey: ["mushroom-batches"],
    queryFn: () => base44.entities.MushroomBatch.list("-created_date"),
  });

  const activeBatchCount = useMemo(() => {
    const counts = {};
    batches.forEach(b => {
      if (b.grow_room_id && b.status !== "completed" && b.status !== "failed") {
        counts[b.grow_room_id] = (counts[b.grow_room_id] || 0) + 1;
      }
    });
    return counts;
  }, [batches]);

  const filtered = rooms.filter(r => {
    const q = searchTerm.toLowerCase();
    return r.room_name?.toLowerCase().includes(q) || r.room_type?.toLowerCase().includes(q);
  });

  const overdueCount = rooms.filter(isSanitationOverdue).length;
  const hepaCount = rooms.filter(r => r.has_hepa_filtration).length;
  const totalActiveBatches = Object.values(activeBatchCount).reduce((s, n) => s + n, 0);

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <DoorOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Grow Rooms</h1>
              <p className="text-gray-600 mt-1">{rooms.length} rooms tracked</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" /> Add Room
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
                </div>
                <DoorOpen className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sanitize Overdue</p>
                  <p className="text-2xl font-bold text-red-700">{overdueCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Batches</p>
                  <p className="text-2xl font-bold text-gray-900">{totalActiveBatches}</p>
                </div>
                <Beaker className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">HEPA Filtered</p>
                  <p className="text-2xl font-bold text-blue-700">{hepaCount}</p>
                </div>
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder="Search rooms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
        </div>

        {/* Grid */}
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
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <DoorOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No grow rooms yet</h3>
              <p className="text-gray-500 mb-4">Add your first room to start tracking environment and sanitation</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Add Your First Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(room => (
              <GrowRoomCard
                key={room.id}
                room={room}
                activeBatchCount={activeBatchCount[room.id] || 0}
                onLogSanitation={setSanitationRoom}
                onLogReading={setReadingRoom}
              />
            ))}
          </div>
        )}

        {showAddModal && <AddGrowRoomModal onClose={() => setShowAddModal(false)} />}
        {sanitationRoom && <LogSanitationModal room={sanitationRoom} onClose={() => setSanitationRoom(null)} />}
        {readingRoom && <LogReadingModal room={readingRoom} onClose={() => setReadingRoom(null)} />}
      </div>
    </div>
  );
}