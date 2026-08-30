import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { saveDraft, isOnline, deleteDraft } from "@/components/utils/offlineStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Save, WifiOff } from "lucide-react";

export default function AddFermentationModal({ batch, draft, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    batch_name: "",
    fermentation_type: "sauerkraut",
    primary_produce: "",
    ingredients: [],
    total_weight: 0,
    total_weight_unit: "lbs",
    salt_weight: 0,
    salt_percentage: 2.5,
    brine_type: "dry_salt",
    start_date: new Date().toISOString().split('T')[0],
    target_completion_date: "",
    actual_completion_date: "",
    fermentation_days: 0,
    container_type: "",
    container_size: "",
    fermentation_temperature: 68,
    status: "active",
    problems_encountered: [],
    solutions_applied: [],
    taste_notes: "",
    texture_notes: "",
    success_rating: null,
    would_repeat: null,
    recipe_notes: "",
    general_notes: ""
  });

  const [newIngredient, setNewIngredient] = useState({ ingredient_name: "", weight: "", weight_unit: "lbs" });
  const [problemInput, setProblemInput] = useState("");
  const [solutionInput, setSolutionInput] = useState("");

  useEffect(() => {
    if (batch) {
      setFormData(batch);
    } else if (draft) {
      setFormData(draft.formData);
    }
  }, [batch, draft]);

  // Calculate total weight from ingredients
  useEffect(() => {
    const total = formData.ingredients.reduce((sum, ing) => {
      // Convert to common unit (lbs) for calculation
      let weight = ing.weight;
      if (ing.weight_unit === "oz") weight = weight / 16;
      if (ing.weight_unit === "g") weight = weight / 453.592;
      if (ing.weight_unit === "kg") weight = weight * 2.20462;
      return sum + weight;
    }, 0);
    setFormData(prev => ({ ...prev, total_weight: parseFloat(total.toFixed(2)) }));
  }, [formData.ingredients]);

  // Calculate salt weight from percentage
  useEffect(() => {
    if (formData.total_weight && formData.salt_percentage) {
      const saltWeight = (formData.total_weight * formData.salt_percentage) / 100;
      setFormData(prev => ({ ...prev, salt_weight: parseFloat(saltWeight.toFixed(2)) }));
    }
  }, [formData.total_weight, formData.salt_percentage]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (batch) {
        return base44.entities.FermentationBatch.update(batch.id, data);
      }
      return base44.entities.FermentationBatch.create(data);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['fermentation-batches'] });
      if (draft) {
        await deleteDraft(draft.id);
        queryClient.invalidateQueries({ queryKey: ['fermentation-drafts', currentUser?.email] });
      }
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if online
    if (!isOnline()) {
      try {
        await saveDraft('fermentation_batch', formData, currentUser?.email);
        alert("📱 Offline: Fermentation batch saved as draft. Will sync when online.");
        onClose();
      } catch (error) {
        alert("Failed to save draft offline");
      }
      return;
    }

    mutation.mutate(formData);
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft('fermentation_batch', formData, currentUser?.email);
      alert("✅ Draft saved! Will sync when online.");
      onClose();
    } catch (error) {
      alert("Failed to save draft");
    }
  };

  const addIngredient = () => {
    if (newIngredient.ingredient_name && newIngredient.weight) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, { ...newIngredient, weight: parseFloat(newIngredient.weight) }]
      });
      setNewIngredient({ ingredient_name: "", weight: "", weight_unit: "lbs" });
    }
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    });
  };

  const addProblem = () => {
    if (problemInput.trim()) {
      setFormData({
        ...formData,
        problems_encountered: [...formData.problems_encountered, problemInput.trim()]
      });
      setProblemInput("");
    }
  };

  const removeProblem = (index) => {
    setFormData({
      ...formData,
      problems_encountered: formData.problems_encountered.filter((_, i) => i !== index)
    });
  };

  const addSolution = () => {
    if (solutionInput.trim()) {
      setFormData({
        ...formData,
        solutions_applied: [...formData.solutions_applied, solutionInput.trim()]
      });
      setSolutionInput("");
    }
  };

  const removeSolution = (index) => {
    setFormData({
      ...formData,
      solutions_applied: formData.solutions_applied.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{batch ? "Edit Fermentation Batch" : "New Fermentation Batch"}</DialogTitle>
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label>Batch Name *</Label>
                <Input
                  value={formData.batch_name}
                  onChange={(e) => setFormData({...formData, batch_name: e.target.value})}
                  required
                  placeholder="e.g., Spring Sauerkraut 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fermentation Type *</Label>
                  <Select value={formData.fermentation_type} onValueChange={(value) => setFormData({...formData, fermentation_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sauerkraut">Sauerkraut</SelectItem>
                      <SelectItem value="kimchi">Kimchi</SelectItem>
                      <SelectItem value="pickles">Pickles</SelectItem>
                      <SelectItem value="hot_sauce">Hot Sauce</SelectItem>
                      <SelectItem value="salsa">Salsa</SelectItem>
                      <SelectItem value="carrots">Carrots</SelectItem>
                      <SelectItem value="beets">Beets</SelectItem>
                      <SelectItem value="mixed_vegetables">Mixed Vegetables</SelectItem>
                      <SelectItem value="sourdough">Sourdough</SelectItem>
                      <SelectItem value="kombucha">Kombucha</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Primary Produce *</Label>
                  <Input
                    value={formData.primary_produce}
                    onChange={(e) => setFormData({...formData, primary_produce: e.target.value})}
                    required
                    placeholder="e.g., Green Cabbage"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="refrigerated">Refrigerated</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-4">
              <div>
                <Label>Add Ingredients</Label>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Ingredient name"
                    value={newIngredient.ingredient_name}
                    onChange={(e) => setNewIngredient({...newIngredient, ingredient_name: e.target.value})}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Weight"
                    value={newIngredient.weight}
                    onChange={(e) => setNewIngredient({...newIngredient, weight: e.target.value})}
                    className="w-24"
                  />
                  <Select value={newIngredient.weight_unit} onValueChange={(value) => setNewIngredient({...newIngredient, weight_unit: value})}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addIngredient}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.ingredients.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label>Ingredients List:</Label>
                    {formData.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="font-medium">{ing.ingredient_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600">{ing.weight} {ing.weight_unit}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredient(idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Calculated Values:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Total Weight:</span>
                    <span className="ml-2 font-semibold">{formData.total_weight} {formData.total_weight_unit}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Salt Needed:</span>
                    <span className="ml-2 font-semibold">{formData.salt_weight} {formData.total_weight_unit}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Salt Percentage * (typically 2-3%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.salt_percentage}
                    onChange={(e) => setFormData({...formData, salt_percentage: parseFloat(e.target.value)})}
                    required
                  />
                </div>

                <div>
                  <Label>Brine Type</Label>
                  <Select value={formData.brine_type} onValueChange={(value) => setFormData({...formData, brine_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry_salt">Dry Salt</SelectItem>
                      <SelectItem value="brine_solution">Brine Solution</SelectItem>
                      <SelectItem value="no_salt">No Salt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="process" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Container Type</Label>
                  <Input
                    value={formData.container_type}
                    onChange={(e) => setFormData({...formData, container_type: e.target.value})}
                    placeholder="e.g., Mason jar, Crock"
                  />
                </div>

                <div>
                  <Label>Container Size</Label>
                  <Input
                    value={formData.container_size}
                    onChange={(e) => setFormData({...formData, container_size: e.target.value})}
                    placeholder="e.g., 1 gallon, 2 quarts"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fermentation Temperature (°F)</Label>
                  <Input
                    type="number"
                    value={formData.fermentation_temperature}
                    onChange={(e) => setFormData({...formData, fermentation_temperature: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <Label>Fermentation Days</Label>
                  <Input
                    type="number"
                    value={formData.fermentation_days}
                    onChange={(e) => setFormData({...formData, fermentation_days: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label>Recipe Notes</Label>
                <Textarea
                  value={formData.recipe_notes}
                  onChange={(e) => setFormData({...formData, recipe_notes: e.target.value})}
                  rows={3}
                  placeholder="Spices, techniques, special instructions..."
                />
              </div>

              <div>
                <Label>Problems Encountered</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={problemInput}
                    onChange={(e) => setProblemInput(e.target.value)}
                    placeholder="Describe any issues..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProblem())}
                  />
                  <Button type="button" onClick={addProblem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.problems_encountered.length > 0 && (
                  <div className="space-y-1">
                    {formData.problems_encountered.map((prob, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-red-50 p-2 rounded">
                        <span className="text-sm">{prob}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProblem(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Solutions Applied</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={solutionInput}
                    onChange={(e) => setSolutionInput(e.target.value)}
                    placeholder="How you resolved issues..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSolution())}
                  />
                  <Button type="button" onClick={addSolution}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.solutions_applied.length > 0 && (
                  <div className="space-y-1">
                    {formData.solutions_applied.map((sol, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-green-50 p-2 rounded">
                        <span className="text-sm">{sol}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSolution(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>General Notes</Label>
                <Textarea
                  value={formData.general_notes}
                  onChange={(e) => setFormData({...formData, general_notes: e.target.value})}
                  rows={3}
                  placeholder="Any other observations..."
                />
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Completion Date</Label>
                  <Input
                    type="date"
                    value={formData.target_completion_date}
                    onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Actual Completion Date</Label>
                  <Input
                    type="date"
                    value={formData.actual_completion_date}
                    onChange={(e) => setFormData({...formData, actual_completion_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Taste Notes</Label>
                <Textarea
                  value={formData.taste_notes}
                  onChange={(e) => setFormData({...formData, taste_notes: e.target.value})}
                  rows={2}
                  placeholder="Flavor profile, acidity, etc..."
                />
              </div>

              <div>
                <Label>Texture Notes</Label>
                <Textarea
                  value={formData.texture_notes}
                  onChange={(e) => setFormData({...formData, texture_notes: e.target.value})}
                  rows={2}
                  placeholder="Crunch, consistency, etc..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Success Rating (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.success_rating || ""}
                    onChange={(e) => setFormData({...formData, success_rating: e.target.value ? parseInt(e.target.value) : null})}
                  />
                </div>

                <div>
                  <Label>Would you repeat this recipe?</Label>
                  <Select 
                    value={formData.would_repeat === null ? "" : formData.would_repeat.toString()} 
                    onValueChange={(value) => setFormData({...formData, would_repeat: value === "" ? null : value === "true"})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-3 mt-6">
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                {mutation.isPending ? "Saving..." : batch ? "Update Batch" : "Create Batch"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}