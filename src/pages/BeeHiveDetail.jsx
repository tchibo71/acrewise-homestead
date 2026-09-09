import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Plus,
  Bug,
  Calendar,
  MapPin,
  Activity,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddInspectionModal from "@/components/bee-hive/AddInspectionModal";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  HIVE_TYPE_LABELS,
  COLONY_STRENGTH_LABELS,
  HIVE_STATUS_LABELS,
  QUEEN_COLOR_LABELS,
  QUEEN_COLOR_HEX,
  BROOD_PATTERN_LABELS,
  TEMPERAMENT_LABELS,
  STORES_LEVEL_LABELS,
} from "@/components/bee-hive/beeHiveConstants";

export default function BeeHiveDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const hiveId = urlParams.get("id");
  const queryClient = useQueryClient();
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: hive, isLoading } = useQuery({
    queryKey: ['bee-hive', hiveId],
    queryFn: async () => {
      const result = await base44.entities.BeeHive.get(hiveId);
      return result ?? null;
    },
    enabled: !!hiveId,
  });

  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['hive-inspections', hiveId],
    queryFn: async () => {
      const all = await base44.entities.HiveInspection.list('-inspection_date', 200);
      return all.filter(i => i.hive_id === hiveId);
    },
    enabled: !!hiveId,
  });

  const deleteHiveMutation = useMutation({
    mutationFn: async () => {
      // Delete all inspections first
      for (const insp of inspections) {
        await base44.entities.HiveInspection.delete(insp.id);
      }
      await base44.entities.BeeHive.delete(hiveId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bee-hives'] });
      queryClient.invalidateQueries({ queryKey: ['hive-inspections', hiveId] });
      window.history.back();
    },
  });

  if (!hiveId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">No hive selected.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!hive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Hive not found</h3>
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    active: { className: "bg-green-100 text-green-800 border-green-200" },
    swarmed: { className: "bg-blue-100 text-blue-800 border-blue-200" },
    absconded: { className: "bg-orange-100 text-orange-800 border-orange-200" },
    dead: { className: "bg-red-100 text-red-800 border-red-200" },
    combined: { className: "bg-purple-100 text-purple-800 border-purple-200" },
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{hive.hive_name}</h1>
              {hive.hive_type && (
                <p className="text-gray-600">{HIVE_TYPE_LABELS[hive.hive_type]}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Hive Info Card */}
        <Card className="shadow-md bg-white/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hive Information</CardTitle>
              <Badge className={statusConfig[hive.status]?.className || statusConfig.active.className}>
                {HIVE_STATUS_LABELS[hive.status] || hive.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hive.colony_strength && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Colony Strength:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {COLONY_STRENGTH_LABELS[hive.colony_strength]}
                  </span>
                </div>
              )}
              {hive.install_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Install Date:</span>
                  <span className="text-sm font-medium text-gray-900">{hive.install_date}</span>
                </div>
              )}
              {hive.location_notes && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Location:</span>
                  <span className="text-sm font-medium text-gray-900">{hive.location_notes}</span>
                </div>
              )}
              {hive.queen_source && (
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Queen Source:</span>
                  <span className="text-sm font-medium text-gray-900">{hive.queen_source}</span>
                </div>
              )}
              {hive.queen_marked_color && (
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: QUEEN_COLOR_HEX[hive.queen_marked_color] }}
                  />
                  <span className="text-sm text-gray-500">Queen Marked:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {QUEEN_COLOR_LABELS[hive.queen_marked_color]}
                  </span>
                </div>
              )}
              {hive.queen_last_seen_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Queen Last Seen:</span>
                  <span className="text-sm font-medium text-gray-900">{hive.queen_last_seen_date}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspection History */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Inspection History
            <span className="text-gray-500 font-normal ml-2">({inspections.length})</span>
          </h2>
          <Button onClick={() => setShowInspectionModal(true)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Inspection
          </Button>
        </div>

        {inspectionsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : inspections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No inspections yet</h3>
              <p className="text-gray-500 mb-4">Record your first hive inspection</p>
              <Button onClick={() => setShowInspectionModal(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add First Inspection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inspections.map((insp, idx) => (
              <Card key={insp.id} className="shadow-sm bg-white/80">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                        {inspections.length - idx}
                      </div>
                      <span className="font-semibold text-gray-900">{insp.inspection_date}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insp.brood_pattern && insp.brood_pattern !== "not_checked" && (
                        <Badge variant="outline" className="text-xs">
                          Brood: {BROOD_PATTERN_LABELS[insp.brood_pattern]}
                        </Badge>
                      )}
                      {insp.temperament && (
                        <Badge variant="outline" className="text-xs">
                          {TEMPERAMENT_LABELS[insp.temperament]}
                        </Badge>
                      )}
                      {insp.stores_level && (
                        <Badge variant="outline" className="text-xs">
                          Stores: {STORES_LEVEL_LABELS[insp.stores_level]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      {insp.queen_seen ? (
                        <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-gray-700">Queen seen</span></>
                      ) : (
                        <><XCircle className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Queen not seen</span></>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {insp.eggs_seen ? (
                        <><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-gray-700">Eggs seen</span></>
                      ) : (
                        <><XCircle className="w-4 h-4 text-gray-400" /><span className="text-gray-500">No eggs</span></>
                      )}
                    </div>
                    {insp.varroa_mite_check_done && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-gray-700">
                          Varroa: {insp.varroa_mite_count ?? 'N/A'} mites/100 bees
                        </span>
                      </div>
                    )}
                  </div>

                  {insp.actions_taken && (
                    <div className="text-sm">
                      <span className="text-gray-500">Actions: </span>
                      <span className="text-gray-700">{insp.actions_taken}</span>
                    </div>
                  )}
                  {insp.notes && (
                    <div className="text-sm">
                      <span className="text-gray-500">Notes: </span>
                      <span className="text-gray-700">{insp.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showInspectionModal && (
          <AddInspectionModal hive={hive} onClose={() => setShowInspectionModal(false)} />
        )}

        {showDeleteDialog && (
          <ConfirmDeleteDialog
            open={true}
            onOpenChange={() => setShowDeleteDialog(false)}
            onConfirm={() => deleteHiveMutation.mutate()}
            title={`Delete ${hive.hive_name}?`}
            description={`This will permanently delete this hive and all ${inspections.length} inspection record(s). This cannot be undone.`}
          />
        )}
      </div>
    </div>
  );
}