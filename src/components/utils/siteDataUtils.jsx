/**
 * Site Data Utilities
 * Fetches soil, flood zone, elevation, hardiness zone, and wetlands data
 * for a given latitude/longitude (and zipCode for hardiness zone).
 * Each function returns null on failure rather than throwing.
 */

/**
 * Fetch soil series name from USDA Soil Data Access (SDA).
 * Uses SDA_Get_Mukey_from_intersection_with_WktWgs84 to find the mapunit key
 * at the point, then joins to mapunit to get the soil series/type name.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{soil_series: string} | null>}
 */
export async function fetchSoilSeries(lat, lon) {
  try {
    // Step 1: Get mukey from point intersection
    const pointWkt = `POINT(${lon} ${lat})`;
    const mukeyQuery = `SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${pointWkt}')`;

    const mukeyResponse = await fetch(
      "https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "json+column",
          query: mukeyQuery,
        }),
      }
    );

    if (!mukeyResponse.ok) return null;

    const mukeyData = await mukeyResponse.json();
    if (!mukeyData || !mukeyData.Table || mukeyData.Table.length === 0) {
      return null;
    }

    // Extract mukey values (first column of each row)
    const mukeys = mukeyData.Table.map((row) => row[0]).filter(Boolean);
    if (mukeys.length === 0) return null;

    // Step 2: Get muname (soil series name) from mapunit table
    const mukeyList = mukeys.map((k) => Number(k)).join(",");
    const munameQuery = `SELECT muname FROM mapunit WHERE mukey IN (${mukeyList})`;

    const munameResponse = await fetch(
      "https://sdmdataaccess.sc.egov.usda.gov/tabular/post.rest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "json+column",
          query: munameQuery,
        }),
      }
    );

    if (!munameResponse.ok) return null;

    const munameData = await munameResponse.json();
    if (!munameData || !munameData.Table || munameData.Table.length === 0) {
      return null;
    }

    const soilSeries = munameData.Table.map((row) => row[0]).filter(Boolean);
    if (soilSeries.length === 0) return null;

    return { soil_series: soilSeries[0] };
  } catch (error) {
    console.error("fetchSoilSeries error:", error);
    return null;
  }
}

/**
 * Fetch flood zone information from FEMA NFHL ArcGIS REST service.
 * Queries the flood zone layer with a point geometry to determine
 * if the point is in a floodplain and which zone it falls in.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{flood_zone: string, is_in_floodplain: boolean} | null>}
 */
export async function fetchFloodZone(lat, lon) {
  try {
    const baseUrl = "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer";

    // Identify the correct flood zone layer (the layer that contains flood zones)
    // Common layer names: "Flood Hazard Zones", "Special Flood Hazard Areas"
    const layersResponse = await fetch(`${baseUrl}/layers?f=json`);
    let floodZoneLayerId = 0; // default to first layer

    if (layersResponse.ok) {
      const layersData = await layersResponse.json();
      // Find the layer that contains flood zone information
      const floodLayer = (layersData.layers || []).find(
        (layer) =>
          layer.name?.toLowerCase().includes("flood hazard") ||
          layer.name?.toLowerCase().includes("special flood") ||
          layer.name?.toLowerCase().includes("sfha")
      );
      if (floodLayer) {
        floodZoneLayerId = floodLayer.id;
      }
    }

    // Query the flood zone layer with point geometry
    const queryUrl = `${baseUrl}/${floodZoneLayerId}/query`;
    const params = new URLSearchParams({
      geometry: `${lon},${lat}`,
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "FLD_ZONE,ZONE_SUBTY,FLD_ZONE_AR",
      returnGeometry: "false",
      f: "json",
    });

    const queryResponse = await fetch(`${queryUrl}?${params.toString()}`);
    if (!queryResponse.ok) return null;

    const queryData = await queryResponse.json();
    if (!queryData || queryData.error) return null;

    const features = queryData.features || [];
    if (features.length === 0) {
      return { flood_zone: "X (Outside Floodplain)", is_in_floodplain: false };
    }

    // Extract flood zone info from the first matching feature
    const attrs = features[0].attributes || {};
    const floodZone = attrs.FLD_ZONE || attrs.ZONE_SUBTY || "Unknown";
    // SFHA zones (A, AE, AH, AO, A99, AR, V, VE) are in the floodplain
    const sfhaZones = ["A", "AE", "AH", "AO", "A99", "AR", "V", "VE"];
    const isFloodplain = sfhaZones.some(
      (z) => floodZone.toUpperCase() === z || floodZone.toUpperCase().startsWith(z)
    );

    return { flood_zone: floodZone, is_in_floodplain: isFloodplain };
  } catch (error) {
    console.error("fetchFloodZone error:", error);
    return null;
  }
}

