import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ACCOUNT_TYPES, DELIVERY_METHODS, PAYMENT_TERMS, FREQUENCY_OPTIONS, ORDER_UNITS, MUSHROOM_SPECIES } from "./wholesaleConstants";

export default function AddWholesaleAccountModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "restaurant",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    standing_order_active: false,
    standing_order_species: [],
    standing_order_quantity: "",
    standing_order_unit: "lbs",
    standing_order_frequency: "none",
    delivery_day: "",
    delivery_method: "self_delivery",
    agreed_price_per_unit: "",
    payment_terms: "due_on_delivery",
    active: true,
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.standing_order_quantity) submitData.standing_order_quantity = parseFloat(submitData.standing_order_quantity);
      if (submitData.agreed_price_per_unit) submitData.agreed_price_per_unit = parseFloat(submitData.agreed_price_per_unit);
      return base44.entities.WholesaleAccount.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wholesale-accounts"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleSpecies = (value) => {
    setFormData(prev => ({
      ...prev,
      standing_order_species: prev.standing_order_species.includes(value)
        ? prev.standing_order_species.filter(s => s !== value)
        : [...prev.standing_order_species, value],
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Wholesale Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Account Name *</Label>
              <Input value={formData.account_name} onChange={(e) => setFormData({ ...formData, account_name: e.target.value })} required placeholder="e.g., Green Restaurant" />
            </div>
            <div>
              <Label>Account Type *</Label>
              <Select value={formData.account_type} onValueChange={(v) => setFormData({ ...formData, account_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Contact Name</Label>
              <Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Standing Order</Label>
              <p className="text-xs text-gray-500">This account has a recurring standing order</p>
            </div>
            <Switch checked={formData.standing_order_active} onCheckedChange={(v) => setFormData({ ...formData, standing_order_active: v })} />
          </div>

          {formData.standing_order_active && (
            <div className="space-y-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div>
                <Label className="text-sm">Species</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {MUSHROOM_SPECIES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSpecies(s.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        formData.standing_order_species.includes(s.value)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" step="0.1" value={formData.standing_order_quantity} onChange={(e) => setFormData({ ...formData, standing_order_quantity: e.target.value })} placeholder="e.g., 10" />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={formData.standing_order_unit} onValueChange={(v) => setFormData({ ...formData, standing_order_unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select value={formData.standing_order_frequency} onValueChange={(v) => setFormData({ ...formData, standing_order_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Delivery Day</Label>
                <Input value={formData.delivery_day} onChange={(e) => setFormData({ ...formData, delivery_day: e.target.value })} placeholder="e.g., Tuesday" />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Delivery Method</Label>
              <Select value={formData.delivery_method} onValueChange={(v) => setFormData({ ...formData, delivery_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELIVERY_METHODS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Select value={formData.payment_terms} onValueChange={(v) => setFormData({ ...formData, payment_terms: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Agreed Price / Unit ($)</Label>
            <Input type="number" step="0.01" value={formData.agreed_price_per_unit} onChange={(e) => setFormData({ ...formData, agreed_price_per_unit: e.target.value })} placeholder="e.g., 12.50" />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="General notes" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {createMutation.isPending ? "Saving..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}