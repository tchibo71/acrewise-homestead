import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    farm_name: { type: "string", description: "Farm or property name if visible" },
    location_address: { type: "string", description: "Full address or location description" },
    grid_coordinates: { type: "string", description: "Lat/Long coordinates if visible" },
    total_acreage: { type: "number", description: "Total acreage as a number" },
    usable_acreage: { type: "number", description: "Usable acreage as a number" },
    soil_types: {
      type: "array",
      items: {
        type: "object",
        properties: {
          soil_type: { type: "string" },
          location: { type: "string" },
          depth: { type: "string" },
          acreage: { type: "number" },
        },
      },
    },
    infrastructure: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          description: { type: "string" },
          condition: { type: "string", enum: ["excellent", "good", "fair", "poor"] },
          year_built: { type: "string" },
        },
      },
    },
    water_sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_type: { type: "string" },
          capacity: { type: "string" },
          location: { type: "string" },
        },
      },
    },
    summary: { type: "string", description: "Brief summary of what was identified" },
  },
};

function isFieldEmpty(value) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return false;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function buildMergedData(current, extracted) {
  const merged = { ...current };
  const simpleFields = ["farm_name", "location_address", "grid_coordinates", "total_acreage", "usable_acreage"];
  simpleFields.forEach((field) => {
    if (!isFieldEmpty(extracted[field]) && isFieldEmpty(current[field])) {
      merged[field] = extracted[field];
    }
  });
  ["soil_types", "infrastructure", "water_sources"].forEach((field) => {
    if (Array.isArray(extracted[field]) && extracted[field].length > 0) {
      merged[field] = [...(current[field] || []), ...extracted[field]];
    }
  });
  return merged;
}

function buildReplaceData(extracted) {
  return {
    farm_name: extracted.farm_name || "",
    location_address: extracted.location_address || "",
    grid_coordinates: extracted.grid_coordinates || "",
    plat_map_number: "",
    total_acreage: extracted.total_acreage ?? "",
    usable_acreage: extracted.usable_acreage ?? "",
    soil_types: Array.isArray(extracted.soil_types) ? extracted.soil_types : [],
    infrastructure: Array.isArray(extracted.infrastructure) ? extracted.infrastructure : [],
    water_sources: Array.isArray(extracted.water_sources) ? extracted.water_sources : [],
  };
}

export default function PhotoAnalysisUploader({ formData, onApply }) {
  const [photos, setPhotos] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    setExtractedData(null);
    setError(null);
    e.target.value = "";
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (photos.length === 0) throw new Error("Please upload at least one photo");

      setError(null);

      // Upload all photos first
      const uploadResults = await Promise.all(
        photos.map((photo) => base44.integrations.Core.UploadFile({ file: photo.file }))
      );
      const fileUrls = uploadResults.map((r) => r.file_url);

      const prompt = `You are an expert farm and property analyst. Analyze the uploaded photo(s) which may include Google Maps screenshots, satellite imagery, property documents, plat maps, soil surveys, or photos of the property/infrastructure/water sources.

Extract any farm profile information you can identify from these images:
- Farm or property name (if visible on documents or signs)
- Physical address or location description (from map labels, addresses, or coordinates)
- GPS coordinates (latitude, longitude) if visible
- Total acreage (from map scale bars, property boundaries, or documents)
- Usable acreage (if distinguishable from total)
- Soil types (from soil survey maps, with location/depth/acreage if available)
- Infrastructure (barns, fences, outbuildings, greenhouses, etc. - with type, condition, year if visible)
- Water sources (wells, ponds, creeks, tanks - with type, capacity, location)

Be conservative: only include data you can clearly identify from the images. Use empty strings or empty arrays for categories where nothing is visible. Provide a brief summary of what you identified.

If the images are Google Maps or satellite screenshots, estimate acreage from scale bars or visible boundaries and note it's an estimate in the summary.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: fileUrls,
        response_json_schema: ANALYSIS_SCHEMA,
      });

      return result;
    },
    onSuccess: (data) => {
      setExtractedData(data);
    },
    onError: (err) => {
      setError(err?.message || "Failed to analyze photos");
    },
  });

  const handleApply = (mode) => {
    if (!extractedData) return;
    const newData = mode === "replace"
      ? buildReplaceData(extractedData)
      : buildMergedData(formData, extractedData);
    onApply(newData);
    setExtractedData(null);
  };

  const hasExtractedData = extractedData && (
    extractedData.farm_name ||
    extractedData.location_address ||
    extractedData.grid_coordinates ||
    extractedData.total_acreage ||
    extractedData.usable_acreage ||
    (extractedData.soil_types && extractedData.soil_types.length > 0) ||
    (extractedData.infrastructure && extractedData.infrastructure.length > 0) ||
    (extractedData.water_sources && extractedData.water_sources.length > 0)
  );

  return (
    <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Build Profile from Photos
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Upload Google Maps screenshots, satellite imagery, plat maps, soil surveys, or property photos. AI vision will extract your farm details automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className="w-10 h-10 text-blue-500 mx-auto mb-2" />
          <p className="font-medium text-blue-900">Click to upload photos</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, or other image formats — multiple files allowed</p>
        </div>

        {/* Photo Previews */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-blue-200">
                <img src={photo.preview} alt="upload preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Analyze Button */}
        {photos.length > 0 && (
          <Button
            type="button"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing {photos.length} photo{photos.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze {photos.length} Photo{photos.length > 1 ? 's' : ''} with AI
              </>
            )}
          </Button>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Extracted Data Review */}
        {extractedData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Analysis Complete</span>
            </div>

            {extractedData.summary && (
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">{extractedData.summary}</p>
              </div>
            )}

            {hasExtractedData ? (
              <div className="space-y-3">
                <ExtractedPreview data={extractedData} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={() => handleApply("merge")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Merge with Current
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleApply("replace")}
                    variant="destructive"
                    className="flex-1"
                  >
                    Replace All Fields
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  "Merge" fills only empty fields and appends arrays. "Replace" overwrites everything.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                No farm profile data could be clearly identified from these photos. Try clearer screenshots or different images.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExtractedPreview({ data }) {
  const sections = [
    { label: "Farm Name", value: data.farm_name },
    { label: "Address", value: data.location_address },
    { label: "Coordinates", value: data.grid_coordinates },
    { label: "Total Acreage", value: data.total_acreage },
    { label: "Usable Acreage", value: data.usable_acreage },
  ].filter((s) => !isFieldEmpty(s.value));

  const arraySections = [
    { label: "Soil Types", items: data.soil_types, render: (s) => `${s.soil_type}${s.location ? ` (${s.location})` : ""}${s.acreage ? ` — ${s.acreage} ac` : ""}` },
    { label: "Infrastructure", items: data.infrastructure, render: (i) => `${i.type}${i.condition ? ` (${i.condition})` : ""}` },
    { label: "Water Sources", items: data.water_sources, render: (w) => `${w.source_type}${w.capacity ? ` — ${w.capacity}` : ""}` },
  ].filter((s) => Array.isArray(s.items) && s.items.length > 0);

  return (
    <div className="space-y-3">
      {sections.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {sections.map((s) => (
            <div key={s.label} className="p-2 bg-white rounded border border-gray-200">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm font-medium text-gray-900">{String(s.value)}</p>
            </div>
          ))}
        </div>
      )}
      {arraySections.map((section) => (
        <div key={section.label} className="p-2 bg-white rounded border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">{section.label} ({section.items.length})</p>
          <div className="flex flex-wrap gap-1">
            {section.items.map((item, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {section.render(item)}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}