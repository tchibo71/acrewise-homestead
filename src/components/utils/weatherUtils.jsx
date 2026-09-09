// Centralized weather utility functions
// Uses Open-Meteo — free, no API key, no sign-up, CORS-supported.
// Data is fetched directly from the browser; no backend function needed.
// Open-Meteo provides current, hourly (up to 16 days), and daily forecasts
// from 30+ weather models including NOAA HRRR for the US.

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Module-level cache so the three fetch functions share a single API call
let cachedResponse = null;
let cachedLat = null;
let cachedLng = null;
let cachedAt = 0;
const CACHE_TTL = 25 * 60 * 1000; // 25 minutes — matches React Query staleTime

// Map WMO weather codes (Open-Meteo) → Tomorrow.io weather codes (used by the UI)
// This lets us keep all existing icon/description/recommendation mappings unchanged.
const wmoToTomorrowCode = (wmoCode) => {
  const map = {
    0: 1000,   // Clear sky → Clear
    1: 1100,   // Mainly clear → Mostly Clear
    2: 1101,   // Partly cloudy → Partly Cloudy
    3: 1001,   // Overcast → Cloudy
    45: 2000,  // Fog → Fog
    48: 2100,  // Rime fog → Light Fog
    51: 4000,  // Light drizzle → Drizzle
    53: 4000,  // Moderate drizzle → Drizzle
    55: 4000,  // Dense drizzle → Drizzle
    56: 6000,  // Light freezing drizzle → Freezing Drizzle
    57: 6000,  // Dense freezing drizzle → Freezing Drizzle
    61: 4200,  // Slight rain → Light Rain
    63: 4001,  // Moderate rain → Rain
    65: 4201,  // Heavy rain → Heavy Rain
    66: 6200,  // Light freezing rain → Light Freezing Rain
    67: 6201,  // Heavy freezing rain → Heavy Freezing Rain
    71: 5100,  // Slight snow → Light Snow
    73: 5000,  // Moderate snow → Snow
    75: 5101,  // Heavy snow → Heavy Snow
    77: 5001,  // Snow grains → Flurries
    80: 4200,  // Slight rain showers → Light Rain
    81: 4001,  // Moderate rain showers → Rain
    82: 4201,  // Violent rain showers → Heavy Rain
    85: 5100,  // Slight snow showers → Light Snow
    86: 5101,  // Heavy snow showers → Heavy Snow
    95: 8000,  // Thunderstorm → Thunderstorm
    96: 8000,  // Thunderstorm with slight hail → Thunderstorm
    99: 8000,  // Thunderstorm with heavy hail → Thunderstorm
  };
  return map[wmoCode] ?? 1001; // Default to Cloudy
};

// Unit conversions
const hPaToInHg = (hpa) => (hpa ? hpa * 0.02953 : 0);
const metersToMiles = (meters) => (meters ? meters / 1609.34 : 10);

// Fetch all weather data from Open-Meteo in a single call (cached for 25 min)
const fetchOpenMeteo = async (latitude, longitude) => {
  const now = Date.now();
  if (cachedResponse && cachedLat == latitude && cachedLng == longitude && (now - cachedAt) < CACHE_TTL) {
    return cachedResponse;
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
      'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
      'visibility', 'uv_index', 'dew_point_2m',
    ].join(','),
    hourly: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'precipitation_probability', 'precipitation', 'weather_code',
      'wind_speed_10m', 'wind_gusts_10m', 'visibility', 'uv_index', 'dew_point_2m',
    ].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'sunrise', 'sunset', 'precipitation_sum', 'precipitation_probability_max',
      'wind_speed_10m_max', 'uv_index_max',
    ].join(','),
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: '7',
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }

  const data = await response.json();

  cachedResponse = data;
  cachedLat = latitude;
  cachedLng = longitude;
  cachedAt = now;

  return data;
};

// Fetch current weather conditions
export const fetchCurrentWeather = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    throw new Error("Location coordinates are required");
  }

  const data = await fetchOpenMeteo(latitude, longitude);
  const c = data.current;

  // Open-Meteo doesn't provide precipitation_probability in the current block;
  // look up the current hour's value from the hourly array.
  const currentHourIdx = data.hourly?.time?.findIndex(
    (t) => new Date(t).getTime() === new Date(c.time).getTime()
  );
  const precipProb = currentHourIdx >= 0
    ? (data.hourly.precipitation_probability?.[currentHourIdx] || 0)
    : 0;

  return {
    time: c.time,
    values: {
      weatherCode: wmoToTomorrowCode(c.weather_code),
      temperature: c.temperature_2m,
      temperatureApparent: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      dewPoint: c.dew_point_2m,
      windSpeed: c.wind_speed_10m,
      windGust: c.wind_gusts_10m,
      windDirection: c.wind_direction_10m,
      precipitationProbability: precipProb,
      precipitationIntensity: c.precipitation,
      pressureSeaLevel: hPaToInHg(c.pressure_msl),
      visibility: metersToMiles(c.visibility),
      cloudCover: c.cloud_cover,
      uvIndex: c.uv_index,
    },
  };
};

