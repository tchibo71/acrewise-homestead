import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Snowflake, CloudRain, Wind, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchDailyForecast } from "@/components/utils/weatherUtils";
import { getWeatherRecommendations } from "@/components/utils/weatherUtils";

const severityConfig = {
  critical: {
    bg: "bg-red-50 border-red-300",
    icon: "text-red-600",
    label: "text-red-900",
  },
  warning: {
    bg: "bg-orange-50 border-orange-300",
    icon: "text-orange-600",
    label: "text-orange-900",
  },
  info: {
    bg: "bg-blue-50 border-blue-300",
    icon: "text-blue-600",
    label: "text-blue-900",
  },
};

const getIcon = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes("frost")) return Snowflake;
  if (lower.includes("rain")) return CloudRain;
  if (lower.includes("wind")) return Wind;
  return AlertTriangle;
};

// Compact alert banner — only renders when there are warning/critical recommendations.
export default function WeatherAlertBanner() {
  const { data: user } = useQuery({
    queryKey: ['current-user-weather-banner'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: forecastData } = useQuery({
    queryKey: ['weather-forecast-daily-banner', user?.property_latitude, user?.property_longitude],
    queryFn: () => fetchDailyForecast(user.property_latitude, user.property_longitude, 3),
    enabled: !!(user?.property_latitude && user?.property_longitude),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  const alerts = useMemo(
    () => getWeatherRecommendations(forecastData, user).filter(r => r.severity === 'warning' || r.severity === 'critical'),
    [forecastData, user]
  );

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => {
        const config = severityConfig[alert.severity];
        const Icon = getIcon(alert.message);
        return (
          <Link
            key={idx}
            to="/WeatherDashboard"
            className={`block rounded-lg border-2 ${config.bg} p-3 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 ${config.icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wide ${config.label} mb-0.5`}>
                  {alert.severity === 'critical' ? 'Critical Weather Alert' : 'Weather Advisory'}
                </p>
                <p className="text-sm text-gray-700 leading-snug">{alert.message}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}