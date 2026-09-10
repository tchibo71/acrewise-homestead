export const MUSHROOM_SPECIES = [
  { value: "oyster", label: "Oyster" },
  { value: "shiitake", label: "Shiitake" },
  { value: "lions_mane", label: "Lion's Mane" },
  { value: "wine_cap", label: "Wine Cap" },
  { value: "button", label: "Button" },
  { value: "portobello", label: "Portobello" },
  { value: "reishi", label: "Reishi" },
  { value: "maitake", label: "Maitake" },
  { value: "other", label: "Other" },
];

export const SUBSTRATE_TYPES = [
  { value: "sawdust", label: "Sawdust" },
  { value: "straw", label: "Straw" },
  { value: "hardwood_plugs", label: "Hardwood Plugs" },
  { value: "grain", label: "Grain" },
  { value: "compost", label: "Compost" },
  { value: "manure_based", label: "Manure-Based" },
  { value: "log", label: "Log" },
  { value: "other", label: "Other" },
];

export const CONTAINER_TYPES = [
  { value: "mason_jar", label: "Mason Jar" },
  { value: "grain_bag", label: "Grain Bag" },
  { value: "monotub", label: "Monotub" },
  { value: "grow_bag", label: "Grow Bag" },
  { value: "tray", label: "Tray" },
  { value: "log", label: "Log" },
  { value: "other", label: "Other" },
];

export const SPAWN_SOURCING = [
  { value: "purchased", label: "Purchased" },
  { value: "self_produced", label: "Self-Produced" },
];

export const SPAWN_TYPES = [
  { value: "grain_spawn", label: "Grain Spawn" },
  { value: "plug_spawn", label: "Plug Spawn" },
  { value: "liquid_culture", label: "Liquid Culture" },
  { value: "sawdust_spawn", label: "Sawdust Spawn" },
  { value: "sawdust_block", label: "Sawdust Block" },
];

export const BATCH_STATUS = [
  { value: "inoculated", label: "Inoculated" },
  { value: "colonizing", label: "Colonizing" },
  { value: "fruiting", label: "Fruiting" },
  { value: "harvesting", label: "Harvesting" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export const STATUS_COLORS = {
  inoculated: "bg-slate-100 text-slate-700 border-slate-300",
  colonizing: "bg-blue-100 text-blue-700 border-blue-300",
  fruiting: "bg-amber-100 text-amber-700 border-amber-300",
  harvesting: "bg-emerald-100 text-emerald-700 border-emerald-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  failed: "bg-red-100 text-red-700 border-red-300",
};

const SPECIES_ABBR = {
  oyster: "OYS",
  shiitake: "SHI",
  lions_mane: "LMA",
  wine_cap: "WCA",
  button: "BTN",
  portobello: "POR",
  reishi: "REI",
  maitake: "MAI",
  other: "OTH",
};

export function generateLotNumber(species, inoculationDate) {
  const abbr = SPECIES_ABBR[species] || "OTH";
  const dateStr = (inoculationDate || "").replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${abbr}-${dateStr}-${suffix}`;
}

export function getStageLabel(status) {
  return BATCH_STATUS.find(s => s.value === status)?.label || "Inoculated";
}