// Fetch daily forecast
export const fetchDailyForecast = async (latitude, longitude, days = 7) => {
  if (!latitude || !longitude) {
    throw new Error("Location coordinates are required");
  }

  const data = await fetchOpenMeteo(latitude, longitude);
  const d = data.daily;

  return d.time.slice(0, days).map((dateStr, i) => ({
    time: dateStr,
    values: {
      weatherCodeMax: wmoToTomorrowCode(d.weather_code[i]),
      temperatureMax: d.temperature_2m_max[i],
      temperatureMin: d.temperature_2m_min[i],
      precipitationProbabilityAvg: d.precipitation_probability_max?.[i] || 0,
      precipitationIntensityAvg: d.precipitation_sum?.[i] || 0,
      windSpeedAvg: d.wind_speed_10m_max?.[i] || 0,
      uvIndexMax: d.uv_index_max?.[i] || 0,
      sunrise: d.sunrise?.[i],
      sunset: d.sunset?.[i],
    },
  }));
};

// Fetch hourly forecast
export const fetchHourlyForecast = async (latitude, longitude, hours = 24) => {
  if (!latitude || !longitude) {
    throw new Error("Location coordinates are required");
  }

  const data = await fetchOpenMeteo(latitude, longitude);
  const h = data.hourly;

  // Start from the current hour
  const now = new Date();
  const startIdx = h.time.findIndex((t) => new Date(t) >= now);
  const beginIdx = startIdx >= 0 ? startIdx : 0;

  return h.time.slice(beginIdx, beginIdx + hours).map((timeStr, j) => {
    const i = beginIdx + j;
    return {
      time: timeStr,
      values: {
        weatherCode: wmoToTomorrowCode(h.weather_code[i]),
        temperature: h.temperature_2m[i],
        temperatureApparent: h.apparent_temperature[i],
        precipitationProbability: h.precipitation_probability?.[i] || 0,
        precipitationIntensity: h.precipitation?.[i] || 0,
        humidity: h.relative_humidity_2m?.[i],
        windSpeed: h.wind_speed_10m?.[i],
        windGust: h.wind_gusts_10m?.[i],
        uvIndex: h.uv_index?.[i],
        visibility: metersToMiles(h.visibility?.[i]),
      },
    };
  });
};

// Get weather icon based on weather code
export const getWeatherIcon = (code) => {
  // Returns the icon name for lucide-react
  if (!code) return "Cloud";
  if (code === 1000) return "Sun";
  if ([1100, 1101, 1102].includes(code)) return "Cloud";
  if ([4000, 4001, 4200, 4201].includes(code)) return "CloudRain";
  if ([5000, 5001, 5100, 5101].includes(code)) return "CloudSnow";
  if ([6000, 6001, 6200, 6201].includes(code)) return "Snowflake";
  if ([8000].includes(code)) return "AlertTriangle";
  return "Cloud";
};

// Get weather description
export const getWeatherDescription = (code) => {
  const descriptions = {
    1000: "Clear",
    1100: "Mostly Clear",
    1101: "Partly Cloudy",
    1102: "Mostly Cloudy",
    1001: "Cloudy",
    2000: "Fog",
    2100: "Light Fog",
    4000: "Drizzle",
    4001: "Rain",
    4200: "Light Rain",
    4201: "Heavy Rain",
    5000: "Snow",
    5001: "Flurries",
    5100: "Light Snow",
    5101: "Heavy Snow",
    6000: "Freezing Drizzle",
    6001: "Freezing Rain",
    6200: "Light Freezing Rain",
    6201: "Heavy Freezing Rain",
    7000: "Ice Pellets",
    7101: "Heavy Ice Pellets",
    7102: "Light Ice Pellets",
    8000: "Thunderstorm"
  };
  return descriptions[code] || "Unknown";
};

// Get precipitation type
export const getPrecipitationType = (code) => {
  if ([4000, 4001, 4200, 4201].includes(code)) {
    return { type: "Rain", color: "text-blue-600", icon: "CloudRain" };
  }
  if ([5000, 5001, 5100, 5101].includes(code)) {
    return { type: "Snow", color: "text-blue-300", icon: "CloudSnow" };
  }
  if ([6000, 6001, 6200, 6201].includes(code)) {
    return { type: "Freezing Rain", color: "text-cyan-400", icon: "Snowflake" };
  }
  if ([7000, 7101, 7102].includes(code)) {
    return { type: "Ice Pellets", color: "text-gray-400", icon: "Cloud" };
  }
  return { type: "None", color: "text-gray-400", icon: "Cloud" };
};

