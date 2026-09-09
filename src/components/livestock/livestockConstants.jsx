// Shared livestock enum constants — single source of truth for animal types and purposes.
// Update this file (and Livestock.jsonc) when adding new values; all dropdowns import from here.

export const ANIMAL_TYPES = [
  { value: "chicken", label: "Chicken" },
  { value: "goat", label: "Goat" },
  { value: "sheep", label: "Sheep" },
  { value: "pig", label: "Pig" },
  { value: "cow", label: "Cow" },
  { value: "rabbit", label: "Rabbit" },
  { value: "duck", label: "Duck" },
  { value: "turkey", label: "Turkey" },
  { value: "horse", label: "Horse" },
  { value: "donkey", label: "Donkey" },
  { value: "llama_alpaca", label: "Llama / Alpaca" },
  { value: "bee_hive", label: "Bee Hive" },
  { value: "other", label: "Other" },
];

export const PURPOSES = [
  { value: "meat", label: "Meat" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "breeding", label: "Breeding" },
  { value: "fiber", label: "Fiber" },
  { value: "pets", label: "Pets" },
  { value: "draft_work", label: "Draft / Work" },
  { value: "multiple", label: "Multiple" },
];

// Quick lookup maps
export const ANIMAL_TYPE_LABELS = Object.fromEntries(
  ANIMAL_TYPES.map(({ value, label }) => [value, label])
);

export const PURPOSE_LABELS = Object.fromEntries(
  PURPOSES.map(({ value, label }) => [value, label])
);