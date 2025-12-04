import React from "react";
import { Polygon, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

// Color schemes for recommendations
const RECOMMENDATION_COLORS = [
  { bg: '#ef4444', light: 'rgba(239, 68, 68, 0.2)', text: 'text-red-700', border: 'border-red-500' },
  { bg: '#f97316', light: 'rgba(249, 115, 22, 0.2)', text: 'text-orange-700', border: 'border-orange-500' },
  { bg: '#eab308', light: 'rgba(234, 179, 8, 0.2)', text: 'text-yellow-700', border: 'border-yellow-500' },
  { bg: '#22c55e', light: 'rgba(34, 197, 94, 0.2)', text: 'text-green-700', border: 'border-green-500' },
  { bg: '#06b6d4', light: 'rgba(6, 182, 212, 0.2)', text: 'text-cyan-700', border: 'border-cyan-500' },
  { bg: '#3b82f6', light: 'rgba(59, 130, 246, 0.2)', text: 'text-blue-700', border: 'border-blue-500' },
  { bg: '#8b5cf6', light: 'rgba(139, 92, 246, 0.2)', text: 'text-purple-700', border: 'border-purple-500' },
  { bg: '#ec4899', light: 'rgba(236, 72, 153, 0.2)', text: 'text-pink-700', border: 'border-pink-500' },
  { bg: '#14b8a6', light: 'rgba(20, 184, 166, 0.2)', text: 'text-teal-700', border: 'border-teal-500' },
  { bg: '#a855f7', light: 'rgba(168, 85, 247, 0.2)', text: 'text-violet-700', border: 'border-violet-500' },
];

export { RECOMMENDATION_COLORS };

export default function ParcelDataLayer({
  drawingMode,
  showBoundary,
  showOrchards,
  showGardens,
  showWater,
  showInfrastructure,
  showRecommendationOverlays,
  propertyBoundary,
  orchards,
  gardens,
  waterResources,
  infrastructure,
  parsedRecommendations,
  selectedRecommendation,
  farmProfile
}) {
  if (drawingMode) return null;

  return (
    <>
      {/* Property Boundary */}
      {showBoundary && propertyBoundary && (
        <Polygon 
          positions={propertyBoundary} 
          pathOptions={{ 
            color: '#10b981', 
            fillColor: '#10b981',
            fillOpacity: 0.1,
            weight: 3 
          }} 
        />
      )}

      {/* AI Recommendation Overlays */}
      {showRecommendationOverlays && parsedRecommendations.map(rec => (
        <React.Fragment key={rec.number}>
          <Circle
            center={rec.location}
            radius={rec.radius}
            pathOptions={{
              color: rec.color.bg,
              fillColor: rec.color.bg,
              fillOpacity: selectedRecommendation?.number === rec.number ? 0.4 : 0.2,
              weight: selectedRecommendation?.number === rec.number ? 3 : 2
            }}
          />
          <Marker
            position={rec.location}
            icon={L.divIcon({
              html: `<div style="background-color: ${rec.color.bg}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 14px;">${rec.number}</div>`,
              className: '',
              iconSize: [32, 32]
            })}
          >
            <Popup>
              <div className="max-w-xs">
                <h3 className="font-semibold text-lg mb-2">{rec.number}. {rec.title}</h3>
                <p className="text-sm text-gray-700">{rec.description.slice(0, 150)}...</p>
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}

      {/* Orchards - Polygons */}
      {showOrchards && orchards.filter(o => o.polygon_coordinates).map(orchard => (
        <Polygon
          key={orchard.id}
          positions={JSON.parse(orchard.polygon_coordinates)}
          pathOptions={{
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.3,
            weight: 2
          }}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{orchard.orchard_name}</h3>
              <p className="text-sm">🍎 {orchard.fruit_type}</p>
              <p className="text-sm">{orchard.total_trees} trees</p>
            </div>
          </Popup>
        </Polygon>
      ))}
      {/* Orchards - Markers (no polygon) */}
      {showOrchards && orchards.filter(o => !o.polygon_coordinates && o.latitude && o.longitude).map(orchard => (
        <Marker
          key={orchard.id}
          position={[parseFloat(orchard.latitude), parseFloat(orchard.longitude)]}
          icon={L.divIcon({
            html: `<div style="background-color: #22c55e; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🍎</div>`,
            className: '',
            iconSize: [28, 28]
          })}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{orchard.orchard_name}</h3>
              <p className="text-sm">🍎 {orchard.fruit_type}</p>
              {orchard.total_trees && <p className="text-sm">{orchard.total_trees} trees</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Gardens - Polygons */}
      {showGardens && gardens.filter(g => g.polygon_coordinates).map(garden => (
        <Polygon
          key={garden.id}
          positions={JSON.parse(garden.polygon_coordinates)}
          pathOptions={{
            color: '#84cc16',
            fillColor: '#84cc16',
            fillOpacity: 0.3,
            weight: 2
          }}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{garden.plot_name}</h3>
              <p className="text-sm">🌱 {garden.plot_type}</p>
              {garden.area_sq_ft && <p className="text-sm">{garden.area_sq_ft} sq ft</p>}
            </div>
          </Popup>
        </Polygon>
      ))}
      {/* Gardens - Markers (no polygon) */}
      {showGardens && gardens.filter(g => !g.polygon_coordinates && g.latitude && g.longitude).map(garden => (
        <Marker
          key={garden.id}
          position={[parseFloat(garden.latitude), parseFloat(garden.longitude)]}
          icon={L.divIcon({
            html: `<div style="background-color: #84cc16; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🌱</div>`,
            className: '',
            iconSize: [28, 28]
          })}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{garden.plot_name}</h3>
              <p className="text-sm">🌱 {garden.plot_type}</p>
              {garden.area_sq_ft && <p className="text-sm">{garden.area_sq_ft} sq ft</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Water Resources - Polygons */}
      {showWater && waterResources.filter(w => w.polygon_coordinates).map(water => (
        <Polygon
          key={water.id}
          positions={JSON.parse(water.polygon_coordinates)}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.3,
            weight: 2
          }}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{water.resource_name}</h3>
              <p className="text-sm">💧 {water.resource_type}</p>
              {water.capacity_gallons && <p className="text-sm">{water.capacity_gallons} gallons</p>}
            </div>
          </Popup>
        </Polygon>
      ))}
      {/* Water Resources - Markers (no polygon) */}
      {showWater && waterResources.filter(w => !w.polygon_coordinates && w.latitude && w.longitude).map(water => (
        <Marker
          key={water.id}
          position={[parseFloat(water.latitude), parseFloat(water.longitude)]}
          icon={L.divIcon({
            html: `<div style="background-color: #3b82f6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">💧</div>`,
            className: '',
            iconSize: [28, 28]
          })}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{water.resource_name}</h3>
              <p className="text-sm">💧 {water.resource_type}</p>
              {water.capacity_gallons && <p className="text-sm">{water.capacity_gallons} gallons</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Infrastructure - Polygons */}
      {showInfrastructure && infrastructure.filter(i => i.polygon_coordinates).map(structure => (
        <Polygon
          key={structure.id}
          positions={JSON.parse(structure.polygon_coordinates)}
          pathOptions={{
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.3,
            weight: 2
          }}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{structure.structure_name}</h3>
              <p className="text-sm">🏠 {structure.structure_type}</p>
              {structure.dimensions && <p className="text-sm">{structure.dimensions}</p>}
            </div>
          </Popup>
        </Polygon>
      ))}
      {/* Infrastructure - Markers (no polygon) */}
      {showInfrastructure && infrastructure.filter(i => !i.polygon_coordinates && i.latitude && i.longitude).map(structure => (
        <Marker
          key={structure.id}
          position={[parseFloat(structure.latitude), parseFloat(structure.longitude)]}
          icon={L.divIcon({
            html: `<div style="background-color: #8b5cf6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏠</div>`,
            className: '',
            iconSize: [28, 28]
          })}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{structure.structure_name}</h3>
              <p className="text-sm">🏠 {structure.structure_type}</p>
              {structure.dimensions && <p className="text-sm">{structure.dimensions}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}