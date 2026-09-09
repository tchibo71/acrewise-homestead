import React, { useState, useEffect } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LivestockPhotoUpload({ photoUrl, onFileSelect }) {
  const [previewUrl, setPreviewUrl] = useState(photoUrl || null);

  useEffect(() => {
    setPreviewUrl(photoUrl || null);
  }, [photoUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      <Label>Photo</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
        {previewUrl ? (
          <div className="space-y-3">
            <img
              src={previewUrl}
              alt="Animal photo"
              className="max-h-40 mx-auto rounded-lg object-cover"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
              <X className="w-4 h-4 mr-1" />
              Remove Photo
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
              <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm">Click to upload a photo</p>
              <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}