// Utility functions for generating hardening-off schedules and weather warnings.

/**
 * Generates a day-by-day hardening-off schedule following a standard progressive approach.
 * @param {string} startDate - ISO date string (YYYY-MM-DD) for day 1 of hardening.
 * @param {number} totalDays - Total number of days to harden off (typically 10).
 * @param {string} cropLabel - Crop name + variety for task titles (e.g. "Cherokee Purple tomatoes").
 * @returns {Array<{day: number, date: string, title: string, description: string}>}
 */
export function generateHardeningSchedule(startDate, totalDays, cropLabel = "") {
  const start = new Date(startDate + "T00:00:00");
  const schedule = [];

  const getPhase = (day) => {
    if (day <= 2) return 1;
    if (day <= 4) return 2;
    if (day <= 6) return 3;
    if (day <= 8) return 4;
    return 5;
  };

  const phaseDescriptions = {
    1: "1-2 hours in a shaded, wind-protected spot outdoors. Bring back inside afterward.",
    2: "2-3 hours outdoors including brief direct morning sun. Bring back inside after sun exposure.",
    3: "4-6 hours outdoors with increasing sun exposure. Still bring seedlings in at night.",
    4: "Most of the day outside. Can leave out overnight if no frost risk in forecast.",
    5: "Full-time outside — seedlings are hardened off and ready to transplant.",
  };

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(start);
    date.setDate(date.getDate() + (day - 1));
    const phase = getPhase(day);
    const suffix = cropLabel ? ` - ${cropLabel}` : "";
    schedule.push({
      day,
      date: date.toISOString().split("T")[0],
      title: `Hardening Day ${day}${suffix}`,
      description: phaseDescriptions[phase],
    });
  }

  return schedule;
}

/**
 * Checks the weather forecast for the hardening window and returns per-date warning notes.
 * @param {Array} schedule - Output of generateHardeningSchedule.
 * @param {Array} forecast - Output of fetchDailyForecast from weatherUtils.
 * @returns {Object<string, string>} Map of date (YYYY-MM-DD) → warning note.
 */
export function checkHardeningWeatherWarnings(schedule, forecast) {
  const warnings = {};
  if (!forecast || !Array.isArray(forecast)) return warnings;

  // Tender seedlings are more sensitive than established plants — use 38°F as frost risk threshold.
  const frostThreshold = 38;

  for (const day of schedule) {
    const forecastDay = forecast.find((f) => f.time === day.date);
    if (!forecastDay) continue;

    const v = forecastDay.values;
    const notes = [];

    // Frost risk
    if (v.temperatureMin != null && v.temperatureMin <= frostThreshold) {
      notes.push(`Frost risk tonight (low ${Math.round(v.temperatureMin)}°F) - bring seedlings in early`);
    }

    // High wind
    if (v.windSpeedAvg != null && v.windSpeedAvg >= 20) {
      notes.push(`High winds forecast (${Math.round(v.windSpeedAvg)} mph) - keep in a wind-protected spot`);
    }

    // Heavy rain
    if (
      (v.precipitationIntensityAvg != null && v.precipitationIntensityAvg >= 0.5) ||
      (v.precipitationProbabilityAvg != null && v.precipitationProbabilityAvg >= 70)
    ) {
      notes.push("Heavy rain expected - keep seedlings sheltered or bring inside");
    }

    if (notes.length > 0) {
      warnings[day.date] = notes.join(". ");
    }
  }

  return warnings;
}