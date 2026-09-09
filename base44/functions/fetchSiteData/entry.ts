import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const REQUEST_HEADERS = {
  'User-Agent': 'AcreWise-Homestead/1.0 (farm planning app; +https://homestead-harmony-ffe046ea.base44.app)',
};

async function fetchWithTimeout(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...REQUEST_HEADERS, ...(options?.headers || {}) },
    });
    clearTimeout(timeout);
    return { ok: res.ok, status: res.status, data: await res.text() };
  } catch (e) {
    clearTimeout(timeout);
    return { ok: false, error: e.message };
  }
}

async function fetchSoilSeries(lat, lon) {
  try {
    const pointWkt = `POINT(${lon} ${lat})`;
    const mukeyQuery = `SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${pointWkt}')`;

    const mukeyRes = await fetchWithTimeout(
      "https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `format=json&query=${encodeURIComponent(mukeyQuery)}`,
      }
    );

    if (!mukeyRes.ok || !mukeyRes.data) return null;
    const mukeyData = JSON.parse(mukeyRes.data);
    if (!mukeyData?.Table?.length) return null;

    const mukeys = mukeyData.Table.map((row) => row[0]).filter(Boolean);
    if (!mukeys.length) return null;

    const mukeyList = mukeys.map((k) => Number(k)).join(",");
    const munameQuery = `SELECT muname FROM mapunit WHERE mukey IN (${mukeyList})`;

    const munameRes = await fetchWithTimeout(
      "https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `format=json&query=${encodeURIComponent(munameQuery)}`,
      }
    );

    if (!munameRes.ok || !munameRes.data) return null;
    const munameData = JSON.parse(munameRes.data);
    if (!munameData?.Table?.length) return null;

    const soilSeries = munameData.Table.map((row) => row[0]).filter(Boolean);
    if (!soilSeries.length) return null;

    return { soil_series: soilSeries[0] };
  } catch (e) {
    return null;
  }
}

async function fetchFloodZone(lat, lon) {
  try {
    const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry=${lon}%2C${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE%2CZONE_SUBTY&returnGeometry=false&f=json`;

    const res = await fetchWithTimeout(url);
    if (!res.ok || !res.data) return null;

    const data = JSON.parse(res.data);
    if (data?.error) return null;

    const features = data.features || [];
    if (features.length === 0) {
      return { flood_zone: "X", is_in_floodplain: false };
    }

    const attrs = features[0].attributes || {};
    const floodZone = attrs.FLD_ZONE || attrs.ZONE_SUBTY || "Unknown";
    const sfhaZones = ["A", "AE", "AH", "AO", "A99", "AR", "V", "VE"];
    const isFloodplain = sfhaZones.some(
      (z) => floodZone.toUpperCase() === z || floodZone.toUpperCase().startsWith(z)
    );

    return { flood_zone: floodZone, is_in_floodplain: isFloodplain };
  } catch (e) {
    return null;
  }
}

async function fetchElevation(lat, lon) {
  // Try USGS EPQS first (most accurate for US)
  try {
    const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Feet&wkid=4326`;
    const res = await fetchWithTimeout(url, null, 8000);
    if (res.ok && res.data) {
      const data = JSON.parse(res.data);
      if (data?.value?.length) {
        const elevation = data.value[0]?.elevation;
        if (elevation != null && !isNaN(elevation)) {
          return { elevation_ft: Number(elevation) };
        }
      }
    }
  } catch (e) {
    // Fall through to next source
  }

  // Fallback 1: OpenTopoData (free, SRTM data)
  try {
    const url = `https://api.opentopodata.org/v1/srtm90m?locations=${lat},${lon}`;
    const res = await fetchWithTimeout(url, null, 8000);
    if (res.ok && res.data) {
      const data = JSON.parse(res.data);
      const elevMeters = data?.results?.[0]?.elevation;
      if (elevMeters != null && !isNaN(elevMeters)) {
        return { elevation_ft: Math.round(elevMeters * 3.28084 * 10) / 10 };
      }
    }
  } catch (e) {
    // Fall through to next source
  }

  // Fallback 2: Open-Meteo Elevation API
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
    const res = await fetchWithTimeout(url, null, 8000);
    if (res.ok && res.data) {
      const data = JSON.parse(res.data);
      const elevMeters = data?.elevation?.[0];
      if (elevMeters != null && !isNaN(elevMeters)) {
        return { elevation_ft: Math.round(elevMeters * 3.28084 * 10) / 10 };
      }
    }
  } catch (e) {
    // All sources failed
  }

  return null;
}

