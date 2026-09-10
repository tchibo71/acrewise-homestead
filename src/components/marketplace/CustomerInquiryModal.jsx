import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, MessageSquare } from "lucide-react";

export default function CustomerInquiryModal({ listing, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    quantity_requested: "",
    preferred_pickup_date: "",
    message: "",
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.CustomerInquiry.create({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || undefined,
        listing_id: listing.id,
        product_name: listing.product_name,
        inquiry_type: "availability",
        message: data.message,
        quantity_requested: data.quantity_requested ? parseFloat(data.quantity_requested) : undefined,
        preferred_pickup_date: data.preferred_pickup_date || undefined,
        status: "pending",
        farm_owner_email: user?.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-inquiries"] });
      onClose();
    },
  });

  const set = (key, value) => setFormData({ ...formData, [key]: value });
  const isValid = formData.customer_name && formData.customer_email && formData.message;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Reserve / Inquire — {listing.product_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input value={formData.customer_name} onChange={e => set("customer_name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.customer_email} onChange={e => set("customer_email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.customer_phone} onChange={e => set("customer_phone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity Requested</Label>
                <Input type="number" value={formData.quantity_requested} onChange={e => set("quantity_requested", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Preferred Pickup Date</Label>
                <Input type="date" value={formData.preferred_pickup_date} onChange={e => set("preferred_pickup_date", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={formData.message} onChange={e => set("message", e.target.value)} placeholder="e.g., I'd like to reserve 20 tomato seedlings..." rows={3} required />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!isValid || createMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Record Inquiry</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}