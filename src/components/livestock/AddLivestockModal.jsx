import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { logLivestockAdded } from "@/components/utils/farmHistoryLogger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Tag, 
  Heart, 
  DollarSign,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STEPS = [
  { id: 1, title: "Basic ID", icon: Tag, description: "Animal identification" },
  { id: 2, title: "Lineage & Health", icon: Heart, description: "Family & health info" },
  { id: 3, title: "Financial & Purpose", icon: DollarSign, description: "Cost & purpose" }
];

export default function AddLivestockModal({ onClose }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState("");
  const [formData, setFormData] = useState({
    // Step 1: Basic ID
    animal_type: "chicken",
    animal_type_other: "",
    name_or_tag: "",
    breed: "",
    gender: "female",
    // Step 2: Lineage & Health
    mother_id: "",
    father_id: "",
    mother_name: "",
    father_name: "",
    birth_date: "",
    birth_weight: "",
    current_weight: "",
    weight_unit: "lbs",
    // Step 3: Financial & Purpose
    purpose: "eggs",
    acquisition_cost: "",
    acquisition_date: "",
    insurance_policy_number: "",
    insurance_company: "",
    insurance_value: "",
    status: "active",
    notes: ""
  });

  // Fetch existing livestock for parent selection
  const { data: existingLivestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      // Clean up numeric fields
      ['birth_weight', 'current_weight', 'acquisition_cost', 'insurance_value'].forEach(field => {
        if (submitData[field]) {
          submitData[field] = parseFloat(submitData[field]);
        } else {
          delete submitData[field];
        }
      });
      // Clean up empty string fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') delete submitData[key];
      });
      return base44.entities.Livestock.create(submitData);
    },
    onSuccess: (newLivestock) => {
      queryClient.invalidateQueries({ queryKey: ['livestock'] });
      // Auto-log to farm history
      logLivestockAdded(newLivestock);
      onClose();
    },
  });

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const validateForm = () => {
    setValidationError("");
    
    // Check unique name/tag
    const existingNames = existingLivestock.map(l => l.name_or_tag.toLowerCase().trim());
    if (existingNames.includes(formData.name_or_tag.toLowerCase().trim())) {
      setValidationError(`An animal with the name/tag "${formData.name_or_tag}" already exists. Please use a unique identifier.`);
      return false;
    }
    
    // Check birth_date not in future
    if (formData.birth_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const birthDate = new Date(formData.birth_date);
      if (birthDate > today) {
        setValidationError("Birth date cannot be in the future.");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createMutation.mutate(formData);
  };

  const isStep1Valid = formData.name_or_tag && formData.animal_type && 
    (formData.animal_type !== 'other' || formData.animal_type_other);

  const potentialParents = existingLivestock.filter(a => 
    a.animal_type === formData.animal_type && a.status === 'active'
  );

  const progressPercent = (currentStep / 3) * 100;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Livestock</DialogTitle>
          <div className="pt-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${currentStep > step.id ? 'bg-blue-600 text-white' : 
                        currentStep === step.id ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : 
                        'bg-gray-100 text-gray-400'}`}>
                      {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    <span className="hidden md:block text-sm font-medium">{step.title}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progressPercent} className="h-1" />
          </div>
        </DialogHeader>

        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <div className="py-4 min-h-[300px]">
          {/* Step 1: Basic ID */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Basic Identification</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Animal Type *</Label>
                  <Select
                    value={formData.animal_type}
                    onValueChange={(value) => setFormData({...formData, animal_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chicken">Chicken</SelectItem>
                      <SelectItem value="goat">Goat</SelectItem>
                      <SelectItem value="sheep">Sheep</SelectItem>
                      <SelectItem value="pig">Pig</SelectItem>
                      <SelectItem value="cow">Cow</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="duck">Duck</SelectItem>
                      <SelectItem value="turkey">Turkey</SelectItem>
                      <SelectItem value="bee_hive">Bee Hive</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.animal_type === 'other' && (
                  <div className="space-y-2">
                    <Label>Specify Animal Type *</Label>
                    <Input
                      value={formData.animal_type_other}
                      onChange={(e) => setFormData({...formData, animal_type_other: e.target.value})}
                      placeholder="e.g., Llama, Alpaca"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Name or Tag *</Label>
                  <Input
                    value={formData.name_or_tag}
                    onChange={(e) => setFormData({...formData, name_or_tag: e.target.value})}
                    placeholder="e.g., Daisy, #42"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Breed</Label>
                  <Input
                    value={formData.breed}
                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                    placeholder="e.g., Rhode Island Red"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Lineage & Health */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Lineage & Health</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mother (Dam)</Label>
                  {potentialParents.filter(p => p.gender === 'female').length > 0 ? (
                    <Select
                      value={formData.mother_id}
                      onValueChange={(value) => setFormData({...formData, mother_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mother" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None / Unknown</SelectItem>
                        {potentialParents.filter(p => p.gender === 'female').map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name_or_tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.mother_name}
                      onChange={(e) => setFormData({...formData, mother_name: e.target.value})}
                      placeholder="Mother's name (if known)"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Father (Sire)</Label>
                  {potentialParents.filter(p => p.gender === 'male').length > 0 ? (
                    <Select
                      value={formData.father_id}
                      onValueChange={(value) => setFormData({...formData, father_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select father" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None / Unknown</SelectItem>
                        {potentialParents.filter(p => p.gender === 'male').map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name_or_tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.father_name}
                      onChange={(e) => setFormData({...formData, father_name: e.target.value})}
                      placeholder="Father's name (if known)"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Birth Date</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Birth Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.birth_weight}
                      onChange={(e) => setFormData({...formData, birth_weight: e.target.value})}
                      placeholder="0.0"
                      className="flex-1"
                    />
                    <Select
                      value={formData.weight_unit}
                      onValueChange={(value) => setFormData({...formData, weight_unit: value})}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Weight</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.current_weight}
                    onChange={(e) => setFormData({...formData, current_weight: e.target.value})}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p>💡 Tip: You can add vaccination records after creating the animal from its detail page.</p>
              </div>
            </div>
          )}

          {/* Step 3: Financial & Purpose */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Financial & Purpose</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Select
                    value={formData.purpose}
                    onValueChange={(value) => setFormData({...formData, purpose: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eggs">Eggs</SelectItem>
                      <SelectItem value="meat">Meat</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="breeding">Breeding</SelectItem>
                      <SelectItem value="fiber">Fiber</SelectItem>
                      <SelectItem value="pets">Pets</SelectItem>
                      <SelectItem value="multiple">Multiple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Acquisition Cost ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.acquisition_cost}
                    onChange={(e) => setFormData({...formData, acquisition_cost: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Acquisition Date</Label>
                  <Input
                    type="date"
                    value={formData.acquisition_date}
                    onChange={(e) => setFormData({...formData, acquisition_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Insurance Company</Label>
                  <Input
                    value={formData.insurance_company}
                    onChange={(e) => setFormData({...formData, insurance_company: e.target.value})}
                    placeholder="e.g., Farm Bureau"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={formData.insurance_policy_number}
                    onChange={(e) => setFormData({...formData, insurance_policy_number: e.target.value})}
                    placeholder="Policy #"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Insured Value ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.insurance_value}
                    onChange={(e) => setFormData({...formData, insurance_value: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between gap-2">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext}
                disabled={currentStep === 1 && !isStep1Valid}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Add Livestock
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}