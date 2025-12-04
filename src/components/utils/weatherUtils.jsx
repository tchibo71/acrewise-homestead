// Centralized weather utility functions
export const WEATHER_API_KEY = "oDYfOfwz6YdZEMXyVEKqQAeirSHdsV8i";

// Fetch current weather conditions
export const fetchCurrentWeather = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    throw new Error("Location coordinates are required");
  }

  const response = await fetch(
    `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${WEATHER_API_KEY}&units=imperial`,
    { method: 'GET' }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch current weather');
  }
  
  const data = await response.json();
  return data.data;
};

// Fetch daily forecast
export const fetchDailyForecast = async (latitude, longitude, days = 7) => {
  if (!latitude || !longitude) {
    throw new Error("Location coordinates are required");
  }

  const response = await fetch(
    `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&timesteps=1d&units=imperial&apikey=${WEATHER_API_KEY}`,
    { method: 'GET' }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch forecast');
  }
  
  const data = await response.json();
  return data.timelines?.daily || [];
};

// Fetch hourly forecast
export const fetchHourlyForecast = async (latitude, longitude, hours = 24) => {
  if (!latitude || !longitude) {
    throw new Error("Location coordinates are required");
  }

  const response = await fetch(
    `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&timesteps=1h&units=imperial&apikey=${WEATHER_API_KEY}`,
    { method: 'GET' }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch hourly forecast');
  }
  
  const data = await response.json();
  return data.timelines?.hourly?.slice(0, hours) || [];
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