// Generate actionable weather recommendations from forecast data.
// forecast: array returned by fetchDailyForecast (each item: { time, values: { temperatureMin, temperatureMax, precipitationProbabilityAvg, precipitationIntensityAvg, windSpeedAvg, weatherCodeMax } })
// userSettings: the user object (uses frost_alert_threshold, defaults to 32)
// Returns array of { severity: 'info'|'warning'|'critical', message }
export const getWeatherRecommendations = (forecast, userSettings) => {
  if (!forecast || !Array.isArray(forecast) || forecast.length === 0) return [];

  const recommendations = [];
  const frostThreshold = userSettings?.frost_alert_threshold ?? 32;

  // Look at the next 48 hours (first 2 forecast days)
  const next48 = forecast.slice(0, 2);

  // Frost risk: any low at or below threshold in next 48h
  const frostDays = next48.filter(day => day.values?.temperatureMin != null && day.values.temperatureMin <= frostThreshold);
  if (frostDays.length > 0) {
    const worst = frostDays.reduce((min, d) => d.values.temperatureMin < min.values.temperatureMin ? d : min);
    const severity = worst.values.temperatureMin <= frostThreshold - 4 ? 'critical' : 'warning';
    recommendations.push({
      severity,
      message: `Frost expected — low of ${Math.round(worst.values.temperatureMin)}°F (threshold ${frostThreshold}°F). Cover tender plants, check livestock water, and protect sensitive crops.`,
    });
  }

  // Heavy rain: any day in next 48h with significant precipitation
  const heavyRainDays = next48.filter(day =>
    (day.values?.precipitationIntensityAvg != null && day.values.precipitationIntensityAvg >= 0.5) ||
    (day.values?.precipitationProbabilityAvg != null && day.values.precipitationProbabilityAvg >= 70)
  );
  if (heavyRainDays.length > 0) {
    const worst = heavyRainDays.reduce((max, d) =>
      (d.values.precipitationIntensityAvg || 0) > (max.values.precipitationIntensityAvg || 0) ? d : max
    );
    const inches = (worst.values.precipitationIntensityAvg || 0).toFixed(2);
    recommendations.push({
      severity: 'warning',
      message: `Heavy rain expected (${inches}" forecast, ${Math.round(worst.values.precipitationProbabilityAvg || 0)}% chance). Delay irrigation, check pasture drainage, and protect harvested crops.`,
    });
  }

  // High wind: any day in next 48h with strong winds
  const highWindDays = next48.filter(day => day.values?.windSpeedAvg != null && day.values.windSpeedAvg >= 20);
  if (highWindDays.length > 0) {
    const worst = highWindDays.reduce((max, d) => d.values.windSpeedAvg > max.values.windSpeedAvg ? d : max);
    const severity = worst.values.windSpeedAvg >= 30 ? 'critical' : 'warning';
    recommendations.push({
      severity,
      message: `High winds forecast — gusts up to ${Math.round(worst.values.windSpeedAvg)} mph. Delay spraying, secure loose equipment, and check fences.`,
    });
  }

  // Sort by severity: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 };
  return recommendations.sort((a, b) => order[a.severity] - order[b.severity]);
};

// Generate homestead recommendations based on weather
export const getHomesteadRecommendations = (weatherData, user) => {
  if (!weatherData || !weatherData.values) return [];
  
  const recommendations = [];
  const temp = weatherData.values.temperature;
  const precipitation = weatherData.values.precipitationProbability || 0;
  const windSpeed = weatherData.values.windSpeed;
  const weatherCode = weatherData.values.weatherCode;
  
  if (temp <= (user?.frost_alert_threshold || 32)) {
    recommendations.push({
      icon: "Snowflake",
      color: "text-blue-600",
      title: "Frost Alert",
      description: "Protect tender plants, check livestock water for freezing",
      priority: "critical"
    });
  }
  
  if (temp > 85) {
    recommendations.push({
      icon: "Thermometer",
      color: "text-red-600",
      title: "Heat Advisory",
      description: "Ensure livestock have shade and water, water gardens in evening",
      priority: "high"
    });
  }
  
  if (precipitation > 70 || [4000, 4001, 4200, 4201].includes(weatherCode)) {
    recommendations.push({
      icon: "CloudRain",
      color: "text-blue-600",
      title: "Rain Expected",
      description: "Delay irrigation, protect harvested crops, check drainage",
      priority: "medium"
    });
  }
  
  if ([5000, 5001, 5100, 5101].includes(weatherCode)) {
    recommendations.push({
      icon: "CloudSnow",
      color: "text-blue-400",
      title: "Snow Warning",
      description: "Clear pathways, check livestock shelters, protect infrastructure",
      priority: "high"
    });
  }
  
  if (windSpeed > 20) {
    recommendations.push({
      icon: "Wind",
      color: "text-gray-600",
      title: "High Winds",
      description: "Secure equipment, check greenhouse, delay spraying",
      priority: "medium"
    });
  }
  
  if ([8000].includes(weatherCode)) {
    recommendations.push({
      icon: "AlertTriangle",
      color: "text-orange-600",
      title: "Thunderstorm Alert",
      description: "Secure loose items, bring animals to shelter, avoid field work",
      priority: "critical"
    });
  }
  
  if (temp >= 50 && temp <= 75 && precipitation < 30 && windSpeed < 15) {
    recommendations.push({
      icon: "Sun",
      color: "text-green-600",
      title: "Ideal Conditions",
      description: "Great day for planting, outdoor work, and maintenance",
      priority: "low"
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorities = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorities[a.priority] - priorities[b.priority];
  });
};