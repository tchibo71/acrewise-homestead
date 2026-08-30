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
    preservative_type: "salt",
    salt_weight: 0,
    salt_percentage: 2.5,
    brine_type: "dry_salt",
    sugar_weight: 0,
    sugar_percentage: 0,
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
    general_notes: "",
    containers: [],
    is_smoked: false,
    smoking_method: "none",
    smoking_temperature: null,
    smoking_duration_hours: null,
    wood_type: "",
    meat_type: "",
    culture_type: "",
    cure_type: "",
    cure_weight: 0,
    aging_humidity: null
  });

  const [newIngredient, setNewIngredient] = useState({ ingredient_name: "", weight: "", weight_unit: "lbs" });
  const [newContainer, setNewContainer] = useState({ container_type: "", container_size: "", quantity: 1 });
  const [problemInput, setProblemInput] = useState("");
  const [solutionInput, setSolutionInput] = useState("");

  useEffect(() => {
    if (batch) {
      setFormData({ ...batch, containers: batch.containers || [] });
    } else if (draft) {
      setFormData({ ...draft.formData, containers: draft.formData.containers || [] });
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

  // Calculate sugar weight from percentage
  useEffect(() => {
    if (formData.total_weight && formData.sugar_percentage) {
      const sugarWeight = (formData.total_weight * formData.sugar_percentage) / 100;
      setFormData(prev => ({ ...prev, sugar_weight: parseFloat(sugarWeight.toFixed(2)) }));
    }
  }, [formData.total_weight, formData.sugar_percentage]);

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

  const isMeatFerment = (type) => ["fermented_sausage", "salami", "cured_meat"].includes(type);
  const isCheeseFerment = (type) => ["cheese_fresh", "cheese_semi_hard", "cheese_hard", "cheese_blue", "cheese_mold_ripened"].includes(type);
  const needsAgingHumidity = (type) => isMeatFerment(type) || ["cheese_semi_hard", "cheese_hard", "cheese_blue", "cheese_mold_ripened"].includes(type);

  const addContainer = () => {
    if (newContainer.container_type && newContainer.container_size) {
      setFormData({
        ...formData,
        containers: [...formData.containers, { ...newContainer, quantity: parseInt(newContainer.quantity) || 1 }]
      });
      setNewContainer({ container_type: "", container_size: "", quantity: 1 });
    }
  };

  const removeContainer = (index) => {
    setFormData({
      ...formData,
      containers: formData.containers.filter((_, i) => i !== index)
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
                      <SelectItem value="grape_juice">Grape Juice</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                      <SelectItem value="cider">Cider</SelectItem>
                      <SelectItem value="mead">Mead</SelectItem>
                      <SelectItem value="vinegar">Vinegar</SelectItem>
                      <SelectItem value="beer">Beer</SelectItem>
                      <SelectItem value="fermented_sausage">Fermented Sausage</SelectItem>
                      <SelectItem value="salami">Salami</SelectItem>
                      <SelectItem value="cured_meat">Cured Meat</SelectItem>
                      <SelectItem value="cheese_fresh">Cheese — Fresh/Soft</SelectItem>
                      <SelectItem value="cheese_semi_hard">Cheese — Semi-Hard</SelectItem>
                      <SelectItem value="cheese_hard">Cheese — Hard</SelectItem>
                      <SelectItem value="cheese_blue">Cheese — Blue</SelectItem>
                      <SelectItem value="cheese_mold_ripened">Cheese — Mold Ripened</SelectItem>
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

              {isMeatFerment(formData.fermentation_type) && (
                <div>
                  <Label>Meat Type</Label>
                  <Input
                    value={formData.meat_type}
                    onChange={(e) => setFormData({...formData, meat_type: e.target.value})}
                    placeholder="e.g., Pork, Beef, Venison"
                  />
                </div>
              )}

              {isCheeseFerment(formData.fermentation_type) && (
                <div>
                  <Label>Culture Type</Label>
                  <Input
                    value={formData.culture_type}
                    onChange={(e) => setFormData({...formData, culture_type: e.target.value})}
                    placeholder="e.g., Mesophilic, Thermophilic, MA 4002, Fromage Blanc"
                  />
                </div>
              )}
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
                  {formData.preservative_type === "salt" && (
                    <div>
                      <span className="text-blue-700">Salt Needed:</span>
                      <span className="ml-2 font-semibold">{formData.salt_weight} {formData.total_weight_unit}</span>
                    </div>
                  )}
                  {formData.preservative_type === "sugar" && (
                    <div>
                      <span className="text-blue-700">Sugar Needed:</span>
                      <span className="ml-2 font-semibold">{formData.sugar_weight} {formData.total_weight_unit}</span>
                    </div>
                  )}
                  {formData.preservative_type === "cure" && (
                    <div>
                      <span className="text-blue-700">Cure Needed:</span>
                      <span className="ml-2 font-semibold">{formData.cure_weight}g</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Preservative Type</Label>
                <Select value={formData.preservative_type} onValueChange={(value) => setFormData({...formData, preservative_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salt">Salt (vegetable ferments)</SelectItem>
                    <SelectItem value="sugar">Sugar (fruit/beverage ferments)</SelectItem>
                    <SelectItem value="cure">Cure (meat curing — nitrite/nitrate)</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Salt for sauerkraut/pickles, sugar for fruit/wine/cider, cure #1/#2 for meat safety
                </p>
              </div>

              {formData.preservative_type === "salt" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Salt Percentage (typically 2-3%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.salt_percentage}
                      onChange={(e) => setFormData({...formData, salt_percentage: parseFloat(e.target.value)})}
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
              )}

              {formData.preservative_type === "cure" && (
                <div className="bg-red-50 p-4 rounded-lg space-y-4">
                  <p className="text-xs text-red-700 font-medium">
                    ⚠️ Curing salts (nitrite/nitrate) are essential for preventing botulism in fermented meats. Always weigh precisely — never exceed recommended amounts.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cure Type</Label>
                      <Select value={formData.cure_type} onValueChange={(value) => setFormData({...formData, cure_type: value})}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cure_1">Cure #1 (Sodium Nitrite — short-term)</SelectItem>
                          <SelectItem value="cure_2">Cure #2 (Sodium Nitrate — dry-cured/aged)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cure Weight (grams)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.cure_weight || ""}
                        onChange={(e) => setFormData({...formData, cure_weight: parseFloat(e.target.value) || 0})}
                        placeholder="e.g., 2.5"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Typical: ~0.25% of meat weight for Cure #1. Use Cure #2 for products aged over 30 days.
                  </p>
                </div>
              )}

              {formData.preservative_type === "sugar" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sugar Percentage (varies by recipe)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.sugar_percentage}
                      onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const weight = formData.total_weight > 0 ? (formData.total_weight * pct) / 100 : 0;
                      setFormData({...formData, sugar_percentage: pct, sugar_weight: parseFloat(weight.toFixed(2))});
                    }}
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div>
                    <Label>Sugar Weight ({formData.total_weight_unit})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sugar_weight}
                      onChange={(e) => {
                        const weight = parseFloat(e.target.value) || 0;
                        const pct = formData.total_weight > 0 ? (weight / formData.total_weight) * 100 : 0;
                        setFormData({...formData, sugar_weight: weight, sugar_percentage: parseFloat(pct.toFixed(2))});
                      }}
                      placeholder="auto-calculated"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="process" className="space-y-4">
              <div>
                <Label>Containers (track how many of each size)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Type (e.g., Mason jar)"
                    value={newContainer.container_type}
                    onChange={(e) => setNewContainer({...newContainer, container_type: e.target.value})}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Size (e.g., Half gallon)"
                    value={newContainer.container_size}
                    onChange={(e) => setNewContainer({...newContainer, container_size: e.target.value})}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newContainer.quantity}
                    onChange={(e) => setNewContainer({...newContainer, quantity: e.target.value})}
                    className="w-20"
                  />
                  <Button type="button" onClick={addContainer}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.containers.length > 0 && (
                  <div className="space-y-2">
                    {formData.containers.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="font-medium text-sm">{c.container_type} — {c.container_size}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 text-sm">×{c.quantity}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeContainer(idx)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <p className="text-sm font-semibold text-gray-700">
                      Total: {formData.containers.reduce((sum, c) => sum + c.quantity, 0)} container(s)
                    </p>
                  </div>
                )}
              </div>

              {isMeatFerment(formData.fermentation_type) && (
                <div className="bg-orange-50 p-4 rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_smoked"
                      checked={formData.is_smoked}
                      onChange={(e) => setFormData({...formData, is_smoked: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_smoked" className="cursor-pointer">Smoked Product</Label>
                  </div>
                  {formData.is_smoked && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Smoking Method</Label>
                        <Select value={formData.smoking_method} onValueChange={(value) => setFormData({...formData, smoking_method: value})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cold_smoke">Cold Smoke</SelectItem>
                            <SelectItem value="hot_smoke">Hot Smoke</SelectItem>
                            <SelectItem value="liquid_smoke">Liquid Smoke</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Wood Type</Label>
                        <Input
                          value={formData.wood_type}
                          onChange={(e) => setFormData({...formData, wood_type: e.target.value})}
                          placeholder="e.g., Hickory, Apple, Cherry"
                        />
                      </div>
                      <div>
                        <Label>Smoking Temp (°F)</Label>
                        <Input
                          type="number"
                          value={formData.smoking_temperature || ""}
                          onChange={(e) => setFormData({...formData, smoking_temperature: parseFloat(e.target.value) || null})}
                          placeholder="e.g., 200"
                        />
                      </div>
                      <div>
                        <Label>Smoking Duration (hours)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={formData.smoking_duration_hours || ""}
                          onChange={(e) => setFormData({...formData, smoking_duration_hours: parseFloat(e.target.value) || null})}
                          placeholder="e.g., 8"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

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

              {needsAgingHumidity(formData.fermentation_type) && (
                <div>
                  <Label>Aging Humidity (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.aging_humidity || ""}
                    onChange={(e) => setFormData({...formData, aging_humidity: parseFloat(e.target.value) || null})}
                    placeholder="e.g., 80 (typical 75-85% for dry-cured meats and aged cheese)"
                  />
                </div>
              )}

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