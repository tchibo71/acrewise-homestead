import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { MUSHROOM_SPECIES } from "./mushroomBatchConstants";
import { ORIGIN_TYPES, TRANSFER_TYPES, GENERATION_LABELS, GENERATION_COLORS, CULTURE_CONTAINER_TYPES } from "./mushroomLabConstants";
import AddCultureTransferModal from "./AddCultureTransferModal";

const speciesLabel = (v) => MUSHROOM_SPECIES.find(s => s.value === v)?.label || v;
const originLabel = (v) => ORIGIN_TYPES.find(o => o.value === v)?.label || v;
const transferLabel = (v) => TRANSFER_TYPES.find(t => t.value === v)?.label || v;
const containerLabel = (v) => CULTURE_CONTAINER_TYPES.find(c => c.value === v)?.label || "—";
const agarLabel = (v) => v === "pda_potato_dextrose" ? "PDA (Potato Dextrose)" : v === "mea_malt_extract" ? "MEA (Malt Extract)" : v ? v.replace(/_/g, " ") : "—";

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value || "—"}</span>
    </div>
  );
}

export default function MushroomCultureDetailDialog({ culture, onClose }) {
  const [showTransferModal, setShowTransferModal] = useState(false);

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["culture-transfers", culture?.id],
    queryFn: () => base44.entities.CultureTransfer.filter({ mushroom_culture_id: culture.id }),
    enabled: !!culture,
  });

  if (!culture) return null;

  const sortedTransfers = [...transfers].sort((a, b) => new Date(a.transfer_date) - new Date(b.transfer_date));

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{culture.strain_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1">
            <Row label="Status" value={culture.is_active ? "Active" : "Retired"} />
            <Row label="Species" value={speciesLabel(culture.species)} />
            <Row label="Origin" value={originLabel(culture.origin_type)} />
            <Row label="Source" value={culture.source} />
            <Row label="Isolated/Purchased" value={culture.isolation_or_purchase_date ? new Date(culture.isolation_or_purchase_date).toLocaleDateString() : null} />
            <Row label="Agar Recipe" value={agarLabel(culture.agar_recipe)} />
          </div>

          {culture.performance_notes && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Performance Notes</p>
              <p className="text-sm text-gray-700">{culture.performance_notes}</p>
            </div>
          )}

          {/* Transfer History */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Transfer History</p>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowTransferModal(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Transfer
              </Button>
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-500">Loading transfers...</p>
            ) : sortedTransfers.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <GitBranch className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No transfers recorded yet</p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* G0 starting point */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${GENERATION_COLORS.g0_original}`}>
                    G0
                  </div>
                  <div className="text-sm text-gray-500">
                    <p className="font-medium text-gray-700">Original Culture</p>
                    <p className="text-xs">{culture.isolation_or_purchase_date ? new Date(culture.isolation_or_purchase_date).toLocaleDateString() : "Date not set"}</p>
                  </div>
                </div>

                {sortedTransfers.map((t) => {
                  const contamRate = t.contamination_rate_percent != null
                    ? t.contamination_rate_percent
                    : (t.container_count > 0 ? ((t.contamination_detected_count || 0) / t.container_count * 100) : 0);
                  const isHighContam = contamRate > 10;
                  return (
                    <div key={t.id}>
                      <div className="ml-5 w-0.5 h-4 bg-gray-200" />
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${GENERATION_COLORS[t.resulting_generation] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                          {GENERATION_LABELS[t.resulting_generation] || t.resulting_generation}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">{transferLabel(t.transfer_type)}</p>
                            <span className="text-xs text-gray-400 shrink-0">{t.transfer_date ? new Date(t.transfer_date).toLocaleDateString() : "—"}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.container_count || 0} × {containerLabel(t.container_type)} • from {GENERATION_LABELS[t.source_generation] || t.source_generation}
                          </p>
                          <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                            isHighContam ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                          }`}>
                            {isHighContam ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            Contamination: {contamRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {culture.notes && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700">{culture.notes}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showTransferModal && (
        <AddCultureTransferModal culture={culture} onClose={() => setShowTransferModal(false)} />
      )}
    </>
  );
}