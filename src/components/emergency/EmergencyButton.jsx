import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmergencyLogModal from "./EmergencyLogModal";

export default function EmergencyButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Floating Emergency Button - Fixed position */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowModal(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 group"
          size="icon"
        >
          <AlertTriangle className="w-8 h-8 text-white animate-pulse group-hover:animate-none" />
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            Emergency Log
          </div>
        </div>
      </div>

      {showModal && (
        <EmergencyLogModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}