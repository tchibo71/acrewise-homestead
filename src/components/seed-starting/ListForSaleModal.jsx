import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Check, DollarSign } from "lucide-react";

export default function ListForSaleModal({ batch, onClose }) {
  const queryClient = useQueryClient();
  const maxQuantity = (batch.hardening_survived_count || 0) - (batch.transplanted_count || 0);
  const [formData, setFormData] = useState({
    quantity_listed_for_sale: maxQuantity > 0 ? String(maxQuantity) : "",
    price_per_unit: batch.price_per_unit ? String(batch.price_per_unit) : "",
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const qty = parseFloat(data.quantity_listed_for_sale);
      const price = parseFloat(data.price_per_unit);
      const listing = await base44.entities.MarketplaceListing.create({
        product_name: `${batch.crop_name}${batch.variety ? ` — ${batch.variety}` : ""} Seedlings`,
        category: "plants",
        description: `${batch.crop_name}${batch.variety ? ` (${batch.variety})` : ""} seedlings, hardened off and ready to plant.`,
        quantity_available: qty,
        unit: "each",
        price: price,
        is_public: false,
      });
      await base44.entities.SeedBatch.update(batch.id, {
        quantity_listed_for_sale: qty,
        price_per_unit: price,
        ready_to_sell_date: new Date().toISOString().split("T")[0],
        marketplace_listing_id: listing.id,
      });
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seed-batches"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      onClose();
    },
  });

  const set = (key, value) => setFormData({ ...formData, [key]: value });
  const qty = parseFloat(formData.quantity_listed_for_sale) || 0;
  const price = parseFloat(formData.price_per_unit) || 0;
  const isValid = qty > 0 && qty <= maxQuantity && price > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            List for Sale — {batch.crop_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
            <div>Survived hardening: <span className="font-semibold">{batch.hardening_survived_count}</span></div>
            {batch.transplanted_count > 0 && <div>Already transplanted: <span className="font-semibold">{batch.transplanted_count}</span></div>}
            <div>Available to list: <span className="font-semibold text-green-700">{maxQuantity}</span></div>
          </div>
          <div className="space-y-2">
            <Label>Quantity to List *</Label>
            <Input type="number" value={formData.quantity_listed_for_sale} onChange={e => set("quantity_listed_for_sale", e.target.value)} max={maxQuantity} />
            <p className="text-xs text-gray-500">Cannot exceed {maxQuantity} (survived minus transplanted)</p>
          </div>
          <div className="space-y-2">
            <Label>Price per Seedling ($) *</Label>
            <Input type="number" step="0.01" value={formData.price_per_unit} onChange={e => set("price_per_unit", e.target.value)} placeholder="e.g., 3.50" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => submitMutation.mutate(formData)} disabled={!isValid || submitMutation.isPending} className="bg-green-600 hover:bg-green-700">
            {submitMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Check className="w-4 h-4 mr-2" />Create Listing</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}