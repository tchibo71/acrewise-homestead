import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  ArrowRight,
  Snowflake,
  MapPin
} from "lucide-react";
import { fetchCurrentWeather, getWeatherIcon, getHomesteadRecommendations } from "@/components/utils/weatherUtils";

const iconComponents = {
  Cloud,
  CloudRain,
  Sun,
  Snowflake,
  AlertTriangle,
  Wind,
  Droplets
};

export default function WeatherWidget() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: weatherData, isLoading, error } = useQuery({
    queryKey: ['weather-current', user?.property_latitude, user?.property_longitude],
    queryFn: () => fetchCurrentWeather(user.property_latitude, user.property_longitude),
    enabled: !!(user?.property_latitude && user?.property_longitude),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 60 * 60 * 1000,
    retry: 1,
    retryDelay: 60000,
  });

  // Memoize weather calculations to prevent recalculations on re-render
  const weatherDisplay = useMemo(() => {
    if (!weatherData) return null;
    
    const temp = Math.round(weatherData.values.temperature);
    const iconName = getWeatherIcon(weatherData.values.weatherCode);
    const IconComp = iconComponents[iconName] || Cloud;
    const recs = getHomesteadRecommendations(weatherData, user);
    const hasCritical = recs.some(r => r.priority === "critical" || r.priority === "high");
    
    return { temp, IconComponent: IconComp, recommendations: recs, hasCriticalAlert: hasCritical };
  }, [weatherData, user]);

  if (!user?.property_latitude || !user?.property_longitude) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Weather Forecasts</h4>
          <p className="text-sm text-gray-600 mb-4">
            Get real-time weather data and forecasts for your homestead
          </p>
          <Button
            size="sm"
            onClick={() => navigate(createPageUrl("UserSettings"))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Setup Location
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isRateLimit = error.message?.includes('rate limit') || error.message?.includes('request limit');
    
    return (
      <Card className="border-orange-300 bg-orange-50">
        <CardContent className="py-6 text-center">
          <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-sm text-orange-800 font-semibold mb-1">
            {isRateLimit ? 'Weather API Limit Reached' : 'Unable to load weather'}
          </p>
          {isRateLimit && (
            <p className="text-xs text-orange-700 mb-3">
              Data will refresh automatically in a few minutes
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => navigate(createPageUrl("WeatherDashboard"))}
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-gray-600">Loading weather...</p>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData || !weatherDisplay) return null;

  const { temp, IconComponent, recommendations, hasCriticalAlert } = weatherDisplay;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("WeatherDashboard"))}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Current Weather</span>
          {hasCriticalAlert && (
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className="w-12 h-12 text-gray-600" />
            <div>
              <p className="text-3xl font-bold text-gray-900">{temp}°F</p>
              <p className="text-sm text-gray-600">
                Feels {Math.round(weatherData.values.temperatureApparent)}°F
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Wind className="w-4 h-4" />
            <span>{Math.round(weatherData.values.windSpeed)} mph</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Droplets className="w-4 h-4" />
            <span>{Math.round(weatherData.values.humidity)}%</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CloudRain className="w-4 h-4" />
            <span>{Math.round(weatherData.values.precipitationProbability || 0)}% rain</span>
          </div>
        </div>

        {recommendations.slice(0, 2).map((rec, idx) => {
          const RecIcon = iconComponents[rec.icon] || AlertTriangle;
          return (
            <Badge key={idx} className={`w-full justify-center ${
              rec.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-300' :
              rec.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-300' :
              rec.priority === 'medium' ? 'bg-blue-100 text-blue-700 border-blue-300' :
              'bg-green-100 text-green-700 border-green-300'
            }`}>
              <RecIcon className="w-3 h-3 mr-1" />
              {rec.title}
            </Badge>
          );
        })}

        <Button variant="ghost" className="w-full" size="sm">
          View Full Forecast
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}