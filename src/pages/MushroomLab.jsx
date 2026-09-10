import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Microscope, FlaskConical, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MushroomCultureCard from "@/components/mushroom/MushroomCultureCard";
import AddMushroomCultureModal from "@/components/mushroom/AddMushroomCultureModal";
import MushroomCultureDetailDialog from "@/components/mushroom/MushroomCultureDetailDialog";
import { MUSHROOM_SPECIES } from "@/components/mushroom/mushroomBatchConstants";

export default function MushroomLab() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: cultures = [], isLoading } = useQuery({
    queryKey: ["mushroom-cultures"],
    queryFn: () => base44.entities.MushroomCulture.list("-isolation_or_purchase_date"),
  });

  const cultureMap = useMemo(() => {
    const m = {};
    cultures.forEach(c => { m[c.id] = c; });
    return m;
  }, [cultures]);

  const filtered = cultures.filter(c => {
    const q = searchTerm.toLowerCase();
    return c.strain_name?.toLowerCase().includes(q) || c.species?.toLowerCase().includes(q);
  });

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(c => {
      const key = c.species || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return groups;
  }, [filtered]);

  const stats = {
    total: cultures.length,
    active: cultures.filter(c => c.is_active).length,
    retired: cultures.filter(c => !c.is_active).length,
    species: new Set(cultures.map(c => c.species)).size,
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Mushroom Lab</h1>
              <p className="text-gray-600 mt-1">{stats.total} cultures in your library</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Culture
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cultures</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Microscope className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Retired</p>
                  <p className="text-2xl font-bold text-gray-500">{stats.retired}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Species</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.species}</p>
                </div>
                <FlaskConical className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input placeholder="Search by strain or species..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white" />
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
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Microscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No cultures in your library yet</h3>
              <p className="text-gray-500 mb-4">Add your first culture to start tracking transfers</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> Add Your First Culture
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).sort().map(([species, items]) => (
              <div key={species}>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-500" />
                  {MUSHROOM_SPECIES.find(s => s.value === species)?.label || species}
                  <span className="text-sm font-normal text-gray-400">({items.length})</span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(c => (
                    <MushroomCultureCard
                      key={c.id}
                      culture={c}
                      parentCulture={c.parent_culture_id ? cultureMap[c.parent_culture_id] : null}
                      onDetails={setSelectedCulture}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && <AddMushroomCultureModal onClose={() => setShowAddModal(false)} />}
        {selectedCulture && (
          <MushroomCultureDetailDialog
            culture={cultures.find(c => c.id === selectedCulture.id) || selectedCulture}
            onClose={() => setSelectedCulture(null)}
          />
        )}
      </div>
    </div>
  );
}