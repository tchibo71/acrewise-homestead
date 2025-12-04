import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  History,
  DollarSign,
  Edit,
  Trash2,
  Crown,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";
import AddHistoryModal from "../components/farm-planning/AddHistoryModal";
import { format } from "date-fns";

const eventTypeColors = {
  ownership_change: "bg-purple-100 text-purple-700",
  major_improvement: "bg-blue-100 text-blue-700",
  catastrophe: "bg-red-100 text-red-700",
  emergency: "bg-orange-100 text-orange-700",
  success: "bg-green-100 text-green-700",
  failure: "bg-gray-100 text-gray-700",
  milestone: "bg-yellow-100 text-yellow-700",
  maintenance: "bg-cyan-100 text-cyan-700",
  other: "bg-slate-100 text-slate-700"
};

export default function FarmHistory() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['farm-history'],
    queryFn: () => base44.entities.FarmHistory.list('-event_date'),
    enabled: subscriptionData.isPro
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FarmHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-history'] });
    },
  });

  const handleAddEvent = () => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingEvent(null);
    setShowAddModal(true);
  };

  const handleEdit = (event) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    setEditingEvent(event);
    setShowAddModal(true);
  };

  const handleDelete = (eventId) => {
    if (!subscriptionData.isPro) {
      setShowPaywall(true);
      return;
    }
    if (confirm('Are you sure you want to delete this history entry?')) {
      deleteMutation.mutate(eventId);
    }
  };

  const filteredHistory = history.filter(h => 
    filterType === "all" || h.event_type === filterType
  );

  const totalPositiveImpact = history
    .filter(h => h.financial_impact > 0)
    .reduce((sum, h) => sum + h.financial_impact, 0);
  
  const totalNegativeImpact = history
    .filter(h => h.financial_impact < 0)
    .reduce((sum, h) => sum + Math.abs(h.financial_impact), 0);

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Farm History</h1>
              <p className="text-gray-600 mt-1">Document your farm's journey</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Farm History is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to document ownership changes, improvements, successes, failures, emergencies, and lessons learned throughout your farm's journey
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
            feature="Farm History tracking"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Farm History</h1>
              <p className="text-gray-600 mt-1">{history.length} recorded events</p>
            </div>
          </div>
          <Button onClick={handleAddEvent} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Positive Impact</p>
                  <p className="text-2xl font-bold text-green-700">${totalPositiveImpact.toFixed(0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Negative Impact</p>
                  <p className="text-2xl font-bold text-red-700">${totalNegativeImpact.toFixed(0)}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-purple-700">{history.length}</p>
                </div>
                <History className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={filterType} onValueChange={setFilterType}>
          <TabsList className="bg-white flex-wrap h-auto">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="success">Successes</TabsTrigger>
            <TabsTrigger value="failure">Failures</TabsTrigger>
            <TabsTrigger value="catastrophe">Catastrophes</TabsTrigger>
            <TabsTrigger value="emergency">Emergencies</TabsTrigger>
            <TabsTrigger value="major_improvement">Improvements</TabsTrigger>
            <TabsTrigger value="milestone">Milestones</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Timeline */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No history recorded yet</h3>
              <p className="text-gray-500 mb-4">Start documenting your farm's journey</p>
              <Button onClick={handleAddEvent} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map(event => (
              <Card key={event.id} className="border-l-4 border-l-purple-600 hover:shadow-lg transition-shadow">
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={eventTypeColors[event.event_type]}>
                          {event.event_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {format(new Date(event.event_date), 'MMMM d, yyyy')}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 mb-3">{event.description}</p>

                      {event.financial_impact && (
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className={`font-semibold ${event.financial_impact > 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {event.financial_impact > 0 ? '+' : ''
                            }${event.financial_impact.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {event.lessons_learned && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded mt-3">
                          <p className="text-sm font-semibold text-yellow-900 mb-1">Lessons Learned:</p>
                          <p className="text-sm text-yellow-800">{event.lessons_learned}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddHistoryModal
            event={editingEvent}
            onClose={() => {
              setShowAddModal(false);
              setEditingEvent(null);
            }}
          />
        )}
      </div>
    </div>
  );
}