async function fetchHardinessZone(zipCode) {
  if (!zipCode) return null;
  try {
    const url = `https://phzmapi.org/${zipCode}.json`;
    const res = await fetchWithTimeout(url);
    if (!res.ok || !res.data) return null;

    const data = JSON.parse(res.data);
    if (!data?.zone) return null;

    return { hardiness_zone: data.zone, temp_range: data.temp_range || "" };
  } catch (e) {
    return null;
  }
}

async function fetchWetlands(lat, lon) {
  // FWS National Wetlands Inventory API endpoints are currently unavailable.
  // Return null gracefully — the UI will show "Fetch failed" for this field.
  return null;
}

async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=1&addressdetails=1`;
  const res = await fetchWithTimeout(url, null, 10000);
  if (!res.ok || !res.data) return null;
  const data = JSON.parse(res.data);
  if (!data || data.length === 0) return null;
  return data[0];
}

async function geocodeAddress(address) {
  try {
    // Nominatim can be picky about address format — try progressively simpler variants
    const cleaned = address.replace(/,\s*United States\s*$/i, "").replace(/,\s*USA\s*$/i, "");
    // Extract zip code and street number+name for fallback queries
    const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
    const zip = zipMatch ? zipMatch[1] : "";
    const streetMatch = address.match(/^(\d+\s+[A-Za-z0-9\s]+?(?:Road|Rd|Street|St|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd|Way|Court|Ct|Circle|Cir|Place|Pl|Highway|Hwy|Trail|Trl| Parkway|Pkwy)\b)/i);
    const street = streetMatch ? streetMatch[1].trim() : "";
    const variants = [
      cleaned,
      street && zip ? `${street}, ${zip}` : null,
      street ? street : null,
      zip ? zip : null,
    ].filter(Boolean);

    let result = null;
    for (const variant of variants) {
      if (!variant || variant.trim().length < 5) continue;
      result = await nominatimSearch(variant);
      if (result) break;
      await new Promise(r => setTimeout(r, 1100)); // respect Nominatim 1 req/sec limit
    }

    if (!result) return null;

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (isNaN(lat) || isNaN(lon)) return null;

    let zipCode = null;
    if (result.address?.postcode) {
      zipCode = result.address.postcode.split("-")[0].trim();
    }

    return {
      latitude: lat,
      longitude: lon,
      formatted_address: result.display_name,
      zipCode,
    };
  } catch (e) {
    return null;
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    let { lat, lon, zipCode, address } = body;

    // If address is provided (no coords), geocode it first
    let formattedAddress = null;
    if (address && (lat == null || lon == null)) {
      const geocoded = await geocodeAddress(address);
      if (!geocoded) {
        return Response.json({ error: "Could not find that address. Please check it and try again." }, { status: 400 });
      }
      lat = geocoded.latitude;
      lon = geocoded.longitude;
      zipCode = zipCode || geocoded.zipCode;
      formattedAddress = geocoded.formatted_address;
    }

    if (lat == null || lon == null) {
      return Response.json({ error: "Provide either an address, or lat and lon." }, { status: 400 });
    }

    const [soil, flood, elevation, hardiness, wetlands] = await Promise.all([
      fetchSoilSeries(lat, lon),
      fetchFloodZone(lat, lon),
      fetchElevation(lat, lon),
      fetchHardinessZone(zipCode),
      fetchWetlands(lat, lon),
    ]);

    return Response.json({
      coordinates: { lat, lon },
      formatted_address: formattedAddress,
      zipCode,
      soil_series: soil,
      flood_zone: flood,
      elevation,
      hardiness_zone: hardiness,
      wetlands,
      fetch_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}