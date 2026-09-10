import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Beaker } from "lucide-react";
import { format } from "date-fns";
import { MUSHROOM_SPECIES, ORDER_UNITS, getSpeciesLabel, getAvailableLbs } from "./wholesaleConstants";

export default function AddWholesaleOrderModal({ accounts, flushes, batches, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    wholesale_account_id: "",
    order_date: new Date().toISOString().slice(0, 10),
    delivery_date: "",
    species: "oyster",
    quantity: "",
    unit: "lbs",
    price_per_unit: "",
    notes: "",
  });
  const [selectedFlushIds, setSelectedFlushIds] = useState([]);

  const batchMap = useMemo(() => {
    const m = {};
    batches.forEach(b => { m[b.id] = b; });
    return m;
  }, [batches]);

  // Flushes not yet fully allocated (available > 0)
  const availableFlushes = useMemo(() => {
    return flushes
      .filter(f => getAvailableLbs(f) > 0)
      .sort((a, b) => new Date(b.harvest_date) - new Date(a.harvest_date));
  }, [flushes]);

  // Auto-fill price from account's agreed price
  const selectedAccount = accounts.find(a => a.id === formData.wholesale_account_id);

  const handleAccountChange = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    setFormData(prev => ({
      ...prev,
      wholesale_account_id: accountId,
      price_per_unit: account?.agreed_price_per_unit?.toString() || prev.price_per_unit,
      unit: account?.standing_order_unit || prev.unit,
      species: account?.standing_order_species?.[0] || prev.species,
    }));
  };

  const totalAmount = useMemo(() => {
    const q = parseFloat(formData.quantity) || 0;
    const p = parseFloat(formData.price_per_unit) || 0;
    return (q * p).toFixed(2);
  }, [formData.quantity, formData.price_per_unit]);

  const toggleFlush = (flushId) => {
    setSelectedFlushIds(prev =>
      prev.includes(flushId) ? prev.filter(id => id !== flushId) : [...prev, flushId]
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const submitData = {
        ...data,
        quantity: parseFloat(data.quantity) || 0,
        price_per_unit: parseFloat(data.price_per_unit) || 0,
        total_amount: parseFloat(totalAmount),
        fulfilled_from_flush_ids: selectedFlushIds,
        invoice_number: `INV-${data.order_date.replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`,
        invoice_status: "draft",
        delivery_status: "scheduled",
      };

      // Create the order
      const order = await base44.entities.WholesaleOrder.create(submitData);

      // Update allocated_lbs on selected flushes (allocate proportionally by quantity)
      const totalSelectedLbs = selectedFlushIds.reduce((sum, id) => {
        const f = flushes.find(fl => fl.id === id);
        return sum + (f ? getAvailableLbs(f) : 0);
      }, 0);
      const orderQtyLbs = data.unit === "lbs" ? (parseFloat(data.quantity) || 0) : 0;

      if (totalSelectedLbs > 0 && orderQtyLbs > 0) {
        for (const flushId of selectedFlushIds) {
          const flush = flushes.find(f => f.id === flushId);
          if (!flush) continue;
          const available = getAvailableLbs(flush);
          const allocate = Math.min(available, (available / totalSelectedLbs) * orderQtyLbs);
          await base44.entities.MushroomFlush.update(flushId, {
            allocated_lbs: (flush.allocated_lbs || 0) + allocate,
          });
        }
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wholesale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["mushroom-flushes"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Wholesale Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Account *</Label>
            <Select value={formData.wholesale_account_id} onValueChange={handleAccountChange} required>
              <SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Order Date *</Label>
              <Input type="date" value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })} required />
            </div>
            <div>
              <Label>Delivery Date</Label>
              <Input type="date" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Species *</Label>
              <Select value={formData.species} onValueChange={(v) => setFormData({ ...formData, species: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MUSHROOM_SPECIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity *</Label>
              <Input type="number" step="0.1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required placeholder="e.g., 10" />
            </div>
            <div>
              <Label>Price / Unit ($)</Label>
              <Input type="number" step="0.01" value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })} placeholder="e.g., 12.50" />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 border p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="text-lg font-bold text-gray-900">${totalAmount}</span>
          </div>

          {/* Flush selector */}
          <div>
            <Label className="flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              Fulfill from Flushes (optional)
            </Label>
            <p className="text-xs text-gray-500 mb-2">Only flushes with available capacity are shown</p>
            {availableFlushes.length === 0 ? (
              <div className="rounded-lg border-dashed border p-4 text-center text-sm text-gray-400">
                No flushes with available capacity. Record harvests first.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                {availableFlushes.map(flush => {
                  const batch = batchMap[flush.mushroom_batch_id];
                  const available = getAvailableLbs(flush);
                  const isSelected = selectedFlushIds.includes(flush.id);
                  return (
                    <label
                      key={flush.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-50 border-indigo-300" : "hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleFlush(flush.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {batch?.batch_name || "Unknown batch"} · Flush #{flush.flush_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getSpeciesLabel(flush.species)} · {flush.harvest_date ? format(new Date(flush.harvest_date), 'MMM d') : "—"}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-indigo-600 flex-shrink-0">
                        {available.toFixed(1)} lbs avail
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="General notes" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {createMutation.isPending ? "Saving..." : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}