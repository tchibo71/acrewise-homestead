export const ROOM_TYPES = [
  { value: "lab_clean_room", label: "Lab / Clean Room" },
  { value: "incubation_room", label: "Incubation Room" },
  { value: "fruiting_chamber", label: "Fruiting Chamber" },
  { value: "cold_storage", label: "Cold Storage" },
  { value: "other", label: "Other" },
];

export const SANITATION_TYPES = [
  { value: "surface_wipe_down", label: "Surface Wipe Down" },
  { value: "hepa_filter_change", label: "HEPA Filter Change" },
  { value: "full_room_treatment", label: "Full Room Treatment" },
  { value: "air_scrubber_run", label: "Air Scrubber Run" },
  { value: "tool_sterilization", label: "Tool Sterilization" },
  { value: "handwashing_station_check", label: "Handwashing Station Check" },
  { value: "other", label: "Other" },
];

export function getRoomTypeLabel(value) {
  return ROOM_TYPES.find(r => r.value === value)?.label || value;
}

export function getSanitationTypeLabel(value) {
  return SANITATION_TYPES.find(s => s.value === value)?.label || value;
}

export function isSanitationOverdue(room) {
  if (!room.last_sanitized_date || !room.sanitation_frequency_days) return false;
  const last = new Date(room.last_sanitized_date);
  const due = new Date(last.getTime() + room.sanitation_frequency_days * 86400000);
  return due < new Date();
}

export function daysSinceSanitation(room) {
  if (!room.last_sanitized_date) return null;
  const last = new Date(room.last_sanitized_date);
  return Math.floor((new Date() - last) / 86400000);
}