import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import {
  Map as MapIcon,
  MapPin,
  Sparkles,
  Crown,
  Download,
  X,
  Target,
  Save,
  Loader2,
  Mountain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import { fetchCurrentWeather } from "@/components/utils/weatherUtils";
import { calculatePolygonCenter, calculateAreaInAcres } from "@/components/utils/mapboxConfig";
import { fetchAllSiteData } from "@/components/utils/siteDataUtils";
import PaywallModal from "../components/paywall/PaywallModal";

// Import refactored components
import MapCanvas, { MapController, DrawingPreview } from "../components/property-map/MapCanvas";
import ParcelDataLayer, { RECOMMENDATION_COLORS } from "../components/property-map/ParcelDataLayer";
import MapControlPanel from "../components/property-map/MapControlPanel";

// Generate rotatable shapes
const generateRotatableShape = (points, shapeType, rotation = 0) => {
  if (points.length < 2) return [];

  const p1 = points[0];
  const p2 = points[1];

  let baseShapePoints = [];
  let geometricCenter = [ (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2 ];

  if (shapeType === 'square' || shapeType === 'rectangle') {
    const minLat = Math.min(p1[0], p2[0]);
    const maxLat = Math.max(p1[0], p2[0]);
    const minLng = Math.min(p1[1], p2[1]);
    const maxLng = Math.max(p1[1], p2[1]);

    let height = maxLat - minLat;
    let width = maxLng - minLng;

    if (shapeType === 'square') {
      const side = Math.max(height, width);
      height = side;
      width = side;
    }
    
    const halfHeight = height / 2;
    const halfWidth = width / 2;

    baseShapePoints = [
      [geometricCenter[0] - halfHeight, geometricCenter[1] - halfWidth],
      [geometricCenter[0] - halfHeight, geometricCenter[1] + halfWidth],
      [geometricCenter[0] + halfHeight, geometricCenter[1] + halfWidth],
      [geometricCenter[0] + halfHeight, geometricCenter[1] - halfWidth],
    ];

  } else if (shapeType === 'triangle') {
    const midLat = (p1[0] + p2[0]) / 2;
    const midLng = (p1[1] + p2[1]) / 2;
    const height = Math.abs(p2[0] - p1[0]);
    const baseWidth = Math.abs(p2[1] - p1[1]) * 2;

    const topVertex = [midLat - height / 2, midLng];
    const bottomLeftVertex = [midLat + height / 2, midLng - baseWidth / 2];
    const bottomRightVertex = [midLat + height / 2, midLng + baseWidth / 2];

    baseShapePoints = [topVertex, bottomRightVertex, bottomLeftVertex];
    geometricCenter = [
        (topVertex[0] + bottomLeftVertex[0] + bottomRightVertex[0]) / 3,
        (topVertex[1] + bottomLeftVertex[1] + bottomRightVertex[1]) / 3
    ];
    
  } else if (shapeType === 'circle') {
    const radius = Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)
    );
    
    const numPoints = 32;
    for (let i = 0; i < numPoints; i++) {
      const currentAngle = (i / numPoints) * 2 * Math.PI;
      const lat = p1[0] + radius * Math.cos(currentAngle);
      const lng = p1[1] + radius * Math.sin(currentAngle);
      baseShapePoints.push([lat, lng]);
    }
    return baseShapePoints;
  }
  
  const angleRad = (rotation * Math.PI) / 180;
  return baseShapePoints.map(point => {
    const dLat = point[0] - geometricCenter[0];
    const dLng = point[1] - geometricCenter[1];
    return [
      geometricCenter[0] + dLat * Math.cos(angleRad) - dLng * Math.sin(angleRad),
      geometricCenter[1] + dLat * Math.sin(angleRad) + dLng * Math.cos(angleRad)
    ];
  });
};