/**
 * Fetch elevation in feet from the USGS National Map EPQS service.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{elevation_ft: number} | null>}
 */
export async function fetchElevation(lat, lon) {
  try {
    const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Feet&wkid=4326`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.value || data.value.length === 0) return null;

    const elevation = data.value[0]?.elevation;
    if (elevation == null || isNaN(elevation)) return null;

    return { elevation_ft: Number(elevation) };
  } catch (error) {
    console.error("fetchElevation error:", error);
    return null;
  }
}

/**
 * Fetch USDA hardiness zone from a community-maintained mirror of official USDA data.
 * @param {string} zipCode - US ZIP code
 * @returns {Promise<{hardiness_zone: string, temp_range: string} | null>}
 */
export async function fetchHardinessZone(zipCode) {
  try {
    const url = `https://phzmapi.org/${zipCode}.json`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data.zone) return null;

    return {
      hardiness_zone: data.zone,
      temp_range: data.temp_range || "",
    };
  } catch (error) {
    // This is a community-maintained mirror, not a .gov source.
    // If unreachable, return null rather than failing the whole batch.
    console.error("fetchHardinessZone error:", error);
    return null;
  }
}

/**
 * Fetch wetlands information from the FWS National Wetlands Inventory.
 * Attempts the FWS-hosted ArcGIS REST service first, falling back to
 * the USGS-hosted mirror if the primary endpoint is unavailable.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{wetlands_present: boolean, wetland_type: string | null} | null>}
 */
export async function fetchWetlands(lat, lon) {
  const endpoints = [
    "https://fwspublicservices.wim.usgs.gov/server/rest/services/FWS_Wetlands/MapServer",
    "https://www.fws.gov/wetlands/arcgis/rest/services/FWS_Wetlands/MapServer",
  ];

  for (const baseUrl of endpoints) {
    try {
      // Identify the wetlands layer
      const layersResponse = await fetch(`${baseUrl}/layers?f=json`);
      if (!layersResponse.ok) continue;

      const layersData = await layersResponse.json();
      const layers = layersData.layers || [];
      if (layers.length === 0) continue;

      const wetlandLayerId = layers[0].id;

      // Query the wetlands layer with point geometry
      const queryUrl = `${baseUrl}/${wetlandLayerId}/query`;
      const params = new URLSearchParams({
        geometry: `${lon},${lat}`,
        geometryType: "esriGeometryPoint",
        spatialRel: "esriSpatialRelIntersects",
        outFields: "ATTRIBUTE,WETLAND_TYPE",
        returnGeometry: "false",
        f: "json",
      });

      const queryResponse = await fetch(`${queryUrl}?${params.toString()}`);
      if (!queryResponse.ok) continue;

      const queryData = await queryResponse.json();
      if (!queryData || queryData.error) continue;

      const features = queryData.features || [];
      if (features.length === 0) {
        return { wetlands_present: false, wetland_type: null };
      }

      const attrs = features[0].attributes || {};
      const wetlandType = attrs.WETLAND_TYPE || attrs.ATTRIBUTE || null;

      return { wetlands_present: true, wetland_type: wetlandType };
    } catch (error) {
      console.error(`fetchWetlands error (${baseUrl}):`, error);
      continue;
    }
  }

  return null;
}

/**
 * Fetch all site data in parallel. Returns a single merged object with
 * null for any individual fetch that failed, plus a fetch_timestamp.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} zipCode - US ZIP code (for hardiness zone lookup)
 * @returns {Promise<object>}
 */
export async function fetchAllSiteData(lat, lon, zipCode) {
  const [soil, flood, elevation, hardiness, wetlands] = await Promise.allSettled([
    fetchSoilSeries(lat, lon),
    fetchFloodZone(lat, lon),
    fetchElevation(lat, lon),
    fetchHardinessZone(zipCode),
    fetchWetlands(lat, lon),
  ]);

  return {
    soil_series: soil.status === "fulfilled" ? soil.value : null,
    flood_zone: flood.status === "fulfilled" ? flood.value : null,
    elevation: elevation.status === "fulfilled" ? elevation.value : null,
    hardiness_zone: hardiness.status === "fulfilled" ? hardiness.value : null,
    wetlands: wetlands.status === "fulfilled" ? wetlands.value : null,
    fetch_timestamp: new Date().toISOString(),
  };
}