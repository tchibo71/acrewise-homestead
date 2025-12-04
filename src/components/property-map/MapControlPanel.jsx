import React from "react";
import {
  Layers,
  MapPin,
  Droplets,
  Sprout,
  Home as HomeIcon,
  Cloud,
  Plus,
  Edit3,
  Hand,
  Square,
  Circle as CircleIcon,
  Maximize2,
  AlertCircle,
  Undo,
  X,
  Save,
  Navigation
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function MapControlPanel({
  drawingMode,
  drawMode,
  shapeType,
  drawingFeatureType,
  drawingPoints,
  freehandPath,
  rotation,
  setRotation,
  showBoundary,
  setShowBoundary,
  showOrchards,
  setShowOrchards,
  showGardens,
  setShowGardens,
  showWater,
  setShowWater,
  showInfrastructure,
  setShowInfrastructure,
  showRecommendationOverlays,
  setShowRecommendationOverlays,
  parsedRecommendations,
  orchards,
  gardens,
  waterResources,
  infrastructure,
  weatherData,
  onStartDrawing,
  onFinishDrawing,
  onUndoLastPoint,
  onCancelDrawing
}) {
  if (drawingMode) {
    return (
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="py-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-semibold">
                    Drawing {drawingFeatureType} - {drawMode === 'freehand' ? 'Freehand Mode' : shapeType ? `${shapeType} Shape` : 'Polygon Mode'}
                  </p>
                  <p className="text-xs text-blue-800 mt-1">
                    {drawMode === 'freehand' 
                      ? 'Click and drag to draw freehand. Release mouse to finish. The map is frozen while drawing.' 
                      : shapeType 
                      ? `Click 2 points to define the ${shapeType}. Use rotation slider to rotate. The map is frozen.`
                      : 'Click to add points, then click "Finish" to close polygon. The map is frozen while drawing.'
                    }
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Points: {drawingPoints.length} {drawMode === 'freehand' && freehandPath.length > 0 && `(${freehandPath.length} path points)`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {drawingPoints.length > 0 && drawMode !== 'freehand' && (
                  <Button size="sm" variant="outline" onClick={onUndoLastPoint}>
                    <Undo className="w-4 h-4 mr-2" />
                    Undo
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={onCancelDrawing}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onFinishDrawing}
                  disabled={drawingPoints.length < (shapeType ? 2 : 3)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Finish
                </Button>
              </div>
            </div>

            {shapeType && drawingPoints.length >= 2 && (
              <div className="flex items-center gap-4 pt-3 border-t border-blue-200">
                <Label className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Rotation:
                </Label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono text-blue-900 w-12">{rotation}°</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Features Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Features to Map
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Boundary */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Property Boundary</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                onClick={() => onStartDrawing('boundary', 'polygon', null)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Edit3 className="w-5 h-5" />
                <span className="text-xs">Draw Boundary</span>
              </Button>
              <Button
                onClick={() => onStartDrawing('boundary', 'freehand', null)}
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Hand className="w-5 h-5" />
                <span className="text-xs">Freehand Boundary</span>
              </Button>
            </div>
          </div>

          {/* Orchards */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Orchards
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button onClick={() => onStartDrawing('orchard', 'polygon', null)} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Edit3 className="w-5 h-5" /><span className="text-xs">Polygon</span>
              </Button>
              <Button onClick={() => onStartDrawing('orchard', 'polygon', 'rectangle')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Maximize2 className="w-5 h-5" /><span className="text-xs">Rectangle</span>
              </Button>
              <Button onClick={() => onStartDrawing('orchard', 'polygon', 'square')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Square className="w-5 h-5" /><span className="text-xs">Square</span>
              </Button>
              <Button onClick={() => onStartDrawing('orchard', 'polygon', 'circle')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <CircleIcon className="w-5 h-5" /><span className="text-xs">Circle</span>
              </Button>
              <Button onClick={() => onStartDrawing('orchard', 'freehand', null)} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Hand className="w-5 h-5" /><span className="text-xs">Freehand</span>
              </Button>
            </div>
          </div>

          {/* Gardens */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-lime-600" />
              Gardens
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button onClick={() => onStartDrawing('garden', 'polygon', null)} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Edit3 className="w-5 h-5" /><span className="text-xs">Polygon</span>
              </Button>
              <Button onClick={() => onStartDrawing('garden', 'polygon', 'rectangle')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Maximize2 className="w-5 h-5" /><span className="text-xs">Rectangle</span>
              </Button>
              <Button onClick={() => onStartDrawing('garden', 'polygon', 'square')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Square className="w-5 h-5" /><span className="text-xs">Square</span>
              </Button>
              <Button onClick={() => onStartDrawing('garden', 'polygon', 'circle')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <CircleIcon className="w-5 h-5" /><span className="text-xs">Circle</span>
              </Button>
              <Button onClick={() => onStartDrawing('garden', 'freehand', null)} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Hand className="w-5 h-5" /><span className="text-xs">Freehand</span>
              </Button>
            </div>
          </div>

          {/* Water Resources */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              Water Resources
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button onClick={() => onStartDrawing('water', 'polygon', null)} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Edit3 className="w-5 h-5" /><span className="text-xs">Polygon</span>
              </Button>
              <Button onClick={() => onStartDrawing('water', 'polygon', 'circle')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <CircleIcon className="w-5 h-5" /><span className="text-xs">Circle/Pond</span>
              </Button>
              <Button onClick={() => onStartDrawing('water', 'freehand', null)} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Hand className="w-5 h-5" /><span className="text-xs">Freehand</span>
              </Button>
            </div>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-purple-600" />
              Infrastructure
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button onClick={() => onStartDrawing('infrastructure', 'polygon', null)} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Edit3 className="w-5 h-5" /><span className="text-xs">Polygon</span>
              </Button>
              <Button onClick={() => onStartDrawing('infrastructure', 'polygon', 'rectangle')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Maximize2 className="w-5 h-5" /><span className="text-xs">Rectangle</span>
              </Button>
              <Button onClick={() => onStartDrawing('infrastructure', 'polygon', 'square')} variant="outline" className="flex flex-col items-center gap-2 h-auto py-3">
                <Square className="w-5 h-5" /><span className="text-xs">Square</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Layers Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Map Layers
            </CardTitle>
            {parsedRecommendations.length > 0 && (
              <div className="flex items-center gap-2">
                <Switch
                  id="show-recommendations"
                  checked={showRecommendationOverlays}
                  onCheckedChange={setShowRecommendationOverlays}
                />
                <Label htmlFor="show-recommendations" className="text-sm font-medium">
                  AI Recommendations
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <Label htmlFor="show-boundary" className="text-sm font-medium">Boundary</Label>
              </div>
              <Switch id="show-boundary" checked={showBoundary} onCheckedChange={setShowBoundary} />
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <Label htmlFor="show-orchards" className="text-sm font-medium">Orchards ({orchards.length})</Label>
              </div>
              <Switch id="show-orchards" checked={showOrchards} onCheckedChange={setShowOrchards} />
            </div>

            <div className="flex items-center justify-between p-3 bg-lime-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-lime-600" />
                <Label htmlFor="show-gardens" className="text-sm font-medium">Gardens ({gardens.length})</Label>
              </div>
              <Switch id="show-gardens" checked={showGardens} onCheckedChange={setShowGardens} />
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-600" />
                <Label htmlFor="show-water" className="text-sm font-medium">Water ({waterResources.length})</Label>
              </div>
              <Switch id="show-water" checked={showWater} onCheckedChange={setShowWater} />
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <HomeIcon className="w-4 h-4 text-purple-600" />
                <Label htmlFor="show-infra" className="text-sm font-medium">Buildings ({infrastructure.length})</Label>
              </div>
              <Switch id="show-infra" checked={showInfrastructure} onCheckedChange={setShowInfrastructure} />
            </div>
          </div>

          {weatherData && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-900">Current Weather</h4>
                  <p className="text-sm text-blue-700">
                    {Math.round(weatherData.values.temperature)}°F • {weatherData.values.humidity}% humidity • {Math.round(weatherData.values.windSpeed)} mph wind
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}