import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { saveDraft, isOnline } from "@/components/utils/offlineStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, WifiOff } from "lucide-react";

export default function AddInventoryModal({ onClose }) {
  const queryClient = useQueryClient();
  
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    item_name: "",
    category: "feed",
    subcategory: "",
    brand: "",
    unit_type: "lbs",
    current_quantity: "",
    minimum_quantity: "",
    reorder_quantity: "",
    unit_cost: "",
    storage_location: "",
    expiration_date: "",
    lot_number: "",
    supplier: "",
    supplier_contact: "",
    usage_rate: "",
    usage_period: "monthly",
    notes: "",
    enable_low_stock_alert: true,
    enable_expiration_alert: true,
    barcode: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.current_quantity) submitData.current_quantity = parseFloat(submitData.current_quantity);
      if (submitData.minimum_quantity) submitData.minimum_quantity = parseFloat(submitData.minimum_quantity);
      if (submitData.reorder_quantity) submitData.reorder_quantity = parseFloat(submitData.reorder_quantity);
      if (submitData.unit_cost) submitData.unit_cost = parseFloat(submitData.unit_cost);
      if (submitData.usage_rate) submitData.usage_rate = parseFloat(submitData.usage_rate);
      
      // Calculate total value
      if (submitData.current_quantity && submitData.unit_cost) {
        submitData.total_value = submitData.current_quantity * submitData.unit_cost;
      }
      
      return base44.entities.InventoryItem.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if online
    if (!isOnline()) {
      try {
        await saveDraft('inventory_item', formData, currentUser?.email);
        alert("📱 Offline: Inventory saved as draft. Will sync when online.");
        onClose();
      } catch (error) {
        alert("Failed to save draft offline");
      }
      return;
    }

    createMutation.mutate(formData);
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft('inventory_item', formData, currentUser?.email);
      alert("✅ Draft saved! Will sync when online.");
      onClose();
    } catch (error) {
      alert("Failed to save draft");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {!isOnline() && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 flex items-center gap-2 mb-4">
              <WifiOff className="w-5 h-5 text-orange-600" />
              <p className="text-sm text-orange-800 font-medium">
                Offline Mode - Will save as draft
              </p>
            </div>
          )}

          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="stock">Stock & Alerts</TabsTrigger>
              <TabsTrigger value="supplier">Supplier Info</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Item Name *</Label>
                  <Input
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    required
                    placeholder="e.g., Chicken Feed - Layer Pellets"
                  />
                </div>

                <div>
                  <Label>Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feed">Feed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="fertilizer">Fertilizer</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="vaccine">Vaccine</SelectItem>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="bedding">Bedding</SelectItem>
                      <SelectItem value="fencing">Fencing</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="pesticide">Pesticide</SelectItem>
                      <SelectItem value="herbicide">Herbicide</SelectItem>
                      <SelectItem value="cleaning">Cleaning Supplies</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="processing">Processing Supplies</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subcategory</Label>
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                    placeholder="e.g., Organic, Non-GMO"
                  />
                </div>

                <div>
                  <Label>Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Brand or manufacturer"
                  />
                </div>

                <div>
                  <Label>Storage Location</Label>
                  <Input
                    value={formData.storage_location}
                    onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                    placeholder="e.g., Barn - Bay 3"
                  />
                </div>

                <div>
                  <Label>Barcode/SKU</Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    placeholder="Product barcode"
                  />
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Additional information..."
                />
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Current Quantity *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.current_quantity}
                      onChange={(e) => setFormData({...formData, current_quantity: e.target.value})}
                      required
                      className="flex-1"
                    />
                    <Select
                      value={formData.unit_type}
                      onValueChange={(value) => setFormData({...formData, unit_type: value})}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="gallons">gallons</SelectItem>
                        <SelectItem value="liters">liters</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                        <SelectItem value="boxes">boxes</SelectItem>
                        <SelectItem value="bales">bales</SelectItem>
                        <SelectItem value="bottles">bottles</SelectItem>
                        <SelectItem value="each">each</SelectItem>
                        <SelectItem value="other">other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Unit Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                    placeholder="Cost per unit"
                  />
                </div>

                <div>
                  <Label>Minimum Quantity (Reorder Point)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.minimum_quantity}
                    onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value})}
                    placeholder="Alert when stock falls below this"
                  />
                </div>

                <div>
                  <Label>Reorder Quantity</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({...formData, reorder_quantity: e.target.value})}
                    placeholder="How much to reorder"
                  />
                </div>

                <div>
                  <Label>Expiration Date</Label>
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Lot Number</Label>
                  <Input
                    value={formData.lot_number}
                    onChange={(e) => setFormData({...formData, lot_number: e.target.value})}
                    placeholder="Batch/lot number"
                  />
                </div>

                <div>
                  <Label>Average Usage Rate</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.usage_rate}
                    onChange={(e) => setFormData({...formData, usage_rate: e.target.value})}
                    placeholder="Usage amount"
                  />
                </div>

                <div>
                  <Label>Usage Period</Label>
                  <Select
                    value={formData.usage_period}
                    onValueChange={(value) => setFormData({...formData, usage_period: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Per Day</SelectItem>
                      <SelectItem value="weekly">Per Week</SelectItem>
                      <SelectItem value="monthly">Per Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="low-stock-alert"
                    checked={formData.enable_low_stock_alert}
                    onCheckedChange={(checked) => setFormData({...formData, enable_low_stock_alert: checked})}
                  />
                  <Label htmlFor="low-stock-alert" className="cursor-pointer">
                    Enable low stock alerts
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="expiration-alert"
                    checked={formData.enable_expiration_alert}
                    onCheckedChange={(checked) => setFormData({...formData, enable_expiration_alert: checked})}
                  />
                  <Label htmlFor="expiration-alert" className="cursor-pointer">
                    Enable expiration alerts
                  </Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="supplier" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Primary Supplier</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <Label>Supplier Contact</Label>
                  <Input
                    value={formData.supplier_contact}
                    onChange={(e) => setFormData({...formData, supplier_contact: e.target.value})}
                    placeholder="Phone, email, or website"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 flex justify-between">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}