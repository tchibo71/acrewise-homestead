export const CONTAINER_TYPES = [
  { value: "cell_tray", label: "Cell Tray" },
  { value: "flat", label: "Flat" },
  { value: "pot", label: "Pot" },
  { value: "soil_block", label: "Soil Block" },
  { value: "other", label: "Other" },
];

export const INTENDED_USES = [
  { value: "sell", label: "Sell" },
  { value: "own_use", label: "Own Use" },
  { value: "both", label: "Both" },
];

export const INDOOR_LIGHT_TYPES = [
  { value: "grow_light", label: "Grow Light" },
  { value: "windowsill", label: "Windowsill" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "other", label: "Other" },
];

export const GERMINATION_LOSS_REASONS = [
  { value: "damping_off", label: "Damping Off" },
  { value: "poor_seed_viability", label: "Poor Seed Viability" },
  { value: "temperature_issue", label: "Temperature Issue" },
  { value: "overwatering", label: "Overwatering" },
  { value: "underwatering", label: "Underwatering" },
  { value: "pests", label: "Pests" },
  { value: "unknown", label: "Unknown" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
];

export const HARDENING_LOSS_REASONS = [
  { value: "sunscald", label: "Sunscald" },
  { value: "cold_shock", label: "Cold Shock" },
  { value: "wind_damage", label: "Wind Damage" },
  { value: "transplant_shock", label: "Transplant Shock" },
  { value: "pests", label: "Pests" },
  { value: "animal_damage", label: "Animal Damage" },
  { value: "forgot_to_bring_in", label: "Forgot to Bring In" },
  { value: "unknown", label: "Unknown" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
];

export function getSeedBatchStage(batch) {
  if (batch.transplant_date) return { key: "transplanted", label: "Transplanted" };
  if (batch.marketplace_listing_id) return { key: "sold", label: "Sold" };
  if (batch.hardening_completed_date) return { key: "ready", label: "Ready" };
  if (batch.hardening_start_date) return { key: "hardening", label: "Hardening Off" };
  if (batch.germination_check_date || batch.seeds_germinated != null) return { key: "germinating", label: "Germinating" };
  return { key: "sown", label: "Sown" };
}

export const STAGE_COLORS = {
  sown: "bg-slate-100 text-slate-700 border-slate-300",
  germinating: "bg-blue-100 text-blue-700 border-blue-300",
  hardening: "bg-amber-100 text-amber-700 border-amber-300",
  ready: "bg-emerald-100 text-emerald-700 border-emerald-300",
  transplanted: "bg-green-100 text-green-700 border-green-300",
  sold: "bg-purple-100 text-purple-700 border-purple-300",
};