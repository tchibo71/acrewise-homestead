import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hash, Beaker, Calendar, DollarSign, FlaskConical, Building2 } from "lucide-react";
import { MUSHROOM_SPECIES, SUBSTRATE_TYPES, CONTAINER_TYPES, SPAWN_TYPES, SPAWN_SOURCING, STATUS_COLORS, getStageLabel } from "./mushroomBatchConstants";

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value || "—"}</span>
    </div>
  );
}

const labelOf = (list, value) => list.find(i => i.value === value)?.label || value || "—";

export default function MushroomBatchDetailDialog({ batch, onClose }) {
  if (!batch) return null;
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch.batch_name}</DialogTitle>
        </DialogHeader>

        {batch.lot_number && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
            <Hash className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 uppercase tracking-wide">Lot Number</p>
              <p className="text-lg font-mono font-bold text-amber-900 tracking-wide">{batch.lot_number}</p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Row label="Status" value={<span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[batch.status]}`}>{getStageLabel(batch.status)}</span>} />
          <Row label="Species" value={labelOf(MUSHROOM_SPECIES, batch.species)} />
          <Row label="Strain" value={batch.strain_name} />
          <Row label="Substrate" value={labelOf(SUBSTRATE_TYPES, batch.substrate_type)} />
          <Row label="Container" value={labelOf(CONTAINER_TYPES, batch.container_type)} />
          <Row label="Container Count" value={batch.container_count} />
          <Row label="Inoculation Date" value={batch.inoculation_date ? new Date(batch.inoculation_date).toLocaleDateString() : null} />
          <Row label="Expected Colonization" value={batch.expected_colonization_date ? new Date(batch.expected_colonization_date).toLocaleDateString() : null} />
          <Row label="Expected Harvest" value={batch.expected_harvest_date ? new Date(batch.expected_harvest_date).toLocaleDateString() : null} />
          <Row label="Actual Harvest" value={batch.actual_harvest_date ? new Date(batch.actual_harvest_date).toLocaleDateString() : null} />
          <Row label="Yield (lbs)" value={batch.yield_lbs} />
        </div>

        <div className="pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Spawn</p>
          <div className="space-y-1">
            <Row label="Sourcing" value={labelOf(SPAWN_SOURCING, batch.spawn_sourcing)} />
            {batch.spawn_sourcing === "purchased" ? (
              <>
                <Row label="Source" value={batch.spawn_source} />
                <Row label="Spawn Type" value={labelOf(SPAWN_TYPES, batch.spawn_type)} />
                <Row label="Cost" value={batch.spawn_cost != null ? `$${batch.spawn_cost}` : null} />
              </>
            ) : (
              <Row label="Culture Transfer ID" value={batch.spawn_culture_transfer_id} />
            )}
          </div>
        </div>

        {batch.grow_room_id && (
          <div className="pt-3 flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span>Grow Room: <span className="font-medium text-gray-900">{batch.grow_room_id}</span></span>
          </div>
        )}

        {batch.notes && (
          <div className="pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700">{batch.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}