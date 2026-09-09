import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  CloudRain,
  Cloud,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Settings,
  MapPin,
  Calendar,
  TrendingUp,
  Snowflake,
  Eye,
  Gauge,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Import the new weather utility functions
import {
  fetchCurrentWeather,
  fetchDailyForecast,
  fetchHourlyForecast,
  getWeatherIcon, // Using directly, not aliased
  getWeatherDescription,
  getPrecipitationType,
  getHomesteadRecommendations
} from "@/components/utils/weatherUtils";
import WeatherRadarMap from "@/components/weather/WeatherRadarMap";

// Fix leaflet icon issue
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Map string icon names to Lucide React components
const iconComponents = {
  Cloud,
  CloudRain,
  Sun,
  Snowflake,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  TrendingUp
};

export default function WeatherDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Keep queryClient for invalidateQueries
  const [showSettings, setShowSettings] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Initialize form with user data and attempt geolocation if no saved coordinates
  useEffect(() => {
    if (user) {
      setLatitude(user.property_latitude || "");
      setLongitude(user.property_longitude || "");

      // Only attempt geolocation if property_latitude is not set by user
      if (!user.property_latitude && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude.toString());
            setLongitude(position.coords.longitude.toString());
          },
          (error) => console.log("Geolocation error:", error)
        );
      }
    }
  }, [user]);

  // Current weather with caching
  const { data: weatherData, isLoading: loadingCurrent, error: currentError, refetch: refetchCurrent } = useQuery({
    queryKey: ['weather-current', user?.property_latitude, user?.property_longitude],
    queryFn: () => fetchCurrentWeather(user.property_latitude, user.property_longitude),
    enabled: !!(user?.property_latitude && user?.property_longitude && !showSettings),
    staleTime: 30 * 60 * 1000, // Data considered fresh for 30 minutes
    cacheTime: 60 * 60 * 1000, // Data stays in cache for 1 hour
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on mount
    retry: 1, // Allow one retry on failure
    retryDelay: 30 * 1000, // Wait 30 seconds before retrying
  });

  // Daily forecast with caching
  const { data: forecastData, isLoading: loadingForecast, error: forecastError, refetch: refetchDaily } = useQuery({
    queryKey: ['weather-forecast-daily', user?.property_latitude, user?.property_longitude],
    queryFn: () => fetchDailyForecast(user.property_latitude, user.property_longitude, 7),
    enabled: !!(user?.property_latitude && user?.property_longitude && !showSettings),
    staleTime: 60 * 60 * 1000, // Data considered fresh for 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // Data stays in cache for 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 30 * 1000,
  });

  // Hourly forecast with caching
  const { data: hourlyData, isLoading: loadingHourly, error: hourlyError, refetch: refetchHourly } = useQuery({
    queryKey: ['weather-forecast-hourly', user?.property_latitude, user?.property_longitude],
    queryFn: () => fetchHourlyForecast(user.property_latitude, user.property_longitude, 24),
    enabled: !!(user?.property_latitude && user?.property_longitude && !showSettings),
    staleTime: 30 * 60 * 1000, // Data considered fresh for 30 minutes
    cacheTime: 2 * 60 * 60 * 1000, // Data stays in cache for 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 30 * 1000,
  });

  const handleSaveSettings = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid coordinates");
      return;
    }

    try {
      await base44.auth.updateMe({
        property_latitude: lat,
        property_longitude: lng,
      });
      // Invalidate and refetch user to update property_latitude/longitude
      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await refetchUser();
      setShowSettings(false);
      // React-query's enabled logic will automatically trigger weather data fetches with new coordinates
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        (error) => {
          alert("Unable to detect location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Helper function to get the Lucide icon component dynamically
  const getWeatherIconComponent = (code, sizeClass = "w-12 h-12") => {
    const iconName = getWeatherIcon(code); // Use the imported utility function
    const IconComponent = iconComponents[iconName] || Cloud;
    return <IconComponent className={`${sizeClass} text-gray-400`} />;
  };

  // Check if the error is due to rate limiting
  const isRateLimit = currentError?.message?.includes('rate limit') || currentError?.message?.includes('request limit');

  if (showSettings || (!user?.property_latitude && !user?.property_longitude)) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Weather Location Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Cloud className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Weather Powered by Tomorrow.io</h3>
                    <p className="text-sm text-blue-800">
                      Get accurate weather forecasts and alerts for your homestead.
                      Simply set your property location to get started. Each user's location is private and secure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <Label className="mb-0">Property Location</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={detectLocation}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Detect Location
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="40.7128"
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="-74.0060"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Tip:</strong> Get your property coordinates from Google Maps by right-clicking on your location and selecting the coordinates.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Privacy:</strong> Your location is stored securely and is only used to fetch weather data for your account. Other users cannot see your location.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {(user?.property_latitude || user?.property_longitude) && (
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSaveSettings}
                  disabled={!latitude || !longitude}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Combine loading states for initial full page loading
  const isLoadingInitialData = loadingCurrent && !weatherData;

  if (isLoadingInitialData) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <CloudRain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Weather Dashboard</h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {user?.property_latitude && user?.property_longitude && `${parseFloat(user.property_latitude).toFixed(4)}, ${parseFloat(user.property_longitude).toFixed(4)}`}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Live Weather Radar — always visible, even while weather data loads */}
          {user?.property_latitude && user?.property_longitude && (
            <WeatherRadarMap
              latitude={user.property_latitude}
              longitude={user.property_longitude}
              weatherData={null}
            />
          )}

          {/* Loading indicator */}
          <Card>
            <CardContent className="py-12 text-center">
              <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading weather data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Display a single error message for any weather data fetch failure
  const primaryError = currentError || forecastError || hourlyError;

  if (primaryError) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <CloudRain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Weather Dashboard</h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {user?.property_latitude && user?.property_longitude && `${parseFloat(user.property_latitude).toFixed(4)}, ${parseFloat(user.property_longitude).toFixed(4)}`}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Live Weather Radar — always visible, even when weather data fails */}
          {user?.property_latitude && user?.property_longitude && (
            <WeatherRadarMap
              latitude={user.property_latitude}
              longitude={user.property_longitude}
              weatherData={null}
            />
          )}

          {/* Error message */}
          <Card className="border-red-300 bg-red-50 max-w-2xl mx-auto">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-900 mb-2">
                {isRateLimit ? 'Weather API Limit Reached' : 'Weather Data Unavailable'}
              </h3>
              <p className="text-red-700 mb-4">
                {isRateLimit
                  ? 'The weather service has temporarily rate-limited requests. Weather data will automatically refresh. This is normal and helps manage API usage costs.'
                  : primaryError.message}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Check Settings
                </Button>
                {!isRateLimit && (
                  <Button onClick={() => refetchCurrent()} className="bg-blue-600 hover:bg-blue-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
              {isRateLimit && (
                <p className="text-sm text-red-600 mt-4">
                  💡 Tip: Weather data is cached for 30-60 minutes to reduce API usage.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pass user object to getHomesteadRecommendations for frost_alert_threshold
  const recommendations = weatherData ? getHomesteadRecommendations(weatherData, user) : [];
  const precipInfo = weatherData ? getPrecipitationType(weatherData.values.weatherCode) : null;
  const PrecipIcon = precipInfo ? iconComponents[precipInfo.icon] || CloudRain : CloudRain; // Get dynamic icon component for precipitation

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <CloudRain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Weather Dashboard</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {user?.property_latitude && user?.property_longitude && `${parseFloat(user.property_latitude).toFixed(4)}, ${parseFloat(user.property_longitude).toFixed(4)}`}
                {weatherData?.time && <span className="text-xs">• Updated {format(new Date(weatherData.time), 'h:mm a')}</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                refetchCurrent(); // Only refetch current when user clicks. Forecasts will update when switching tabs or becoming stale.
              }}
              disabled={loadingCurrent}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingCurrent ? 'animate-spin' : ''}`} />
              {loadingCurrent ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {isRateLimit && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-800 font-semibold">
                    Weather API rate limit reached - showing cached data
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Data will refresh automatically in a few minutes. Weather information is cached for 30-60 minutes to manage API usage.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Weather Radar — always visible above tabs */}
        {user?.property_latitude && user?.property_longitude && (
          <WeatherRadarMap
            latitude={user.property_latitude}
            longitude={user.property_longitude}
            weatherData={weatherData}
          />
        )}

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="hourly">Hourly</TabsTrigger>
            <TabsTrigger value="forecast">7-Day</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>

          {/* Current Weather */}
          <TabsContent value="current" className="space-y-6">
            {weatherData && (
              <>
                {/* Current Conditions Card */}
                <Card className="border-none shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  <CardContent className="py-8">
                    <div className="flex items-center justify-between flex-wrap gap-6">
                      <div className="flex items-center gap-6">
                        {getWeatherIconComponent(weatherData.values.weatherCode)}
                        <div>
                          <p className="text-6xl font-bold">
                            {Math.round(weatherData.values.temperature)}°F
                          </p>
                          <p className="text-2xl mt-2 opacity-90">
                            {getWeatherDescription(weatherData.values.weatherCode)}
                          </p>
                          <p className="text-lg mt-1 opacity-75">
                            Feels like {Math.round(weatherData.values.temperatureApparent)}°F
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Wind className="w-5 h-5" />
                            <span className="text-sm opacity-75">Wind Speed</span>
                          </div>
                          <p className="text-2xl font-semibold">{Math.round(weatherData.values.windSpeed)} mph</p>
                          <p className="text-sm opacity-75">Gusts: {Math.round(weatherData.values.windGust || weatherData.values.windSpeed)} mph</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Droplets className="w-5 h-5" />
                            <span className="text-sm opacity-75">Humidity</span>
                          </div>
                          <p className="text-2xl font-semibold">{Math.round(weatherData.values.humidity)}%</p>
                          <p className="text-sm opacity-75">Dew Point: {Math.round(weatherData.values.dewPoint || 0)}°F</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {precipInfo && <PrecipIcon className={`w-5 h-5 ${precipInfo.color}`} />}
                            <span className="text-sm opacity-75">Precipitation</span>
                          </div>
                          <p className="text-2xl font-semibold">{Math.round(weatherData.values.precipitationProbability || 0)}%</p>
                          <p className="text-sm opacity-75">{precipInfo?.type}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Gauge className="w-5 h-5" />
                            <span className="text-sm opacity-75">Pressure</span>
                          </div>
                          <p className="text-2xl font-semibold">{(weatherData.values.pressureSeaLevel || 0).toFixed(2)}</p>
                          <p className="text-sm opacity-75">inHg</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="w-5 h-5" />
                            <span className="text-sm opacity-75">Visibility</span>
                          </div>
                          <p className="text-2xl font-semibold">{Math.round(weatherData.values.visibility || 10)} mi</p>
                          <p className="text-sm opacity-75">Cloud Cover: {Math.round(weatherData.values.cloudCover || 0)}%</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Sun className="w-5 h-5" />
                            <span className="text-sm opacity-75">UV Index</span>
                          </div>
                          <p className="text-2xl font-semibold">{Math.round(weatherData.values.uvIndex || 0)}</p>
                          <p className="text-sm opacity-75">
                            {weatherData.values.uvIndex < 3 ? "Low" : weatherData.values.uvIndex < 6 ? "Moderate" : weatherData.values.uvIndex < 8 ? "High" : "Very High"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Homestead Recommendations */}
                {recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Homestead Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {recommendations.map((rec, idx) => {
                          const RecIcon = iconComponents[rec.icon] || AlertTriangle; // Dynamically get icon component
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-3 p-4 rounded-lg ${
                                rec.priority === 'critical' ? 'bg-red-50 border-2 border-red-300' :
                                rec.priority === 'high' ? 'bg-orange-50 border-2 border-orange-300' :
                                rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-300' :
                                'bg-green-50 border border-green-300'
                              }`}
                            >
                              <RecIcon className={`w-6 h-6 ${rec.color} flex-shrink-0 mt-0.5`} />
                              <div>
                                <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Hourly Forecast */}
          <TabsContent value="hourly">
            {hourlyData && (
              <Card>
                <CardHeader>
                  <CardTitle>24-Hour Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-4">
                      {hourlyData.map((hour, idx) => {
                        const hourDate = new Date(hour.time);
                        const precipInfoHourly = getPrecipitationType(hour.values.weatherCode);
                        const PrecipIconHourly = iconComponents[precipInfoHourly.icon] || CloudRain; // Dynamic icon for hourly

                        return (
                          <div key={idx} className="flex-shrink-0 w-24 text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <p className="text-sm font-semibold text-gray-900">
                              {idx === 0 ? 'Now' : format(hourDate, 'ha')}
                            </p>
                            <div className="my-3 flex justify-center">
                              {getWeatherIconComponent(hour.values.weatherCode)}
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {Math.round(hour.values.temperature)}°
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-blue-600">
                              <PrecipIconHourly className="w-3 h-3" />
                              <span>{Math.round(hour.values.precipitationProbability || 0)}%</span>
                            </div>
                            {hour.values.precipitationIntensity > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                {hour.values.precipitationIntensity.toFixed(2)}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 7-Day Forecast */}
          <TabsContent value="forecast">
            {forecastData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    7-Day Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecastData.map((day, idx) => {
                      const date = new Date(day.time);
                      const values = day.values;
                      const hasFrost = values.temperatureMin <= (user?.frost_alert_threshold || 32);
                      const precipInfoDaily = getPrecipitationType(values.weatherCodeMax);
                      const PrecipIconDaily = iconComponents[precipInfoDaily.icon] || CloudRain; // Dynamic icon for daily

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-4 rounded-lg ${
                            hasFrost ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-32">
                              <p className="font-semibold text-gray-900">
                                {idx === 0 ? 'Today' : format(date, 'EEEE')}
                              </p>
                              <p className="text-sm text-gray-600">{format(date, 'MMM d')}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              {getWeatherIconComponent(values.weatherCodeMax)}
                              <div>
                                <p className="text-sm text-gray-700">{getWeatherDescription(values.weatherCodeMax)}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                  <PrecipIconDaily className="w-3 h-3" />
                                  <span>{Math.round(values.precipitationProbabilityAvg || 0)}% chance</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                {Math.round(values.temperatureMax)}°
                              </p>
                              <p className="text-sm text-gray-600">
                                {Math.round(values.temperatureMin)}°
                              </p>
                            </div>

                            {values.precipitationIntensityAvg > 0 && (
                              <div className="text-right">
                                <p className="text-sm font-semibold text-blue-600">
                                  {values.precipitationIntensityAvg.toFixed(2)}"
                                </p>
                                <p className="text-xs text-gray-600">{precipInfoDaily.type}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-gray-600">
                              <Wind className="w-4 h-4" />
                              <span className="text-sm">{Math.round(values.windSpeedAvg)} mph</span>
                            </div>

                            {hasFrost && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                <Snowflake className="w-3 h-3 mr-1" />
                                Frost
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Interactive Map */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Property Weather Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-lg overflow-hidden">
                  {user?.property_latitude && user?.property_longitude && (
                    <MapContainer
                      center={[parseFloat(user.property_latitude), parseFloat(user.property_longitude)]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[parseFloat(user.property_latitude), parseFloat(user.property_longitude)]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">Your Property</p>
                            {weatherData && (
                              <>
                                <p className="text-2xl font-bold mt-2">
                                  {Math.round(weatherData.values.temperature)}°F
                                </p>
                                <p className="text-sm text-gray-600">
                                  {getWeatherDescription(weatherData.values.weatherCode)}
                                </p>
                              </>
                            )}
                          </div>
                        </Popup>
                      </Marker>

                      <Circle
                        center={[parseFloat(user.property_latitude), parseFloat(user.property_longitude)]}
                        radius={5000}
                        pathOptions={{
                          color: 'blue',
                          fillColor: 'blue',
                          fillOpacity: 0.1
                        }}
                      />
                    </MapContainer>
                  )}
                </div>

                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Current Conditions</h4>
                    {weatherData && (
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>Temperature: {Math.round(weatherData.values.temperature)}°F</p>
                        <p>Wind: {Math.round(weatherData.values.windSpeed)} mph</p>
                        <p>Humidity: {Math.round(weatherData.values.humidity)}%</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Location</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>Lat: {parseFloat(user?.property_latitude || 0).toFixed(4)}</p>
                      <p>Lon: {parseFloat(user?.property_longitude || 0).toFixed(4)}</p>
                      <p className="text-xs mt-2 text-green-700">5km radius shown</p>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Map Layers</h4>
                    <div className="space-y-1 text-sm text-purple-800">
                      <p>✓ Street Map</p>
                      <p>✓ Property Marker</p>
                      <p>✓ Weather Radius</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Planning Tips */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Weather-Based Planning Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Planting</h4>
                <p className="text-sm text-green-800">
                  Wait for consistent temps above 50°F for cold-sensitive crops. Check 7-day forecast for frost before transplanting.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Irrigation</h4>
                <p className="text-sm text-green-800">
                  Skip watering if rain expected within 24 hours. Deep water before heat waves. Avoid watering in high winds.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-2">Livestock</h4>
                <p className="text-sm text-green-800">
                  Check water sources before freezing temps. Provide shade when temps exceed 85°F. Secure shelters before storms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}