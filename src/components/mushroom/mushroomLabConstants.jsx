export const ORIGIN_TYPES = [
  { value: "tissue_culture_clone", label: "Tissue Culture Clone" },
  { value: "spore_isolate", label: "Spore Isolate" },
  { value: "purchased_culture", label: "Purchased Culture" },
  { value: "purchased_liquid_culture", label: "Purchased Liquid Culture" },
  { value: "purchased_plug_spawn", label: "Purchased Plug Spawn" },
];

export const TRANSFER_TYPES = [
  { value: "agar_to_agar", label: "Agar to Agar" },
  { value: "agar_to_liquid_culture", label: "Agar to Liquid Culture" },
  { value: "agar_to_grain", label: "Agar to Grain" },
  { value: "liquid_culture_to_grain", label: "Liquid Culture to Grain" },
  { value: "grain_to_grain_expansion", label: "Grain to Grain Expansion" },
];

export const SOURCE_GENERATIONS = [
  { value: "g0_original", label: "G0 (Original)" },
  { value: "g1", label: "G1" },
  { value: "g2", label: "G2" },
];

export const RESULTING_GENERATION_MAP = {
  g0_original: "g1",
  g1: "g2",
  g2: "g3",
};

export const CULTURE_CONTAINER_TYPES = [
  { value: "petri_dish", label: "Petri Dish" },
  { value: "mason_jar", label: "Mason Jar" },
  { value: "grain_bag", label: "Grain Bag" },
  { value: "liquid_culture_jar", label: "Liquid Culture Jar" },
];

export const STERILIZATION_METHODS = [
  { value: "pressure_cooker", label: "Pressure Cooker" },
  { value: "autoclave", label: "Autoclave" },
  { value: "instant_pot", label: "Instant Pot" },
  { value: "none_liquid_culture_technique", label: "None (LC Technique)" },
];

export const CONTAMINATION_ORGANISMS = [
  { value: "none", label: "None" },
  { value: "aspergillus", label: "Aspergillus" },
  { value: "penicillium", label: "Penicillium" },
  { value: "trichoderma", label: "Trichoderma" },
  { value: "bacillus_bacterial", label: "Bacillus (Bacterial)" },
  { value: "yeast", label: "Yeast" },
  { value: "unknown", label: "Unknown" },
];

export const GENERATION_LABELS = {
  g0_original: "G0",
  g1: "G1",
  g2: "G2",
  g3: "G3",
};

export const GENERATION_COLORS = {
  g0_original: "bg-purple-100 text-purple-700 border-purple-300",
  g1: "bg-blue-100 text-blue-700 border-blue-300",
  g2: "bg-cyan-100 text-cyan-700 border-cyan-300",
  g3: "bg-amber-100 text-amber-700 border-amber-300",
};