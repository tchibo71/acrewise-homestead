import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { uploadFileWithProgress } from "@/components/utils/uploadWithProgress";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Loader2, CheckCircle, X, Camera } from "lucide-react";

export default function VaccinationRecordUploader({ onExtracted, animalName }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess(false);
    setFileName(file.name);
    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Upload the file with progress tracking
      const { file_url } = await uploadFileWithProgress(file, (p) => setProgress(p));
      setUploading(false);
      setExtracting(true);

      // Step 2: Extract vaccination data using AI vision
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a veterinary records assistant. Extract vaccination record information from this document${animalName ? ` for an animal named "${animalName}"` : ""}.

Extract the following fields if they are clearly present in the document:
- vaccine_name: The name/brand of the vaccine (e.g., "Rabies Vaccine", "Covexin 10")
- vaccination_date: The date the vaccine was administered, formatted as YYYY-MM-DD
- next_due_date: When the next dose or booster is due, formatted as YYYY-MM-DD
- administered_by: Name of the veterinarian, clinic, or person who administered it
- batch_number: The vaccine batch, lot, or serial number
- dosage: The dosage amount (e.g., "2ml", "1 dose")
- location: The injection site or route (e.g., "subcutaneous", "neck", "intramuscular")
- cost: The cost of the vaccination as a number (no currency symbol)
- notes: Any other relevant notes, warnings, or instructions from the document

Only populate fields that are clearly visible in the document. Use empty string for any string field that is not found, and null for cost if not found.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            vaccine_name: { type: "string" },
            vaccination_date: { type: "string" },
            next_due_date: { type: "string" },
            administered_by: { type: "string" },
            batch_number: { type: "string" },
            dosage: { type: "string" },
            location: { type: "string" },
            cost: { type: "number" },
            notes: { type: "string" },
          },
        },
      });

      setExtracting(false);
      setSuccess(true);
      onExtracted(result);
    } catch (err) {
      setUploading(false);
      setExtracting(false);
      setError(err.message || "Failed to process the document. You can still fill in the form manually below.");
    }
  };

  const handleReset = () => {
    setFileName("");
    setProgress(0);
    setSuccess(false);
    setError("");
  };

  const isBusy = uploading || extracting;

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/50">
      {!isBusy && !success && !error && (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Camera className="w-7 h-7 text-blue-500" />
            <Upload className="w-7 h-7 text-blue-500" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Upload a vaccination record
          </p>
          <p className="text-xs text-gray-500 max-w-xs">
            Snap a photo or upload a document — AI will read it and fill in the fields below automatically
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              <Upload className="w-4 h-4" />
              Choose File
            </span>
          </label>
        </div>
      )}

      {(isBusy || success || error) && (
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
            {uploading && (
              <>
                <p className="text-xs text-gray-500 mb-1">Uploading… {progress}%</p>
                <Progress value={progress} className="h-2" />
              </>
            )}
            {extracting && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reading document with AI…</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Data extracted — review and fill any gaps below</span>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          {(success || error) && (
            <button
              type="button"
              onClick={handleReset}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}