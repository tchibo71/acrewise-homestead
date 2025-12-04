import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Stethoscope,
  Camera,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  ShieldAlert,
  Activity,
  X
} from "lucide-react";

const severityColors = {
  mild: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  severe: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200"
};

const severityIcons = {
  mild: CheckCircle2,
  moderate: Activity,
  severe: AlertTriangle,
  critical: ShieldAlert
};

export default function AIDiagnosticCenter({ onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [animalType, setAnimalType] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch diagnostic templates
  const { data: diagnostics = [] } = useQuery({
    queryKey: ['diagnostics-db'],
    queryFn: () => base44.entities.DiagnosticsDB.list(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !animalType) {
      setError("Please select a photo and animal type");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Upload the file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // Use LLM ONLY for image classification - minimal tokens
      const classificationPrompt = `Analyze this livestock image and classify what you see.

Animal type: ${animalType}

Look for visual signs of health issues. Return ONLY a JSON object with your classification.

{
  "detected_issues": ["keyword1", "keyword2"],
  "category": "one of: skin_condition, eye_condition, hoof_foot, respiratory, digestive, parasites, injury, behavioral, reproductive, nutritional, general_illness",
  "confidence": "low, medium, or high",
  "visual_description": "brief 1-2 sentence description of what you observe"
}

If the animal appears healthy with no visible issues, return:
{
  "detected_issues": ["healthy", "normal"],
  "category": "general_illness",
  "confidence": "high",
  "visual_description": "Animal appears healthy with no visible issues"
}`;

      const classification = await base44.integrations.Core.InvokeLLM({
        prompt: classificationPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            detected_issues: { type: "array", items: { type: "string" } },
            category: { type: "string" },
            confidence: { type: "string" },
            visual_description: { type: "string" }
          }
        }
      });

      // Match to diagnostic template
      let bestMatch = null;
      let bestScore = 0;

      for (const diag of diagnostics) {
        let score = 0;

        // Category match (high weight)
        if (diag.category === classification.category) score += 10;

        // Animal type match
        if (diag.animal_types?.includes(animalType)) score += 5;

        // Visual indicator keyword matches
        const matchedIndicators = classification.detected_issues.filter(issue =>
          diag.visual_indicators?.some(vi =>
            vi.toLowerCase().includes(issue.toLowerCase()) ||
            issue.toLowerCase().includes(vi.toLowerCase())
          )
        );
        score += matchedIndicators.length * 3;

        // Symptom matches
        const matchedSymptoms = classification.detected_issues.filter(issue =>
          diag.symptoms?.some(s =>
            s.toLowerCase().includes(issue.toLowerCase()) ||
            issue.toLowerCase().includes(s.toLowerCase())
          )
        );
        score += matchedSymptoms.length * 2;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = diag;
        }
      }

      setResult({
        classification,
        diagnostic: bestMatch,
        matchScore: bestScore,
        imageUrl: file_url
      });

    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              AI Diagnostic Center
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Upload a photo for AI-assisted health assessment
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {!result ? (
            <>
              {/* Upload Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Animal Type</Label>
                  <Select value={animalType} onValueChange={setAnimalType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select animal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chicken">Chicken</SelectItem>
                      <SelectItem value="goat">Goat</SelectItem>
                      <SelectItem value="sheep">Sheep</SelectItem>
                      <SelectItem value="cow">Cow</SelectItem>
                      <SelectItem value="pig">Pig</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="duck">Duck</SelectItem>
                      <SelectItem value="turkey">Turkey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Upload Photo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded-lg object-cover"
                        />
                        <Button variant="outline" size="sm" onClick={resetAnalysis}>
                          Choose Different Photo
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleAnalyze}
                  disabled={!selectedFile || !animalType || analyzing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Analyze Photo
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Disclaimer</p>
                    <p>This tool provides general guidance only and is not a substitute for professional veterinary diagnosis. Always consult a veterinarian for serious health concerns.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Results Section */}
              <div className="space-y-6">
                {/* Image and Classification */}
                <div className="flex gap-4">
                  <img 
                    src={result.imageUrl} 
                    alt="Analyzed" 
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-700">AI Observation</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.classification.visual_description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">
                        {result.classification.category.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {result.classification.confidence} confidence
                      </Badge>
                    </div>
                  </div>
                </div>

                {result.diagnostic && result.matchScore >= 5 ? (
                  <>
                    {/* Diagnosis */}
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {result.diagnostic.condition_name}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {result.diagnostic.category.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <Badge className={severityColors[result.diagnostic.severity]}>
                          {React.createElement(severityIcons[result.diagnostic.severity], { className: "w-3 h-3 mr-1" })}
                          {result.diagnostic.severity}
                        </Badge>
                      </div>
                      <p className="text-gray-700">{result.diagnostic.diagnosis_description}</p>
                      
                      {result.diagnostic.contagious && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" />
                          <span>This condition may be contagious. Isolate affected animals.</span>
                        </div>
                      )}
                    </div>

                    {/* Treatment Plan */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Treatment Plan
                      </h4>
                      
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          {result.diagnostic.treatment_plan}
                        </div>
                      </div>

                      {result.diagnostic.treatment_steps?.length > 0 && (
                        <div className="space-y-3">
                          {result.diagnostic.treatment_steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg border">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                                {step.step_number}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{step.title}</p>
                                <p className="text-sm text-gray-600">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {result.diagnostic.medications?.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Common Medications</h5>
                          <div className="flex flex-wrap gap-2">
                            {result.diagnostic.medications.map((med, idx) => (
                              <Badge key={idx} variant="outline" className="bg-white">
                                {med}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.diagnostic.recovery_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Expected recovery: {result.diagnostic.recovery_time}</span>
                        </div>
                      )}
                    </div>

                    {/* When to Call Vet */}
                    {result.diagnostic.when_to_call_vet && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h5 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          When to Call a Veterinarian
                        </h5>
                        <p className="text-sm text-amber-700">{result.diagnostic.when_to_call_vet}</p>
                      </div>
                    )}

                    {/* Prevention Tips */}
                    {result.diagnostic.prevention_tips?.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Prevention Tips</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {result.diagnostic.prevention_tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-green-800">No Issues Detected</h3>
                    <p className="text-green-700 mt-2">
                      Based on the image analysis, no specific health issues were identified. 
                      The animal appears to be in normal condition.
                    </p>
                    <p className="text-sm text-green-600 mt-4">
                      If you're concerned about your animal's health, please consult a veterinarian.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetAnalysis} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Analyze Another Photo
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}