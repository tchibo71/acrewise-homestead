import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, CheckCircle2, XCircle, AlertTriangle, Mountain, Waves, Droplets, Thermometer, Leaf } from "lucide-react";
import { fetchAllSiteData } from "@/components/utils/siteDataUtils";

/**
 * Extracts a 5-digit ZIP code from a US address string.
 * @param {string} address
 * @returns {string | null}
 */
function extractZipFromAddress(address) {
  if (!address) return null;
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

/**
 * Reverse-geocodes lat/lon to a ZIP code using Nominatim (free, keyless).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string | null>}
 */
async function reverseGeocodeZip(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.address?.postcode?.split("-")[0]?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Renders a single site data field with success/failure status.
 */
function SiteDataField({ label, value, icon: Icon, status }) {
  const statusConfig = {
    success: { color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2, iconColor: "text-green-600" },
    failed: { color: "text-red-700 bg-red-50 border-red-200", icon: XCircle, iconColor: "text-red-600" },
    pending: { color: "text-gray-500 bg-gray-50 border-gray-200", icon: AlertTriangle, iconColor: "text-gray-400" },
  };
  const cfg = statusConfig[status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${cfg.color}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium shrink-0">{label}:</span>
        <span className="text-sm truncate">
          {status === "success" ? (value ?? "N/A") : status === "failed" ? "Fetch failed" : "Not yet fetched"}
        </span>
      </div>
      <StatusIcon className={`w-4 h-4 shrink-0 ${cfg.iconColor}`} />
    </div>
  );
}

export default function SiteDataCard({ profile, propertyMap, onSave }) {
  const [fetching, setFetching] = useState(false);
  const [fetchResults, setFetchResults] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const hasCoords = propertyMap?.center_latitude != null && propertyMap?.center_longitude != null;
  const fetchedDate = profile?.site_data_fetched_date;

  const handleFetchSiteData = async () => {
    if (!hasCoords) {
      setFetchError("No property map coordinates found. Please set your property center point on the Property Map page first.");
      return;
    }

    setFetching(true);
    setFetchError(null);
    setFetchResults(null);

    try {
      const lat = propertyMap.center_latitude;
      const lon = propertyMap.center_longitude;

      // Try to get ZIP from the address, then reverse-geocode as fallback
      let zipCode = extractZipFromAddress(profile?.location_address);
      if (!zipCode) {
        zipCode = await reverseGeocodeZip(lat, lon);
      }

      const results = await fetchAllSiteData(lat, lon, zipCode);

      // Build status map for UI
      const statuses = {
        soil_series: results.soil_series ? "success" : "failed",
        flood_zone: results.flood_zone ? "success" : "failed",
        elevation_ft: results.elevation ? "success" : "failed",
        hardiness_zone: results.hardiness_zone ? "success" : "failed",
        wetlands_present: results.wetlands ? "success" : "failed",
      };

      setFetchResults({ statuses, zipCodeUsed: zipCode });

      // Build the update payload
      const updateData = {
        soil_series: results.soil_series?.soil_series ?? null,
        flood_zone: results.flood_zone?.flood_zone ?? null,
        is_in_floodplain: results.flood_zone?.is_in_floodplain ?? null,
        elevation_ft: results.elevation?.elevation_ft ?? null,
        hardiness_zone: results.hardiness_zone?.hardiness_zone ?? null,
        wetlands_present: results.wetlands?.wetlands_present ?? null,
        site_data_fetched_date: new Date().toISOString().split("T")[0],
      };

      await onSave(updateData);
    } catch (error) {
      setFetchError(error.message || "Failed to fetch site data");
    } finally {
      setFetching(false);
    }
  };

  return (
    <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-cyan-600" />
            Site Data
          </CardTitle>
          <Button
            type="button"
            onClick={handleFetchSiteData}
            disabled={fetching || !hasCoords}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {fetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Fetch Site Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasCoords && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              No property center coordinates found. Set your property's center point on the{" "}
              <strong>Property Map</strong> page to enable site data lookups.
            </span>
          </div>
        )}

        {fetchError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Show existing data or fetch results */}
        <div className="space-y-2">
          <SiteDataField
            label="Soil Series"
            icon={Leaf}
            value={profile?.soil_series}
            status={fetchResults?.statuses?.soil_series ?? (profile?.soil_series ? "success" : "pending")}
          />
          <SiteDataField
            label="Flood Zone"
            icon={Waves}
            value={profile?.flood_zone ? `${profile.flood_zone}${profile.is_in_floodplain ? " (SFHA)" : ""}` : null}
            status={fetchResults?.statuses?.flood_zone ?? (profile?.flood_zone ? "success" : "pending")}
          />
          <SiteDataField
            label="Elevation"
            icon={Mountain}
            value={profile?.elevation_ft != null ? `${profile.elevation_ft} ft` : null}
            status={fetchResults?.statuses?.elevation_ft ?? (profile?.elevation_ft != null ? "success" : "pending")}
          />
          <SiteDataField
            label="Hardiness Zone"
            icon={Thermometer}
            value={profile?.hardiness_zone}
            status={fetchResults?.statuses?.hardiness_zone ?? (profile?.hardiness_zone ? "success" : "pending")}
          />
          <SiteDataField
            label="Wetlands"
            icon={Droplets}
            value={profile?.wetlands_present != null ? (profile.wetlands_present ? "Present" : "None detected") : null}
            status={fetchResults?.statuses?.wetlands_present ?? (profile?.wetlands_present != null ? "success" : "pending")}
          />
        </div>

        {/* ZIP code used indicator */}
        {fetchResults?.zipCodeUsed && (
          <p className="text-xs text-gray-500">
            ZIP code used for hardiness lookup: <strong>{fetchResults.zipCodeUsed}</strong>
            {!profile?.location_address && " (reverse-geocoded from coordinates)"}
          </p>
        )}

        {/* Last fetched date and re-fetch note */}
        {fetchedDate && (
          <div className="space-y-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Last fetched: {new Date(fetchedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </Badge>
            <p className="text-xs text-gray-500 italic">
              Boundary and administrative data like flood zones can change over time. Re-fetch periodically to stay current.
            </p>
          </div>
        )}

        {/* Summary after fetch */}
        {fetchResults && (
          <div className="text-xs text-gray-600 rounded-lg bg-white/60 border border-gray-200 px-3 py-2">
            {Object.values(fetchResults.statuses).filter((s) => s === "success").length} of 5 data sources fetched successfully.
            {Object.values(fetchResults.statuses).some((s) => s === "failed") && (
              <span className="text-red-600"> Some sources were unavailable — you can try again later.</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}