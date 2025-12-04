// Centralized Mapbox configuration
export const MAPBOX_API_KEY = "sk.eyJ1IjoidGNoaWJvNzEiLCJhIjoiY21neWV0Y3RiMGFjejJtb2o3bWNlaGV6ciJ9.8XjFmQfaLlx5dKzJQSQiAA";

// Map style presets
export const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11"
};

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  center: [-98.5795, 39.8283], // Center of USA
  zoom: 4,
  style: MAP_STYLES.satellite
};

// Layer colors for different features
export const LAYER_COLORS = {
  property_boundary: "#10b981", // green
  orchard: "#22c55e", // lighter green
  garden: "#84cc16", // lime
  water: "#3b82f6", // blue
  infrastructure: "#8b5cf6", // purple
  pasture: "#fbbf24", // amber
  forest: "#065f46", // dark green
  crop: "#eab308" // yellow
};

// Calculate polygon center (centroid)
export const calculatePolygonCenter = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return null;
  
  let latSum = 0;
  let lngSum = 0;
  
  coordinates.forEach(coord => {
    latSum += coord[0];
    lngSum += coord[1];
  });
  
  return {
    latitude: latSum / coordinates.length,
    longitude: lngSum / coordinates.length
  };
};

// Calculate polygon area in acres using spherical earth model
export const calculateAreaInAcres = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  // Convert to radians
  const toRad = (deg) => deg * (Math.PI / 180);
  
  // Earth's radius in meters
  const earthRadius = 6371000;
  
  let area = 0;
  const numPoints = coordinates.length;
  
  for (let i = 0; i < numPoints; i++) {
    const j = (i + 1) % numPoints;
    const lat1 = toRad(coordinates[i][0]);
    const lat2 = toRad(coordinates[j][0]);
    const lng1 = toRad(coordinates[i][1]);
    const lng2 = toRad(coordinates[j][1]);
    
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  
  area = Math.abs(area * earthRadius * earthRadius / 2);
  
  // Convert square meters to acres (1 acre = 4046.86 square meters)
  return area / 4046.86;
};

// Geocode address to coordinates using Mapbox Geocoding API
export const geocodeAddress = async (address) => {
  if (!address || address.trim() === '') {
    throw new Error("Address is required");
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_API_KEY}&country=US&types=address,place`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to geocode address');
  }
  
  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    throw new Error('Address not found');
  }

  const feature = data.features[0];
  const [longitude, latitude] = feature.center;
  
  return {
    latitude,
    longitude,
    formatted_address: feature.place_name,
    context: feature.context
  };
};