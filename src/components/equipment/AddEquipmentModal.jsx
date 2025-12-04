import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AddEquipmentModal({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    equipment_name: "",
    equipment_type: "tractor",
    brand: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    purchase_price: "",
    current_value: "",
    condition: "good",
    storage_location: "",
    last_maintenance_date: "",
    next_maintenance_due: "",
    maintenance_interval_days: "",
    operating_hours: "",
    fuel_type: "gasoline",
    warranty_expiration: "",
    insurance_policy: "",
    insurance_value: "",
    manual_url: "",
    parts_supplier: "",
    status: "operational",
    notes: ""
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.purchase_price) submitData.purchase_price = parseFloat(submitData.purchase_price);
      if (submitData.current_value) submitData.current_value = parseFloat(submitData.current_value);
      if (submitData.insurance_value) submitData.insurance_value = parseFloat(submitData.insurance_value);
      if (submitData.operating_hours) submitData.operating_hours = parseFloat(submitData.operating_hours);
      if (submitData.maintenance_interval_days) submitData.maintenance_interval_days = parseInt(submitData.maintenance_interval_days);
      
      return base44.entities.Equipment.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="insurance">Insurance & Value</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Equipment Name *</Label>
                  <Input
                    value={formData.equipment_name}
                    onChange={(e) => setFormData({...formData, equipment_name: e.target.value})}
                    required
                    placeholder="e.g., John Deere Tractor"
                  />
                </div>

                <div>
                  <Label>Equipment Type *</Label>
                  <Select
                    value={formData.equipment_type}
                    onValueChange={(value) => setFormData({...formData, equipment_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tractor">Tractor</SelectItem>
                      <SelectItem value="mower">Mower</SelectItem>
                      <SelectItem value="tiller">Tiller</SelectItem>
                      <SelectItem value="harvester">Harvester</SelectItem>
                      <SelectItem value="sprayer">Sprayer</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="trailer">Trailer</SelectItem>
                      <SelectItem value="atv">ATV</SelectItem>
                      <SelectItem value="hand_tool">Hand Tool</SelectItem>
                      <SelectItem value="power_tool">Power Tool</SelectItem>
                      <SelectItem value="processing_equipment">Processing Equipment</SelectItem>
                      <SelectItem value="irrigation_equipment">Irrigation Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="e.g., John Deere"
                  />
                </div>

                <div>
                  <Label>Model</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="Model number"
                  />
                </div>

                <div>
                  <Label>Serial Number</Label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    placeholder="Serial/VIN number"
                  />
                </div>

                <div>
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Purchase Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                    placeholder="Original purchase price"
                  />
                </div>

                <div>
                  <Label>Current Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.current_value}
                    onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                    placeholder="Current estimated value"
                  />
                </div>

                <div>
                  <Label>Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({...formData, condition: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="needs_repair">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="in_repair">In Repair</SelectItem>
                      <SelectItem value="out_of_service">Out of Service</SelectItem>
                      <SelectItem value="rented_out">Rented Out</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Fuel Type</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value) => setFormData({...formData, fuel_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasoline</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                      <SelectItem value="propane">Propane</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Storage Location</Label>
                  <Input
                    value={formData.storage_location}
                    onChange={(e) => setFormData({...formData, storage_location: e.target.value})}
                    placeholder="Where is it stored?"
                  />
                </div>

                <div>
                  <Label>Operating Hours</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.operating_hours}
                    onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                    placeholder="Total operating hours"
                  />
                </div>

                <div>
                  <Label>User Manual URL</Label>
                  <Input
                    type="url"
                    value={formData.manual_url}
                    onChange={(e) => setFormData({...formData, manual_url: e.target.value})}
                    placeholder="Link to manual"
                  />
                </div>

                <div>
                  <Label>Parts Supplier</Label>
                  <Input
                    value={formData.parts_supplier}
                    onChange={(e) => setFormData({...formData, parts_supplier: e.target.value})}
                    placeholder="Where to get parts"
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

            <TabsContent value="maintenance" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Last Maintenance Date</Label>
                  <Input
                    type="date"
                    value={formData.last_maintenance_date}
                    onChange={(e) => setFormData({...formData, last_maintenance_date: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Next Maintenance Due</Label>
                  <Input
                    type="date"
                    value={formData.next_maintenance_due}
                    onChange={(e) => setFormData({...formData, next_maintenance_due: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Maintenance Interval (Days)</Label>
                  <Input
                    type="number"
                    value={formData.maintenance_interval_days}
                    onChange={(e) => setFormData({...formData, maintenance_interval_days: e.target.value})}
                    placeholder="e.g., 90 for every 3 months"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insurance" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Insurance Policy Number</Label>
                  <Input
                    value={formData.insurance_policy}
                    onChange={(e) => setFormData({...formData, insurance_policy: e.target.value})}
                    placeholder="Policy number"
                  />
                </div>

                <div>
                  <Label>Insurance Value</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.insurance_value}
                    onChange={(e) => setFormData({...formData, insurance_value: e.target.value})}
                    placeholder="Insured value"
                  />
                </div>

                <div>
                  <Label>Warranty Expiration</Label>
                  <Input
                    type="date"
                    value={formData.warranty_expiration}
                    onChange={(e) => setFormData({...formData, warranty_expiration: e.target.value})}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-gray-700 hover:bg-gray-800"
            >
              {createMutation.isPending ? "Adding..." : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}