// Shared bee hive enum constants — single source of truth for dropdowns and display.

export const HIVE_TYPES = [
  { value: "langstroth", label: "Langstroth" },
  { value: "top_bar", label: "Top Bar" },
  { value: "warre", label: "Warré" },
  { value: "other", label: "Other" },
];

export const QUEEN_COLORS = [
  { value: "white", label: "White" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "unmarked", label: "Unmarked" },
];

export const COLONY_STRENGTHS = [
  { value: "weak", label: "Weak" },
  { value: "moderate", label: "Moderate" },
  { value: "strong", label: "Strong" },
];

export const HIVE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "swarmed", label: "Swarmed" },
  { value: "absconded", label: "Absconded" },
  { value: "dead", label: "Dead" },
  { value: "combined", label: "Combined" },
];

export const BROOD_PATTERNS = [
  { value: "good", label: "Good" },
  { value: "spotty", label: "Spotty" },
  { value: "none", label: "None" },
  { value: "not_checked", label: "Not Checked" },
];

export const TEMPERAMENTS = [
  { value: "calm", label: "Calm" },
  { value: "defensive", label: "Defensive" },
  { value: "aggressive", label: "Aggressive" },
];

export const STORES_LEVELS = [
  { value: "low", label: "Low" },
  { value: "adequate", label: "Adequate" },
  { value: "abundant", label: "Abundant" },
];

// Lookup maps
export const HIVE_TYPE_LABELS = Object.fromEntries(HIVE_TYPES.map(({ value, label }) => [value, label]));
export const QUEEN_COLOR_LABELS = Object.fromEntries(QUEEN_COLORS.map(({ value, label }) => [value, label]));
export const COLONY_STRENGTH_LABELS = Object.fromEntries(COLONY_STRENGTHS.map(({ value, label }) => [value, label]));
export const HIVE_STATUS_LABELS = Object.fromEntries(HIVE_STATUSES.map(({ value, label }) => [value, label]));
export const BROOD_PATTERN_LABELS = Object.fromEntries(BROOD_PATTERNS.map(({ value, label }) => [value, label]));
export const TEMPERAMENT_LABELS = Object.fromEntries(TEMPERAMENTS.map(({ value, label }) => [value, label]));
export const STORES_LEVEL_LABELS = Object.fromEntries(STORES_LEVELS.map(({ value, label }) => [value, label]));

// Queen marking color to hex for dot display
export const QUEEN_COLOR_HEX = {
  white: "#ffffff",
  yellow: "#facc15",
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  unmarked: "#9ca3af",
};