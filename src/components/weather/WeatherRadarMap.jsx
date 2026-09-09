import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, Play, Pause, RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import { getWeatherDescription } from "@/components/utils/weatherUtils";

// Fix leaflet icons (idempotent — safe if parent already did this)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ANIMATION_INTERVAL = 800; // 800ms per frame

export default function WeatherRadarMap({ latitude, longitude, weatherData }) {
  const [frames, setFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const animationRef = useRef(null);

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const fetchRadarFrames = useCallback(async () => {
    try {
      const response = await fetch(RAINVIEWER_API);
      if (!response.ok) throw new Error(`Radar API error: ${response.status}`);
      const data = await response.json();

      const host = data.host || "https://tilecache.rainviewer.com";
      const pastFrames = (data.radar?.past || []).map((f) => ({ ...f, host, isForecast: false }));
      const nowcastFrames = (data.radar?.nowcast || []).map((f) => ({ ...f, host, isForecast: true }));
      const allFrames = [...pastFrames, ...nowcastFrames];

      if (allFrames.length > 0) {
        setFrames(allFrames);
        // Default to the latest past frame (most recent actual data)
        const latestPastIndex = pastFrames.length - 1;
        setCurrentFrameIndex(Math.max(0, latestPastIndex));
        setLastUpdated(new Date());
        setError(null);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching radar frames:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 5 minutes
  useEffect(() => {
    fetchRadarFrames();
    const interval = setInterval(fetchRadarFrames, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRadarFrames]);

  // Animation loop — cycles through past → nowcast frames
  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      animationRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, ANIMATION_INTERVAL);
      return () => clearInterval(animationRef.current);
    }
  }, [isPlaying, frames.length]);

  const currentFrame = frames[currentFrameIndex];
  const radarTileUrl = currentFrame
    ? `${currentFrame.host}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
    : null;

  const frameTime = currentFrame ? new Date(currentFrame.time * 1000) : null;
  const isForecast = currentFrame?.isForecast;

  return (
    <Card className="border-none shadow-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-blue-600" />
            Live Weather Radar
          </CardTitle>
          <div className="flex items-center gap-2">
            {frameTime && (
              <Badge
                variant="secondary"
                className={isForecast ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}
              >
                {isForecast ? "Forecast" : "Live"}
              </Badge>
            )}
            {lastUpdated && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {format(lastUpdated, "h:mm a")}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Radar Map */}
        <div className="h-[350px] md:h-[450px] relative bg-gray-900">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Radar className="w-12 h-12 text-blue-400 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-gray-400">Loading radar...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <Radar className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Radar temporarily unavailable</p>
                <Button size="sm" variant="outline" className="mt-3 text-white border-gray-600" onClick={fetchRadarFrames}>
                  <RefreshCw className="w-3 h-3 mr-1" /> Retry
                </Button>
              </div>
            </div>
          ) : (
            <MapContainer
              key={`${lat}-${lng}`}
              center={[lat, lng]}
              zoom={8}
              style={{ height: "100%", width: "100%" }}
            >
              {/* Base map — OSM with dark filter for radar visibility */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
                className="radar-base-tiles"
              />
              {/* RainViewer radar overlay */}
              {radarTileUrl && (
                <TileLayer
                  key={currentFrame.path}
                  url={radarTileUrl}
                  opacity={0.65}
                  attribution='Radar &copy; RainViewer'
                />
              )}
              {/* Property marker */}
              <Marker position={[lat, lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">Your Property</p>
                    {weatherData && (
                      <>
                        <p className="text-2xl font-bold mt-1">
                          {Math.round(weatherData.values.temperature)}&deg;F
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
                center={[lat, lng]}
                radius={10000}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.05,
                  weight: 1,
                }}
              />
            </MapContainer>
          )}
        </div>

        {/* Controls bar */}
        <div className="px-4 py-3 bg-gray-50 border-t space-y-3">
          {/* Frame timestamp + play/pause */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 w-8 p-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              {frameTime && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {format(frameTime, "EEE h:mm a")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isForecast ? "Forecast radar" : "Actual radar"}
                  </p>
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={fetchRadarFrames} className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh Now
            </Button>
          </div>

          {/* Timeline — clickable frame scrubber */}
          {frames.length > 1 && (
            <div className="flex items-center gap-0.5">
              {frames.map((frame, idx) => (
                <button
                  key={frame.time}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(idx);
                  }}
                  className={`flex-1 h-2.5 rounded-full transition-all hover:opacity-80 ${
                    idx === currentFrameIndex
                      ? frame.isForecast
                        ? "bg-orange-500"
                        : "bg-blue-500"
                      : frame.isForecast
                      ? "bg-orange-200"
                      : "bg-blue-200"
                  }`}
                  title={format(new Date(frame.time * 1000), "h:mm a")}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-300"></span> Past
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-300"></span> Forecast
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>Light</span>
              <div className="flex overflow-hidden rounded">
                <span className="w-4 h-3 bg-blue-200"></span>
                <span className="w-4 h-3 bg-blue-400"></span>
                <span className="w-4 h-3 bg-blue-600"></span>
                <span className="w-4 h-3 bg-blue-800"></span>
              </div>
              <span>Heavy</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}