// Parse AI recommendations
const parseRecommendations = (text, farmProfile) => {
  if (!text || !farmProfile?.grid_coordinates) return [];
  
  const [centerLat, centerLng] = farmProfile.grid_coordinates.split(',').map(c => parseFloat(c.trim()));
  
  const lines = text.split('\n');
  const recommendations = [];
  let currentRec = null;
  
  lines.forEach(line => {
    const match = line.match(/^(\d+)\.\s*(.+)/);
    if (match) {
      if (currentRec) {
        recommendations.push(currentRec);
      }
      
      const number = parseInt(match[1]);
      const title = match[2];
      
      const angle = (number - 1) * (360 / 10);
      const radiusKm = 0.0005;
      const latOffset = radiusKm * Math.cos(angle * Math.PI / 180);
      const lngOffset = radiusKm * Math.sin(angle * Math.PI / 180);
      
      currentRec = {
        number: number,
        title: title.trim(),
        description: '',
        location: [centerLat + latOffset, centerLng + lngOffset],
        color: RECOMMENDATION_COLORS[(number - 1) % RECOMMENDATION_COLORS.length],
        radius: 30 + (number * 2)
      };
    } else if (currentRec && line.trim()) {
      currentRec.description += line.trim() + ' ';
    }
  });
  
  if (currentRec) {
    recommendations.push(currentRec);
  }
  
  return recommendations;
};

