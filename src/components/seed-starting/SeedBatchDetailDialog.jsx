import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sprout, Calendar, Layers, TrendingUp, Wind, CheckCircle2, DollarSign, MapPin, Lightbulb, ShoppingBag, Flower2 } from "lucide-react";
import {
  getSeedBatchStage, STAGE_COLORS,
  CONTAINER_TYPES, INTENDED_USES, INDOOR_LIGHT_TYPES,
  GERMINATION_LOSS_REASONS, HARDENING_LOSS_REASONS,
} from "./seedBatchConstants";
import LogGerminationModal from "./LogGerminationModal";
import StartHardeningModal from "./StartHardeningModal";
import CompleteHardeningModal from "./CompleteHardeningModal";
import ListForSaleModal from "./ListForSaleModal";
import TransplantToGardenModal from "./TransplantToGardenModal";

function FieldRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium text-gray-900">{value || "—"}</span>
    </div>
  );
}

function labelFor(options, value) {
  return options.find(o => o.value === value)?.label || value || "—";
}

export default function SeedBatchDetailDialog({ batch, onClose }) {
  const [activeModal, setActiveModal] = useState(null);
  const stage = getSeedBatchStage(batch);

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-600" />
                {batch.crop_name}
                {batch.variety && <span className="text-gray-500 font-normal text-base">— {batch.variety}</span>}
              </DialogTitle>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STAGE_COLORS[stage.key]}`}>
                {stage.label}
              </span>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 bg-gray-50 rounded-lg p-3">
              <FieldRow icon={Calendar} label="Sow date" value={batch.sow_date ? new Date(batch.sow_date).toLocaleDateString() : null} />
              <FieldRow icon={Layers} label="Container" value={labelFor(CONTAINER_TYPES, batch.container_type)} />
              <FieldRow icon={Layers} label="Cells" value={batch.cell_count} />
              <FieldRow icon={Layers} label="Seeds sown" value={batch.seeds_sown} />
              <FieldRow icon={DollarSign} label="Seed cost" value={batch.seed_cost ? `$${batch.seed_cost}` : null} />
              <FieldRow icon={MapPin} label="Seed source" value={batch.seed_source} />
              <FieldRow icon={Lightbulb} label="Light type" value={labelFor(INDOOR_LIGHT_TYPES, batch.indoor_light_type)} />
              <FieldRow icon={Lightbulb} label="Heat mat" value={batch.used_heat_mat ? "Yes" : "No"} />
              <FieldRow icon={CheckCircle2} label="Intended use" value={labelFor(INTENDED_USES, batch.intended_use)} />
            </div>

            {batch.germination_check_date && (
              <div className="space-y-2 bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Germination</p>
                <FieldRow icon={Calendar} label="Check date" value={new Date(batch.germination_check_date).toLocaleDateString()} />
                <FieldRow icon={TrendingUp} label="Germinated" value={`${batch.seeds_germinated} / ${batch.seeds_sown}`} />
                {batch.germination_loss_reason && batch.germination_loss_reason !== "none" && (
                  <FieldRow icon={TrendingUp} label="Loss reason" value={labelFor(GERMINATION_LOSS_REASONS, batch.germination_loss_reason)} />
                )}
                {batch.germination_notes && <p className="text-sm text-gray-600 italic">"{batch.germination_notes}"</p>}
              </div>
            )}

            {batch.hardening_start_date && (
              <div className="space-y-2 bg-amber-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Hardening Off</p>
                <FieldRow icon={Calendar} label="Start date" value={new Date(batch.hardening_start_date).toLocaleDateString()} />
                <FieldRow icon={Wind} label="Started count" value={batch.hardening_started_count} />
                <FieldRow icon={Calendar} label="Days planned" value={batch.hardening_days_planned ?? 10} />
                {batch.hardening_completed_date && (
                  <>
                    <FieldRow icon={Calendar} label="Completed" value={new Date(batch.hardening_completed_date).toLocaleDateString()} />
                    <FieldRow icon={TrendingUp} label="Survived" value={`${batch.hardening_survived_count} / ${batch.hardening_started_count}`} />
                    {batch.hardening_loss_reason && batch.hardening_loss_reason !== "none" && (
                      <FieldRow icon={TrendingUp} label="Loss reason" value={labelFor(HARDENING_LOSS_REASONS, batch.hardening_loss_reason)} />
                    )}
                    {batch.hardening_notes && <p className="text-sm text-gray-600 italic">"{batch.hardening_notes}"</p>}
                  </>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checkpoints</p>
              {!batch.germination_check_date && (
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setActiveModal("germination")}>
                  <TrendingUp className="w-4 h-4 mr-2" /> Log Germination
                </Button>
              )}
              {batch.germination_check_date && !batch.hardening_start_date && (
                <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={() => setActiveModal("hardening")}>
                  <Wind className="w-4 h-4 mr-2" /> Start Hardening Off
                </Button>
              )}
              {batch.hardening_start_date && !batch.hardening_completed_date && (
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveModal("complete")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Hardening
                </Button>
              )}
              {batch.hardening_completed_date && (
                <p className="text-sm text-green-600 text-center font-medium">All checkpoints complete</p>
              )}
            </div>

            {((batch.intended_use === "sell" || batch.intended_use === "both") && batch.hardening_survived_count) ||
             (batch.intended_use === "own_use" || batch.intended_use === "both") ? (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completion Actions</p>
                {(batch.intended_use === "sell" || batch.intended_use === "both") && batch.hardening_survived_count && (
                  batch.marketplace_listing_id ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium py-2">
                      <ShoppingBag className="w-4 h-4" /> Listed for Sale
                    </div>
                  ) : (
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setActiveModal("listSale")}>
                      <ShoppingBag className="w-4 h-4 mr-2" /> List for Sale
                    </Button>
                  )
                )}
                {(batch.intended_use === "own_use" || batch.intended_use === "both") && (
                  batch.transplant_date ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium py-2">
                      <Flower2 className="w-4 h-4" /> Transplanted to Garden
                    </div>
                  ) : (
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setActiveModal("transplant")}>
                      <Flower2 className="w-4 h-4 mr-2" /> Transplant to Garden
                    </Button>
                  )
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {activeModal === "germination" && <LogGerminationModal batch={batch} onClose={() => setActiveModal(null)} />}
      {activeModal === "hardening" && <StartHardeningModal batch={batch} onClose={() => setActiveModal(null)} />}
      {activeModal === "complete" && <CompleteHardeningModal batch={batch} onClose={() => setActiveModal(null)} />}
      {activeModal === "listSale" && <ListForSaleModal batch={batch} onClose={() => setActiveModal(null)} />}
      {activeModal === "transplant" && <TransplantToGardenModal batch={batch} onClose={() => setActiveModal(null)} />}
    </>
  );
}