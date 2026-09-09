import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import LivestockPhotoUpload from "@/components/livestock/LivestockPhotoUpload";
import { ANIMAL_TYPES, PURPOSES } from "@/components/livestock/livestockConstants";

export default function EditLivestockModal({ animal, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(animal);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const { data: allAnimals = [] } = useQuery({
    queryKey: ['all-livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Livestock.update(animal.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock', animal.id] });
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      queryClient.invalidateQueries({ queryKey: ['all-livestock'] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.birth_weight) submitData.birth_weight = parseFloat(submitData.birth_weight);
    if (submitData.current_weight) submitData.current_weight = parseFloat(submitData.current_weight);
    if (submitData.acquisition_cost) submitData.acquisition_cost = parseFloat(submitData.acquisition_cost);
    if (submitData.insurance_value) submitData.insurance_value = parseFloat(submitData.insurance_value);
    
    // Ensure animal_type_other is only sent if animal_type is 'other'
    if (submitData.animal_type !== 'other') {
      submitData.animal_type_other = null;
    }

    if (selectedPhoto) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedPhoto });
        submitData.photo_url = file_url;
      } catch (err) {
        alert("Failed to upload photo. Please try again.");
        return;
      }
    }

    mutation.mutate(submitData);
  };

  // Filter animals for parent selection, based on the *currently selected* animal type in the form
  const potentialMothers = allAnimals.filter(a => 
    a.gender === 'female' && 
    a.animal_type === formData.animal_type && // Use formData.animal_type for dynamic filtering
    a.id !== animal.id
  );

  const potentialFathers = allAnimals.filter(a => 
    a.gender === 'male' && 
    a.animal_type === formData.animal_type && // Use formData.animal_type for dynamic filtering
    a.id !== animal.id
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Livestock - {animal.name_or_tag}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Animal Type</Label>
                <Select
                  value={formData.animal_type}
                  onValueChange={(value) => setFormData({...formData, animal_type: value, animal_type_other: value === 'other' ? formData.animal_type_other : ''})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMAL_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.animal_type === 'other' && (
                <div>
                  <Label>Specify Animal Type *</Label>
                  <Input
                    value={formData.animal_type_other || ''}
                    onChange={(e) => setFormData({...formData, animal_type_other: e.target.value})}
                    placeholder="e.g., Llama, Alpaca, Quail"
                    required
                  />
                </div>
              )}

              <div>
                <Label>Name or Tag *</Label>
                <Input
                  value={formData.name_or_tag}
                  onChange={(e) => setFormData({...formData, name_or_tag: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label>Breed</Label>
                <Input
                  value={formData.breed || ''}
                  onChange={(e) => setFormData({...formData, breed: e.target.value})}
                />
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                    <SelectItem value="butchered">Butchered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Purpose</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => setFormData({...formData, purpose: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <LivestockPhotoUpload
              photoUrl={formData.photo_url || null}
              onFileSelect={(file) => setSelectedPhoto(file)}
            />
          </div>

          <Separator />

          {/* Parental Lineage */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Parental Lineage</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Mother Section */}
              <div className="space-y-3">
                <div>
                  <Label>Select Mother from System</Label>
                  <Select
                    value={formData.mother_id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({...formData, mother_id: null});
                      } else {
                        const selectedMother = allAnimals.find(a => a.id === value);
                        setFormData({
                          ...formData, 
                          mother_id: value,
                          mother_name: selectedMother?.name_or_tag || ''
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mother..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Mother Selected --</SelectItem>
                      {potentialMothers.length === 0 ? (
                        <SelectItem value="no_females" disabled>No eligible females found</SelectItem>
                      ) : (
                        potentialMothers.map(mother => (
                          <SelectItem key={mother.id} value={mother.id}>
                            {mother.name_or_tag} {mother.breed && `(${mother.breed})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Or Enter Mother's Name (External)</Label>
                  <Input
                    value={formData.mother_name || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      mother_name: e.target.value,
                      mother_id: e.target.value ? null : formData.mother_id
                    })}
                    placeholder="Enter name if not in system..."
                    disabled={!!formData.mother_id}
                  />
                  {formData.mother_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Clear dropdown selection to enter external name
                    </p>
                  )}
                </div>
              </div>

              {/* Father Section */}
              <div className="space-y-3">
                <div>
                  <Label>Select Father from System</Label>
                  <Select
                    value={formData.father_id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData({...formData, father_id: null});
                      } else {
                        const selectedFather = allAnimals.find(a => a.id === value);
                        setFormData({
                          ...formData, 
                          father_id: value,
                          father_name: selectedFather?.name_or_tag || ''
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select father..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Father Selected --</SelectItem>
                      {potentialFathers.length === 0 ? (
                        <SelectItem value="no_males" disabled>No eligible males found</SelectItem>
                      ) : (
                        potentialFathers.map(father => (
                          <SelectItem key={father.id} value={father.id}>
                            {father.name_or_tag} {father.breed && `(${father.breed})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Or Enter Father's Name (External)</Label>
                  <Input
                    value={formData.father_name || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      father_name: e.target.value,
                      father_id: e.target.value ? null : formData.father_id
                    })}
                    placeholder="Enter name if not in system..."
                    disabled={!!formData.father_id}
                  />
                  {formData.father_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Clear dropdown selection to enter external name
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Insurance Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Insurance Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Policy Number</Label>
                <Input
                  value={formData.insurance_policy_number || ''}
                  onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                  placeholder="e.g., POL-123456"
                />
              </div>

              <div>
                <Label>Insurance Company</Label>
                <Input
                  value={formData.insurance_company || ''}
                  onChange={(e) => setFormData({...formData, insurance_company: e.target.value})}
                  placeholder="Company name"
                />
              </div>

              <div>
                <Label>Insured Value ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.insurance_value || ''}
                  onChange={(e) => setFormData({...formData, insurance_value: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={4}
              placeholder="Additional notes about this animal..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}