export default function PropertyMap() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // UI State
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [parsedRecommendations, setParsedRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [showRecommendationOverlays, setShowRecommendationOverlays] = useState(true);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawMode, setDrawMode] = useState('polygon');
  const [shapeType, setShapeType] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [freehandPath, setFreehandPath] = useState([]);
  const [propertyBoundary, setPropertyBoundary] = useState(null);
  
  // Feature creation
  const [drawingFeatureType, setDrawingFeatureType] = useState(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [featureFormData, setFeatureFormData] = useState({});
  const [fetchingSiteData, setFetchingSiteData] = useState(false);
  const [siteDataError, setSiteDataError] = useState(null);
  
  // Layer visibility
  const [showBoundary, setShowBoundary] = useState(true);
  const [showOrchards, setShowOrchards] = useState(true);
  const [showGardens, setShowGardens] = useState(true);
  const [showWater, setShowWater] = useState(true);
  const [showInfrastructure, setShowInfrastructure] = useState(true);

  // Data queries
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: farmProfile, refetch: refetchFarmProfile } = useQuery({
    queryKey: ['farm-profile'],
    queryFn: async () => {
      const profiles = await base44.entities.FarmProfile.list();
      return profiles[0] || null;
    },
    enabled: subscriptionData.isPro
  });

  const { data: orchards = [], refetch: refetchOrchards } = useQuery({
    queryKey: ['orchards'],
    queryFn: () => base44.entities.Orchard.list(),
    enabled: subscriptionData.isPro
  });

  const { data: gardens = [], refetch: refetchGardens } = useQuery({
    queryKey: ['garden-plots'],
    queryFn: () => base44.entities.GardenPlot.list(),
    enabled: subscriptionData.isPro
  });

  const { data: waterResources = [], refetch: refetchWater } = useQuery({
    queryKey: ['water-resources'],
    queryFn: () => base44.entities.WaterResource.list(),
    enabled: subscriptionData.isPro
  });

  const { data: infrastructure = [], refetch: refetchInfrastructure } = useQuery({
    queryKey: ['infrastructure'],
    queryFn: () => base44.entities.Infrastructure.list(),
    enabled: subscriptionData.isPro
  });

  const { data: weatherData } = useQuery({
    queryKey: ['weather-current', farmProfile?.grid_coordinates],
    queryFn: async () => {
      if (!farmProfile?.grid_coordinates) return null;
      const [lat, lng] = farmProfile.grid_coordinates.split(',').map(c => parseFloat(c.trim()));
      return await fetchCurrentWeather(lat, lng);
    },
    enabled: !!(farmProfile?.grid_coordinates && subscriptionData.isPro),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Load property boundary from farm profile
  useEffect(() => {
    if (farmProfile?.infrastructure) {
      const boundaryData = farmProfile.infrastructure.find(i => i.type === 'property_boundary');
      if (boundaryData?.coordinates) {
        try {
          const coords = JSON.parse(boundaryData.coordinates);
          setPropertyBoundary(coords);
        } catch (e) {
          console.error("Failed to parse boundary coordinates", e);
        }
      }
    }
  }, [farmProfile]);

  // Mutations
  const updateFarmProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (farmProfile) {
        return await base44.entities.FarmProfile.update(farmProfile.id, data);
      } else {
        return await base44.entities.FarmProfile.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-profile'] });
      refetchFarmProfile();
    },
  });

  const createOrchardMutation = useMutation({
    mutationFn: (data) => base44.entities.Orchard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchards'] });
      refetchOrchards();
    },
  });

  const createGardenMutation = useMutation({
    mutationFn: (data) => base44.entities.GardenPlot.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden-plots'] });
      refetchGardens();
    },
  });

  const createWaterMutation = useMutation({
    mutationFn: (data) => base44.entities.WaterResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water-resources'] });
      refetchWater();
    },
  });

  const createInfrastructureMutation = useMutation({
    mutationFn: (data) => base44.entities.Infrastructure.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      refetchInfrastructure();
    },
  });

  // Drawing handlers
  const handleStartDrawing = (featureType, mode, shape = null) => {
    setDrawingMode(true);
    setDrawingFeatureType(featureType);
    setDrawMode(mode);
    setShapeType(shape);
    setDrawingPoints([]);
    setFreehandPath([]);
    setRotation(0);
  };

  const handleFinishDrawing = () => {
    let finalCoordinates = drawingPoints;
    
    if (shapeType && drawingPoints.length >= 2) {
      finalCoordinates = generateRotatableShape(drawingPoints, shapeType, rotation);
    } else if (drawMode === 'freehand' && freehandPath.length > 0) {
      finalCoordinates = freehandPath;
    }
    
    if (finalCoordinates.length < 3) {
      alert("Please draw at least 3 points to create a valid polygon.");
      return;
    }
    
    setFeatureFormData({ coordinates: finalCoordinates });
    setShowFeatureModal(true);
  };

  const handleSaveFeature = async () => {
    const { coordinates, ...formData } = featureFormData;
    
    if (drawingFeatureType === 'boundary') {
      const center = calculatePolygonCenter(coordinates);
      const acres = calculateAreaInAcres(coordinates);
      
      const updatedInfrastructure = [
        ...(farmProfile?.infrastructure || []).filter(i => i.type !== 'property_boundary'),
        {
          type: 'property_boundary',
          coordinates: JSON.stringify(coordinates),
          description: 'Property boundary'
        }
      ];

      await updateFarmProfileMutation.mutateAsync({
        farm_name: farmProfile?.farm_name || 'My Farm',
        grid_coordinates: `${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`,
        total_acreage: parseFloat(acres.toFixed(2)),
        infrastructure: updatedInfrastructure
      });

      await base44.auth.updateMe({
        property_latitude: center.latitude,
        property_longitude: center.longitude
      });

      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setPropertyBoundary(coordinates);
      
    } else if (drawingFeatureType === 'orchard') {
      const center = calculatePolygonCenter(coordinates);
      const acres = calculateAreaInAcres(coordinates);
      
      await createOrchardMutation.mutateAsync({
        ...formData,
        latitude: center.latitude,
        longitude: center.longitude,
        area_acres: parseFloat(acres.toFixed(2)),
        polygon_coordinates: JSON.stringify(coordinates)
      });
      
    } else if (drawingFeatureType === 'garden') {
      const center = calculatePolygonCenter(coordinates);
      const acres = calculateAreaInAcres(coordinates);
      
      await createGardenMutation.mutateAsync({
        ...formData,
        latitude: center.latitude,
        longitude: center.longitude,
        area_sq_ft: parseFloat((acres * 43560).toFixed(2)),
        polygon_coordinates: JSON.stringify(coordinates)
      });
      
    } else if (drawingFeatureType === 'water') {
      const center = calculatePolygonCenter(coordinates);
      
      await createWaterMutation.mutateAsync({
        ...formData,
        latitude: center.latitude,
        longitude: center.longitude,
        polygon_coordinates: JSON.stringify(coordinates)
      });
      
    } else if (drawingFeatureType === 'infrastructure') {
      const center = calculatePolygonCenter(coordinates);
      
      await createInfrastructureMutation.mutateAsync({
        ...formData,
        latitude: center.latitude,
        longitude: center.longitude,
        polygon_coordinates: JSON.stringify(coordinates)
      });
    }
    
    // Reset drawing
    setDrawingMode(false);
    setDrawingPoints([]);
    setFreehandPath([]);
    setShowFeatureModal(false);
    setFeatureFormData({});
    setDrawingFeatureType(null);
    setShapeType(null);
  };

  const handleUndoLastPoint = () => {
    if (drawMode === 'polygon') {
      setDrawingPoints(prev => prev.slice(0, -1));
    }
  };

  const handleCancelDrawing = () => {
    setDrawingMode(false);
    setDrawingPoints([]);
    setFreehandPath([]);
    setShapeType(null);
    setDrawingFeatureType(null);
    setRotation(0);
    setShowFeatureModal(false);
    setFeatureFormData({});
    setSiteDataError(null);
  };

  // Fetch site data (soil, flood zone, hardiness, wetlands) for a garden plot
  const handleFetchGardenSiteData = async () => {
    const coords = featureFormData.coordinates;
    if (!coords || coords.length < 3) return;

    const center = calculatePolygonCenter(coords);
    const lat = center.latitude;
    const lng = center.longitude;

    setFetchingSiteData(true);
    setSiteDataError(null);

    try {
      const result = await fetchAllSiteData(lat, lng);

      const updates = {};

      // Soil type - confirm overwrite if user already entered a value
      if (result.soil_series?.soil_series) {
        const fetchedSoil = result.soil_series.soil_series;
        const existing = featureFormData.soil_type;
        if (existing && existing.trim()) {
          if (window.confirm(`Fetched soil type: "${fetchedSoil}". Overwrite existing soil type "${existing}"?`)) {
            updates.soil_type = fetchedSoil;
          }
        } else {
          updates.soil_type = fetchedSoil;
        }
      }

      // Hardiness zone, flood zone, wetlands - populate directly
      if (result.hardiness_zone?.hardiness_zone) {
        updates.hardiness_zone = result.hardiness_zone.hardiness_zone;
      }
      if (result.flood_zone?.flood_zone) {
        updates.flood_zone = result.flood_zone.flood_zone;
      }
      if (result.wetlands) {
        updates.wetlands_present = result.wetlands.wetlands_present;
      }

      updates.site_data_fetched_date = new Date().toISOString().split('T')[0];

      setFeatureFormData(prev => ({ ...prev, ...updates }));
    } catch (error) {
      setSiteDataError('Failed to fetch site data. Please try again.');
    } finally {
      setFetchingSiteData(false);
    }
  };

  // AI handlers
  const generateAIRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const weatherInfo = weatherData ? `Temperature: ${Math.round(weatherData.values.temperature)}°F, Humidity: ${weatherData.values.humidity}%` : "No weather data";
      
      const prompt = `As an expert permaculture designer and farm planner, analyze this property and provide exactly 10 numbered recommendations:

Property Information:
- Total Acreage: ${farmProfile?.total_acreage || 'Unknown'}
- GPS Coordinates: ${farmProfile?.grid_coordinates || 'Unknown'}
- Current Weather: ${weatherInfo}
- Existing Features: ${orchards.length} orchards, ${gardens.length} gardens, ${waterResources.length} water resources, ${infrastructure.length} structures

Provide exactly 10 detailed recommendations for:
1. Optimal property layout and zoning
2. Water management strategies
3. Windbreak placement
4. Pasture rotation
5. Orchard design
6. Garden placement
7. Infrastructure location
8. Erosion control
9. Access roads
10. Solar orientation

Format as numbered list with detailed explanations for each.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      return result;
    },
    onSuccess: (data) => {
      setAiRecommendations(data);
      const parsed = parseRecommendations(data, farmProfile);
      setParsedRecommendations(parsed);
      setLoadingAI(false);
    },
    onError: () => {
      setLoadingAI(false);
    }
  });

  const handleGenerateAI = () => {
    setLoadingAI(true);
    setShowAIModal(true);
    generateAIRecommendationsMutation.mutate();
  };

  const handleRecommendationClick = (rec) => {
    setSelectedRecommendation(selectedRecommendation?.number === rec.number ? null : rec);
  };

  const handleExportMap = () => {
    const exportData = {
      farmProfile,
      propertyBoundary,
      orchards,
      gardens,
      waterResources,
      infrastructure,
      weather: weatherData,
      recommendations: parsedRecommendations
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-map-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Paywall for non-pro users
  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Interactive Property Mapping</h1>
              <p className="text-gray-600 mt-1">Powered by Leaflet & Tomorrow.io Weather</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Interactive Mapping is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upgrade to access professional property mapping with satellite imagery, automatic GPS & acreage calculation, weather overlays, and AI-powered recommendations
              </p>

              <div className="max-w-md mx-auto mb-8 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">With Pro Mapping, you get:</h3>
                <ul className="space-y-3 text-left">
                  {[
                    "Draw property boundaries with multiple shape options",
                    "Automatic GPS coordinates calculation",
                    "Automatic acreage calculation",
                    "Mark orchards, gardens, and infrastructure",
                    "Real-time weather overlay integration",
                    "AI-powered layout recommendations",
                    "Color-coded recommendation zones",
                    "Export maps and data"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Interactive property mapping"
          />
        </div>
      </div>
    );
  }

  const center = farmProfile?.grid_coordinates 
    ? farmProfile.grid_coordinates.split(',').map(c => parseFloat(c.trim()))
    : user?.property_latitude && user?.property_longitude
    ? [parseFloat(user.property_latitude), parseFloat(user.property_longitude)]
    : [39.8283, -98.5795];

  // Calculate current drawing preview
  let previewPolygon = drawingPoints;
  if (shapeType && drawingPoints.length >= 2) {
    previewPolygon = generateRotatableShape(drawingPoints, shapeType, rotation);
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Interactive Property Map</h1>
              <p className="text-gray-600 mt-1">
                {farmProfile?.total_acreage ? `${farmProfile.total_acreage} acres • ` : ''}
                {orchards.length} orchards • {gardens.length} gardens • {waterResources.length} water • {infrastructure.length} structures
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!drawingMode && (
              <>
                <Button
                  variant="outline"
                  onClick={handleGenerateAI}
                  disabled={loadingAI || !farmProfile?.grid_coordinates}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loadingAI ? "Generating..." : "AI Recommendations"}
                </Button>
                <Button variant="outline" onClick={handleExportMap}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Map Control Panel */}
        <MapControlPanel
          drawingMode={drawingMode}
          drawMode={drawMode}
          shapeType={shapeType}
          drawingFeatureType={drawingFeatureType}
          drawingPoints={drawingPoints}
          freehandPath={freehandPath}
          rotation={rotation}
          setRotation={setRotation}
          showBoundary={showBoundary}
          setShowBoundary={setShowBoundary}
          showOrchards={showOrchards}
          setShowOrchards={setShowOrchards}
          showGardens={showGardens}
          setShowGardens={setShowGardens}
          showWater={showWater}
          setShowWater={setShowWater}
          showInfrastructure={showInfrastructure}
          setShowInfrastructure={setShowInfrastructure}
          showRecommendationOverlays={showRecommendationOverlays}
          setShowRecommendationOverlays={setShowRecommendationOverlays}
          parsedRecommendations={parsedRecommendations}
          orchards={orchards}
          gardens={gardens}
          waterResources={waterResources}
          infrastructure={infrastructure}
          weatherData={weatherData}
          onStartDrawing={handleStartDrawing}
          onFinishDrawing={handleFinishDrawing}
          onUndoLastPoint={handleUndoLastPoint}
          onCancelDrawing={handleCancelDrawing}
        />

        {farmProfile?.grid_coordinates && farmProfile?.total_acreage && !drawingMode && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-green-900 font-semibold">Property Data Calculated</p>
                  <p className="text-xs text-green-800 mt-1">
                    GPS: {farmProfile.grid_coordinates} • Area: {farmProfile.total_acreage} acres
                  </p>
                </div>
                <Badge className="bg-green-600 text-white">
                  <MapPin className="w-3 h-3 mr-1" />
                  Auto-Generated
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <MapCanvas
              center={center}
              drawingMode={drawingMode}
              weatherData={weatherData}
              farmProfile={farmProfile}
            >
              <MapController
                selectedRecommendation={selectedRecommendation}
                drawingMode={drawingMode}
                drawMode={drawMode}
                drawingPoints={drawingPoints}
                setDrawingPoints={setDrawingPoints}
                freehandPath={freehandPath}
                setFreehandPath={setFreehandPath}
              />
              
              <DrawingPreview
                drawingMode={drawingMode}
                drawMode={drawMode}
                drawingPoints={drawingPoints}
                freehandPath={freehandPath}
                previewPolygon={previewPolygon}
                shapeType={shapeType}
              />
              
              <ParcelDataLayer
                drawingMode={drawingMode}
                showBoundary={showBoundary}
                showOrchards={showOrchards}
                showGardens={showGardens}
                showWater={showWater}
                showInfrastructure={showInfrastructure}
                showRecommendationOverlays={showRecommendationOverlays}
                propertyBoundary={propertyBoundary}
                orchards={orchards}
                gardens={gardens}
                waterResources={waterResources}
                infrastructure={infrastructure}
                parsedRecommendations={parsedRecommendations}
                selectedRecommendation={selectedRecommendation}
                farmProfile={farmProfile}
              />
            </MapCanvas>
          </div>

          {/* Recommendations Sidebar */}
          <div className="space-y-6">
            {parsedRecommendations.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    AI Recommendations
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Click to highlight on map</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {parsedRecommendations.map(rec => (
                      <div
                        key={rec.number}
                        onClick={() => handleRecommendationClick(rec)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${rec.color.border} ${
                          selectedRecommendation?.number === rec.number
                            ? 'shadow-lg scale-105 bg-white'
                            : 'hover:shadow-md bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: selectedRecommendation?.number === rec.number ? 'white' : rec.color.light
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ backgroundColor: rec.color.bg }}
                          >
                            {rec.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm ${rec.color.text} mb-1`}>
                              {rec.title}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">No Recommendations Yet</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {!farmProfile?.grid_coordinates 
                      ? "Draw your property boundary first to generate recommendations"
                      : "Generate AI recommendations to see color-coded zones on your property map"
                    }
                  </p>
                  {farmProfile?.grid_coordinates && !drawingMode && (
                    <Button onClick={handleGenerateAI} disabled={loadingAI}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Recommendations
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Property Stats */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-lg">Property Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {farmProfile?.total_acreage ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Area</span>
                      <span className="font-bold text-green-700">{farmProfile.total_acreage} acres</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">GPS Center</span>
                      <span className="font-mono text-xs text-gray-700">{farmProfile.grid_coordinates}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Draw property boundary to calculate stats</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Orchards</span>
                  <span className="font-bold text-emerald-700">{orchards.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Water Sources</span>
                  <span className="font-bold text-blue-700">{waterResources.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Structures</span>
                  <span className="font-bold text-purple-700">{infrastructure.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Detail Modal */}
        {showFeatureModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Add {drawingFeatureType} Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {drawingFeatureType === 'orchard' && (
                  <>
                    <div>
                      <Label htmlFor="orchard_name">Orchard Name *</Label>
                      <Input
                        id="orchard_name"
                        value={featureFormData.orchard_name || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, orchard_name: e.target.value})}
                        placeholder="e.g., North Apple Orchard"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fruit_type">Fruit Type *</Label>
                      <Select
                        value={featureFormData.fruit_type || ''}
                        onValueChange={(value) => setFeatureFormData({...featureFormData, fruit_type: value})}
                      >
                        <SelectTrigger id="fruit_type"><SelectValue placeholder="Select fruit type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apple">Apple</SelectItem>
                          <SelectItem value="pear">Pear</SelectItem>
                          <SelectItem value="peach">Peach</SelectItem>
                          <SelectItem value="cherry">Cherry</SelectItem>
                          <SelectItem value="plum">Plum</SelectItem>
                          <SelectItem value="citrus">Citrus</SelectItem>
                          <SelectItem value="nut_tree">Nut Tree</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="total_trees">Total Trees</Label>
                      <Input
                        id="total_trees"
                        type="number"
                        value={featureFormData.total_trees || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, total_trees: parseInt(e.target.value)})}
                        placeholder="Number of trees"
                      />
                    </div>
                  </>
                )}

                {drawingFeatureType === 'garden' && (
                  <>
                    <div>
                      <Label htmlFor="plot_name">Garden Plot Name *</Label>
                      <Input
                        id="plot_name"
                        value={featureFormData.plot_name || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, plot_name: e.target.value})}
                        placeholder="e.g., Main Vegetable Garden"
                      />
                    </div>
                    <div>
                      <Label htmlFor="plot_type">Plot Type *</Label>
                      <Select
                        value={featureFormData.plot_type || ''}
                        onValueChange={(value) => setFeatureFormData({...featureFormData, plot_type: value})}
                      >
                        <SelectTrigger id="plot_type"><SelectValue placeholder="Select plot type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="raised_bed">Raised Bed</SelectItem>
                          <SelectItem value="in_ground">In Ground</SelectItem>
                          <SelectItem value="container">Container</SelectItem>
                          <SelectItem value="greenhouse">Greenhouse</SelectItem>
                          <SelectItem value="hoop_house">Hoop House</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Auto-calculated GPS coordinates from polygon */}
                    {featureFormData.coordinates && featureFormData.coordinates.length >= 3 && (() => {
                      const center = calculatePolygonCenter(featureFormData.coordinates);
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Latitude</Label>
                            <Input value={center.latitude.toFixed(6)} readOnly className="bg-gray-50" />
                          </div>
                          <div>
                            <Label>Longitude</Label>
                            <Input value={center.longitude.toFixed(6)} readOnly className="bg-gray-50" />
                          </div>
                        </div>
                      );
                    })()}
                    {/* Soil type (reused for fetched soil series) */}
                    <div>
                      <Label htmlFor="soil_type">Soil Type</Label>
                      <Input
                        id="soil_type"
                        value={featureFormData.soil_type || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, soil_type: e.target.value})}
                        placeholder="e.g., Clay loam, Sandy loam"
                      />
                    </div>
                    {/* Fetch Site Data button */}
                    {(() => {
                      const hasCoords = featureFormData.coordinates && featureFormData.coordinates.length >= 3;
                      return (
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!hasCoords || fetchingSiteData}
                            onClick={handleFetchGardenSiteData}
                            title={!hasCoords ? "Draw the plot on the map first to set latitude and longitude" : ""}
                            className="w-full"
                          >
                            {fetchingSiteData ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Fetching Site Data...
                              </>
                            ) : (
                              <>
                                <Mountain className="w-4 h-4 mr-2" />
                                Fetch Site Data for This Plot
                              </>
                            )}
                          </Button>
                          {siteDataError && (
                            <p className="text-sm text-red-600 mt-1">{siteDataError}</p>
                          )}
                          {featureFormData.site_data_fetched_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Site data last fetched: {new Date(featureFormData.site_data_fetched_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    {/* Display fetched site data */}
                    {(featureFormData.hardiness_zone || featureFormData.flood_zone || featureFormData.wetlands_present !== undefined) && (
                      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-semibold text-cyan-900">Fetched Site Data</p>
                        {featureFormData.hardiness_zone && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Hardiness Zone:</span>
                            <span className="font-medium text-cyan-800">{featureFormData.hardiness_zone}</span>
                          </div>
                        )}
                        {featureFormData.flood_zone && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Flood Zone:</span>
                            <span className="font-medium text-cyan-800">{featureFormData.flood_zone}</span>
                          </div>
                        )}
                        {featureFormData.wetlands_present !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Wetlands Present:</span>
                            <span className="font-medium text-cyan-800">{featureFormData.wetlands_present ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {drawingFeatureType === 'water' && (
                  <>
                    <div>
                      <Label htmlFor="resource_name">Water Resource Name *</Label>
                      <Input
                        id="resource_name"
                        value={featureFormData.resource_name || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, resource_name: e.target.value})}
                        placeholder="e.g., Main Pond"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resource_type">Resource Type *</Label>
                      <Select
                        value={featureFormData.resource_type || ''}
                        onValueChange={(value) => setFeatureFormData({...featureFormData, resource_type: value})}
                      >
                        <SelectTrigger id="resource_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="well">Well</SelectItem>
                          <SelectItem value="pond">Pond</SelectItem>
                          <SelectItem value="stream">Stream</SelectItem>
                          <SelectItem value="spring">Spring</SelectItem>
                          <SelectItem value="rainwater_collection">Rainwater Collection</SelectItem>
                          <SelectItem value="irrigation_ditch">Irrigation Ditch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="capacity_gallons">Capacity (gallons)</Label>
                      <Input
                        id="capacity_gallons"
                        type="number"
                        value={featureFormData.capacity_gallons || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, capacity_gallons: parseInt(e.target.value)})}
                        placeholder="Total capacity"
                      />
                    </div>
                  </>
                )}

                {drawingFeatureType === 'infrastructure' && (
                  <>
                    <div>
                      <Label htmlFor="structure_name">Structure Name *</Label>
                      <Input
                        id="structure_name"
                        value={featureFormData.structure_name || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, structure_name: e.target.value})}
                        placeholder="e.g., Main Barn"
                      />
                    </div>
                    <div>
                      <Label htmlFor="structure_type">Structure Type *</Label>
                      <Select
                        value={featureFormData.structure_type || ''}
                        onValueChange={(value) => setFeatureFormData({...featureFormData, structure_type: value})}
                      >
                        <SelectTrigger id="structure_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barn">Barn</SelectItem>
                          <SelectItem value="greenhouse">Greenhouse</SelectItem>
                          <SelectItem value="shed">Shed</SelectItem>
                          <SelectItem value="coop">Coop</SelectItem>
                          <SelectItem value="garage">Garage</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="storage">Storage Building</SelectItem>
                          <SelectItem value="fence">Fence</SelectItem>
                          <SelectItem value="gate">Gate</SelectItem>
                          <SelectItem value="road">Road/Driveway</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        value={featureFormData.dimensions || ''}
                        onChange={(e) => setFeatureFormData({...featureFormData, dimensions: e.target.value})}
                        placeholder="e.g., 40x60 ft"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={handleCancelDrawing}>Cancel</Button>
                  <Button 
                    onClick={handleSaveFeature}
                    disabled={
                      drawingFeatureType === 'orchard' && !featureFormData.orchard_name ||
                      drawingFeatureType === 'garden' && !featureFormData.plot_name ||
                      drawingFeatureType === 'water' && !featureFormData.resource_name ||
                      drawingFeatureType === 'infrastructure' && !featureFormData.structure_name
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save {drawingFeatureType}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Response Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Property Planning Recommendations
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowAIModal(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAI ? (
                  <div className="py-12 text-center">
                    <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Analyzing your property and generating recommendations...</p>
                  </div>
                ) : aiRecommendations ? (
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">{aiRecommendations}</div>
                  </div>
                ) : (
                  <p className="text-gray-600">Failed to generate recommendations. Please try again.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}