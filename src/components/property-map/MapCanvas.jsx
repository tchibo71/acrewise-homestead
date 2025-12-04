import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Map Controller Component
export function MapController({ 
  selectedRecommendation, 
  drawingMode, 
  drawMode, 
  drawingPoints, 
  setDrawingPoints, 
  freehandPath, 
  setFreehandPath 
}) {
  const [isMouseDown, setIsMouseDown] = useState(false);

  const map = useMapEvents({
    click(e) {
      if (drawingMode && drawMode === 'polygon') {
        const newPoint = [e.latlng.lat, e.latlng.lng];
        setDrawingPoints(prev => [...prev, newPoint]);
      }
    },
    mousedown(e) {
      if (drawingMode && drawMode === 'freehand') {
        setIsMouseDown(true);
        setFreehandPath([[e.latlng.lat, e.latlng.lng]]);
        setDrawingPoints([]);
      }
    },
    mousemove(e) {
      if (drawingMode && drawMode === 'freehand' && isMouseDown) {
        setFreehandPath(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
      }
    },
    mouseup(e) {
      if (drawingMode && drawMode === 'freehand' && isMouseDown) {
        setIsMouseDown(false);
        if (freehandPath.length >= 3) {
          setDrawingPoints(freehandPath);
        } else {
          setFreehandPath([]);
        }
      }
    },
  });
  
  useEffect(() => {
    if (selectedRecommendation && selectedRecommendation.location) {
      map.setView(selectedRecommendation.location, 18, { animate: true });
    }
  }, [selectedRecommendation, map]);

  useEffect(() => {
    if (drawingMode) {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
    } else {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
    }
  }, [drawingMode, map]);
  
  return null;
}

// Drawing Preview Component
export function DrawingPreview({ drawingMode, drawMode, drawingPoints, freehandPath, previewPolygon, shapeType }) {
  if (!drawingMode) return null;

  return (
    <>
      {drawMode === 'freehand' && freehandPath.length > 0 && (
        <Polyline 
          positions={freehandPath} 
          pathOptions={{ 
            color: '#3b82f6', 
            weight: 3
          }} 
        />
      )}
      {drawMode === 'polygon' && (shapeType ? previewPolygon : drawingPoints).length > 0 && (
        <Polygon 
          positions={shapeType ? previewPolygon : drawingPoints} 
          pathOptions={{ 
            color: '#3b82f6', 
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            weight: 3,
            dashArray: '10, 10'
          }} 
        />
      )}
      {drawMode === 'polygon' && !shapeType && drawingPoints.map((point, idx) => (
        <Marker key={idx} position={point}>
          <Popup>Point {idx + 1}</Popup>
        </Marker>
      ))}
    </>
  );
}

// Main Map Canvas Component
export default function MapCanvas({
  center,
  drawingMode,
  weatherData,
  farmProfile,
  children
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="w-full h-[600px] rounded-lg overflow-hidden">
          {center && (
            <MapContainer
              center={center}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              dragging={!drawingMode}
              doubleClickZoom={!drawingMode}
              scrollWheelZoom={!drawingMode}
              touchZoom={!drawingMode}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; Esri'
              />
              
              {/* Main Property Marker */}
              {!drawingMode && (
                <Marker position={center}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold">Property Center</p>
                      {farmProfile?.total_acreage && (
                        <p className="text-sm font-bold text-green-700 mt-1">
                          {farmProfile.total_acreage} acres
                        </p>
                      )}
                      {weatherData && (
                        <>
                          <p className="text-2xl font-bold mt-2">
                            {Math.round(weatherData.values.temperature)}°F
                          </p>
                          <p className="text-sm text-gray-600">
                            {weatherData.values.humidity}% humidity
                          </p>
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {children}
            </MapContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}