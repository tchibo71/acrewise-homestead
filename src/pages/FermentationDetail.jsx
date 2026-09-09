import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Beaker,
  Droplets,
  ThermometerSun,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Weight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import AddFermentationModal from "../components/fermentation/AddFermentationModal";

const statusColors = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  refrigerated: "bg-purple-100 text-purple-700 border-purple-200"
};

const typeEmojis = {
  sauerkraut: "🥬",
  kimchi: "🌶️",
  pickles: "🥒",
  hot_sauce: "🔥",
  salsa: "🍅",
  carrots: "🥕",
  beets: "🫒",
  mixed_vegetables: "🥗",
  sourdough: "🍞",
  kombucha: "🫖",
  grape_juice: "🍇",
  wine: "🍷",
  cider: "🍎",
  mead: "🍯",
  vinegar: "🧪",
  beer: "🍺",
  fermented_sausage: "🌭",
  salami: "🥓",
  cured_meat: "🥩",
  cheese_fresh: "🧀",
  cheese_semi_hard: "🧀",
  cheese_hard: "🧀",
  cheese_blue: "🫕",
  cheese_mold_ripened: "🧀",
  other: "🥫"
};

export default function FermentationDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get('id');

  const [showEditModal, setShowEditModal] = useState(false);

  const { data: batch, isLoading } = useQuery({
    queryKey: ['fermentation-batch', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const batches = await base44.entities.FermentationBatch.list();
      return batches.find(b => b.id === batchId) ?? null;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.FermentationBatch.delete(batchId),
    onSuccess: () => {
      navigate(createPageUrl("FermentationTracking"));
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this fermentation batch? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Beaker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Batch not found</h2>
          <Button onClick={() => navigate(createPageUrl("FermentationTracking"))}>
            Back to Fermentation Tracking
          </Button>
        </div>
      </div>
    );
  }

  const daysActive = batch.status === "active" && batch.start_date
    ? differenceInDays(new Date(), new Date(batch.start_date))
    : batch.fermentation_days || 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl("FermentationTracking"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fermentation Tracking
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Batch Overview */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{typeEmojis[batch.fermentation_type]}</div>
                <div>
                  <CardTitle className="text-3xl">{batch.batch_name}</CardTitle>
                  <p className="text-lg text-gray-600 capitalize mt-1">
                    {batch.fermentation_type.replace(/_/g, ' ')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={statusColors[batch.status]}>
                      {batch.status}
                    </Badge>
                    {batch.would_repeat === true && (
                      <Badge className="bg-green-100 text-green-700">Would Repeat</Badge>
                    )}
                    {batch.would_repeat === false && (
                      <Badge className="bg-red-100 text-red-700">Won't Repeat</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {batch.preservative_type === "sugar" ? "Sugar Percentage" : batch.preservative_type === "cure" ? "Curing Salt" : "Salt Percentage"}
                </p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  {batch.preservative_type === "sugar"
                    ? `${batch.sugar_percentage ?? 0}%`
                    : batch.preservative_type === "cure"
                      ? `${batch.cure_type === "cure_2" ? "Cure #2" : "Cure #1"}`
                      : `${batch.salt_percentage ?? 0}%`}
                </p>
                {batch.preservative_type === "cure" && batch.cure_weight ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {batch.cure_weight}g cure
                  </p>
                ) : batch.preservative_type === "sugar" && batch.sugar_weight ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {batch.sugar_weight} {batch.total_weight_unit} sugar
                  </p>
                ) : batch.salt_weight ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {batch.salt_weight} {batch.total_weight_unit} salt
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Days Fermenting</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  {daysActive} days
                </p>
                {batch.start_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Started: {format(new Date(batch.start_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>

              {batch.fermentation_temperature && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Temperature</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <ThermometerSun className="w-4 h-4 text-red-400" />
                    {batch.fermentation_temperature}°F
                  </p>
                  {batch.aging_humidity && (
                    <p className="text-xs text-gray-500 mt-1">
                      {batch.aging_humidity}% RH humidity
                    </p>
                  )}
                </div>
              )}

              {batch.success_rating && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Success Rating</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {batch.success_rating}/5
                  </p>
                </div>
              )}
            </div>

            {batch.primary_produce && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <p className="text-sm font-semibold text-amber-900 mb-1">Primary Produce:</p>
                <p className="text-amber-800">{batch.primary_produce}</p>
              </div>
            )}

            {batch.meat_type && (
              <div className="mt-2 p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-semibold text-red-900 mb-1">Meat Type:</p>
                <p className="text-red-800">{batch.meat_type}</p>
              </div>
            )}

            {batch.culture_type && (
              <div className="mt-2 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Starter Culture:</p>
                <p className="text-yellow-800">{batch.culture_type}</p>
              </div>
            )}

            {batch.is_smoked && (
              <div className="mt-2 flex gap-2">
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">🔥 Smoked</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ingredients */}
        {batch.ingredients && batch.ingredients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="w-5 h-5" />
                Ingredients Recipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {batch.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{ing.ingredient_name}</span>
                    <span className="text-gray-600">{ing.weight} {ing.weight_unit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Weight:</span>
                  <span className="font-bold text-gray-900">{batch.total_weight} {batch.total_weight_unit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Process Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {batch.recipe_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Recipe Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{batch.recipe_notes}</p>
              </CardContent>
            </Card>
          )}

          {((batch.containers && batch.containers.length > 0) || batch.container_type || batch.container_size || batch.brine_type) && (
            <Card>
              <CardHeader>
                <CardTitle>Containers & Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {batch.containers && batch.containers.length > 0 ? (
                  <div className="space-y-2">
                    {batch.containers.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{c.container_type} — {c.container_size}</span>
                        <Badge className="bg-amber-100 text-amber-700">×{c.quantity}</Badge>
                      </div>
                    ))}
                    <p className="text-sm font-semibold text-gray-700 pt-2 border-t border-gray-200">
                      Total: {batch.containers.reduce((sum, c) => sum + c.quantity, 0)} container(s)
                    </p>
                  </div>
                ) : (
                  <>
                    {batch.container_type && (
                      <div>
                        <p className="text-sm text-gray-600">Container Type:</p>
                        <p className="font-medium">{batch.container_type}</p>
                      </div>
                    )}
                    {batch.container_size && (
                      <div>
                        <p className="text-sm text-gray-600">Container Size:</p>
                        <p className="font-medium">{batch.container_size}</p>
                      </div>
                    )}
                  </>
                )}
                {batch.brine_type && (
                  <div>
                    <p className="text-sm text-gray-600">Brine Method:</p>
                    <p className="font-medium capitalize">{batch.brine_type.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {batch.is_smoked && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  🔥 Smoking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {batch.smoking_method && (
                  <div>
                    <p className="text-sm text-gray-600">Smoking Method:</p>
                    <p className="font-medium capitalize">{batch.smoking_method.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {batch.wood_type && (
                  <div>
                    <p className="text-sm text-gray-600">Wood Type:</p>
                    <p className="font-medium">{batch.wood_type}</p>
                  </div>
                )}
                {batch.smoking_temperature && (
                  <div>
                    <p className="text-sm text-gray-600">Smoking Temperature:</p>
                    <p className="font-medium">{batch.smoking_temperature}°F</p>
                  </div>
                )}
                {batch.smoking_duration_hours && (
                  <div>
                    <p className="text-sm text-gray-600">Smoking Duration:</p>
                    <p className="font-medium">{batch.smoking_duration_hours} hours</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Problems & Solutions */}
        {(batch.problems_encountered?.length > 0 || batch.solutions_applied?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            {batch.problems_encountered?.length > 0 && (
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <AlertCircle className="w-5 h-5" />
                    Problems Encountered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {batch.problems_encountered.map((prob, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-orange-800">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {batch.solutions_applied?.length > 0 && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <CheckCircle2 className="w-5 h-5" />
                    Solutions Applied
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {batch.solutions_applied.map((sol, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-800">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{sol}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tasting Notes */}
        {(batch.taste_notes || batch.texture_notes || batch.general_notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Tasting & Final Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {batch.taste_notes && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Taste Profile:</p>
                  <p className="text-gray-600">{batch.taste_notes}</p>
                </div>
              )}
              {batch.texture_notes && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Texture:</p>
                  <p className="text-gray-600">{batch.texture_notes}</p>
                </div>
              )}
              {batch.general_notes && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">General Notes:</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{batch.general_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {showEditModal && (
          <AddFermentationModal
            batch={batch}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </div>
    </div>
  );
}