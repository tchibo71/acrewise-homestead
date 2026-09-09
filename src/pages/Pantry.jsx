import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Apple,
  Plus,
  Search,
  Loader2,
  X,
  AlertTriangle,
  Calendar,
  MapPin,
  Trash2,
  Package
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";

const CATEGORIES = [
  { value: "canned", label: "Canned" },
  { value: "frozen", label: "Frozen" },
  { value: "dried", label: "Dried" },
  { value: "fermented", label: "Fermented" },
  { value: "root_cellar", label: "Root Cellar" },
  { value: "fresh", label: "Fresh" },
  { value: "other", label: "Other" },
];

const UNITS = ["jars", "lbs", "gallons", "quarts", "pints", "bags", "other"];

const categoryColors = {
  canned: "bg-red-100 text-red-700",
  frozen: "bg-blue-100 text-blue-700",
  dried: "bg-amber-100 text-amber-700",
  fermented: "bg-purple-100 text-purple-700",
  root_cellar: "bg-orange-100 text-orange-700",
  fresh: "bg-green-100 text-green-700",
  other: "bg-slate-100 text-slate-700",
};

export default function Pantry() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterExpiring, setFilterExpiring] = useState(false);

  const [formData, setFormData] = useState({
    food_name: "",
    category: "",
    quantity: "",
    unit: "jars",
    production_date: "",
    preservation_method: "",
    best_by_date: "",
    storage_location: "",
    source: "",
    notes: "",
  });

  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['stored-foods'],
    queryFn: () => base44.entities.StoredFood.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StoredFood.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stored-foods'] });
      setShowForm(false);
      setFormData({
        food_name: "", category: "", quantity: "", unit: "jars",
        production_date: "", preservation_method: "", best_by_date: "",
        storage_location: "", source: "", notes: ""
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StoredFood.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stored-foods'] }),
  });

  const handleSubmit = () => {
    if (!formData.food_name || !formData.category || !formData.quantity) return;
    createMutation.mutate({
      ...formData,
      quantity: parseFloat(formData.quantity),
      production_date: formData.production_date || null,
      best_by_date: formData.best_by_date || null,
    });
  };

  const handleDelete = (id) => {
    if (confirm("Remove this item from your pantry?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = !searchTerm ||
      food.food_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.storage_location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || food.category === filterCategory;
    const matchesExpiring = !filterExpiring ||
      (food.best_by_date && differenceInDays(new Date(food.best_by_date), new Date()) <= 30 && differenceInDays(new Date(food.best_by_date), new Date()) >= 0);
    return matchesSearch && matchesCategory && matchesExpiring;
  });

  const expiringCount = foods.filter(f =>
    f.best_by_date && differenceInDays(new Date(f.best_by_date), new Date()) <= 30 && differenceInDays(new Date(f.best_by_date), new Date()) >= 0
  ).length;

  const expiredCount = foods.filter(f =>
    f.best_by_date && differenceInDays(new Date(f.best_by_date), new Date()) < 0
  ).length;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Pantry</h1>
              <p className="text-gray-600 mt-1">{foods.length} items stored</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Food Item
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{foods.length}</p>
                </div>
                <Package className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-amber-700">{expiringCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-700">{expiredCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name or storage location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full md:w-48 bg-white">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={filterExpiring ? "default" : "outline"}
            onClick={() => setFilterExpiring(!filterExpiring)}
            className={filterExpiring ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Expiring ≤ 30 days
          </Button>
        </div>

        {/* Food List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          </div>
        ) : filteredFoods.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Apple className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your pantry is empty</h3>
              <p className="text-gray-500 mb-4">Track canned, frozen, dried, and fermented foods</p>
              <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map(food => {
              const daysToExpire = food.best_by_date
                ? differenceInDays(new Date(food.best_by_date), new Date())
                : null;
              const isExpired = daysToExpire !== null && daysToExpire < 0;
              const isExpiringSoon = daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 30;

              return (
                <Card key={food.id} className={`hover:shadow-lg transition-shadow ${isExpired ? 'border-l-4 border-l-red-500' : isExpiringSoon ? 'border-l-4 border-l-amber-500' : ''}`}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{food.food_name}</h3>
                        <Badge className={`${categoryColors[food.category] || categoryColors.other} mt-1`}>
                          {food.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <button onClick={() => handleDelete(food.id)} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>{food.quantity} {food.unit}</span>
                    </div>

                    {food.storage_location && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{food.storage_location}</span>
                      </div>
                    )}

                    {food.production_date && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>Produced: {format(new Date(food.production_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}

                    {food.best_by_date && (
                      <div className={`flex items-center gap-1.5 text-sm ${isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {isExpired
                            ? `Expired ${Math.abs(daysToExpire)} day${Math.abs(daysToExpire) !== 1 ? 's' : ''} ago`
                            : isExpiringSoon
                              ? `Best by in ${daysToExpire} day${daysToExpire !== 1 ? 's' : ''}`
                              : `Best by: ${format(new Date(food.best_by_date), 'MMM d, yyyy')}`}
                        </span>
                      </div>
                    )}

                    {food.preservation_method && (
                      <p className="text-xs text-gray-500">Preserved: {food.preservation_method}</p>
                    )}

                    {food.source && (
                      <p className="text-xs text-gray-500">Source: {food.source}</p>
                    )}

                    {food.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">{food.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <div className="sticky top-0 bg-white z-10 border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Pantry Item
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Food Name *</Label>
                  <Input
                    value={formData.food_name}
                    onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                    placeholder="e.g. Canned Tomatoes, Frozen Berries"
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Production Date</Label>
                    <Input type="date" value={formData.production_date} onChange={(e) => setFormData({ ...formData, production_date: e.target.value })} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Best By Date</Label>
                    <Input type="date" value={formData.best_by_date} onChange={(e) => setFormData({ ...formData, best_by_date: e.target.value })} className="bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preservation Method</Label>
                    <Input value={formData.preservation_method} onChange={(e) => setFormData({ ...formData, preservation_method: e.target.value })} placeholder="e.g. Water bath canning" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Storage Location</Label>
                    <Input value={formData.storage_location} onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })} placeholder="e.g. Root cellar, Freezer" className="bg-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="e.g. own garden, own livestock, purchased" className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional details..." className="bg-white" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSubmit} disabled={!formData.food_name || !formData.category || !formData.quantity || createMutation.isPending} className="flex-1 bg-orange-600 hover:bg-orange-700">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    {createMutation.isPending ? "Saving..." : "Add to Pantry"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}