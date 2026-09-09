import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, ListChecks, Loader2, Settings2, Sparkles } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "composting", label: "Composting" },
  { value: "gardening", label: "Gardening" },
  { value: "raised_beds", label: "Raised Beds" },
  { value: "biointensive", label: "Biointensive" },
  { value: "harvesting", label: "Harvesting" },
  { value: "livestock", label: "Livestock" },
  { value: "water_management", label: "Water Management" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "property_engineering", label: "Property Engineering" },
  { value: "daily_tasks", label: "Daily Tasks" },
  { value: "seasonal_tasks", label: "Seasonal Tasks" },
];

const FREQUENCY_OPTIONS = [
  { value: "one_time", label: "One Time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "seasonal", label: "Seasonal" },
  { value: "custom", label: "Custom" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const CATEGORY_KEYWORDS = {
  livestock: ["livestock", "animal", "goat", "chicken", "cow", "sheep", "pig", "rabbit", "duck", "turkey", "poultry", "predator", "fencing"],
  gardening: ["crop", "plant", "garden", "seed", "transplant", "variety", "harvest"],
  composting: ["compost", "soil", "organic matter", "mulch", "amendment"],
  water_management: ["water", "irrigation", "drainage", "pond", "well", "swale"],
  greenhouse: ["greenhouse", "hoop house", "cold frame"],
  property_engineering: ["infrastructure", "building", "barn", "fence", "road", "bridge", "structure"],
  seasonal_tasks: ["season", "spring", "summer", "fall", "winter", "preparation"],
  harvesting: ["harvest", "yield", "pick", "process", "store"],
};

function guessCategory(sourceCategory, textSample) {
  if (sourceCategory) {
    const match = CATEGORY_OPTIONS.find(
      (c) => c.value === sourceCategory || c.label.toLowerCase() === sourceCategory.toLowerCase()
    );
    if (match) return match.value;
  }
  const lower = (textSample || "").toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "daily_tasks";
}

function parseRecommendations(text) {
  if (!text || !text.trim()) return [];

  const lines = text.split("\n");
  const numberedPattern = /^\s*\d+[\.\)]\s+(.+)/;
  const bulletPattern = /^\s*[-*•]\s+(.+)/;

  const hasNumbered = lines.some((l) => numberedPattern.test(l));
  const hasBulleted = lines.some((l) => bulletPattern.test(l));

  if (hasNumbered || hasBulleted) {
    const items = [];
    for (const line of lines) {
      let match = line.match(numberedPattern);
      if (match) {
        items.push(match[1].trim());
        continue;
      }
      match = line.match(bulletPattern);
      if (match) {
        items.push(match[1].trim());
        continue;
      }
    }
    return items.filter((item) => item.length > 3);
  }

  // No list format — split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\s*\n/);
  const items = [];
  for (const para of paragraphs) {
    const cleaned = para.trim().replace(/^#{1,4}\s+/, "").replace(/\*\*/g, "");
    if (cleaned.length > 5) items.push(cleaned);
  }

  if (items.length <= 1) {
    // Last resort: split by single newlines
    return lines
      .map((l) => l.trim().replace(/^#{1,4}\s+/, "").replace(/\*\*/g, ""))
      .filter((l) => l.length > 5);
  }

  return items;
}

export default function AddRecommendationsToChecklist({
  isOpen,
  onClose,
  recommendationsText,
  sourceCategory,
  sourceTitle,
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(new Set());
  const [useSmartDefaults, setUseSmartDefaults] = useState(true);
  const [customCategory, setCustomCategory] = useState("daily_tasks");
  const [customFrequency, setCustomFrequency] = useState("one_time");
  const [customPriority, setCustomPriority] = useState("medium");

  const parsedItems = useMemo(
    () => parseRecommendations(recommendationsText),
    [recommendationsText]
  );

  // Initialize all as selected when items change
  useMemo(() => {
    setSelected(new Set(parsedItems.map((_, i) => i)));
  }, [parsedItems]);

  const smartCategory = useMemo(
    () => guessCategory(sourceCategory, recommendationsText),
    [sourceCategory, recommendationsText]
  );

  const toggleItem = (index) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === parsedItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(parsedItems.map((_, i) => i)));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (items) => {
      return await base44.entities.ChecklistItem.bulkCreate(items);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
  });

  const handleAdd = () => {
    const itemsToCreate = parsedItems
      .filter((_, i) => selected.has(i))
      .map((text) => {
        const category = useSmartDefaults ? smartCategory : customCategory;
        return {
          title: text.length > 200 ? text.substring(0, 200) + "..." : text,
          category,
          frequency: useSmartDefaults ? "one_time" : customFrequency,
          priority: useSmartDefaults ? "medium" : customPriority,
          notes: `From AI recommendations${sourceTitle ? `: ${sourceTitle}` : ""}`,
        };
      });

    if (itemsToCreate.length === 0) return;
    createMutation.mutate(itemsToCreate, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-green-600" />
            Add AI Recommendations to Checklist
          </DialogTitle>
        </DialogHeader>

        {parsedItems.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No actionable items detected in the recommendations. Try generating
            recommendations first.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Defaults toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {useSmartDefaults ? (
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Settings2 className="w-4 h-4 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {useSmartDefaults ? "Smart Defaults" : "Custom Settings"}
                  </span>
                </div>
                <button
                  onClick={() => setUseSmartDefaults(!useSmartDefaults)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Switch to {useSmartDefaults ? "Custom" : "Smart Defaults"}
                </button>
              </div>

              {useSmartDefaults ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-white">
                    Category:{" "}
                    {CATEGORY_OPTIONS.find((c) => c.value === smartCategory)?.label ||
                      "Daily Tasks"}
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Frequency: One Time
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    Priority: Medium
                  </Badge>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <select
                      className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Frequency</Label>
                    <select
                      className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
                      value={customFrequency}
                      onChange={(e) => setCustomFrequency(e.target.value)}
                    >
                      {FREQUENCY_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <select
                      className="w-full text-sm border rounded-md px-2 py-1.5 mt-1"
                      value={customPriority}
                      onChange={(e) => setCustomPriority(e.target.value)}
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Select all / deselect all */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selected.size} of {parsedItems.length} selected
              </span>
              <button
                onClick={toggleAll}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {selected.size === parsedItems.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {/* Item list */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {parsedItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    selected.has(index)
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                  onClick={() => toggleItem(index)}
                >
                  <Checkbox
                    checked={selected.has(index)}
                    onCheckedChange={() => toggleItem(index)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700 flex-1">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selected.size === 0 || createMutation.isPending}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 mr-2" />
                Add {selected.size} Item{selected.size !== 1 ? "s" : ""} to Checklist
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}