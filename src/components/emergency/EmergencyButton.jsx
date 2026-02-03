import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function EmergencyButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createEmergencyMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      return await base44.entities.EmergencyLog.create({
        emergency_type: "other",
        severity: "high",
        timestamp: now,
        quick_description: "INCOMPLETE - AWAITING DETAILS",
        resolved: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-logs'] });
      toast.success("Emergency timestamp created! Complete within 24 hours.");
      navigate(createPageUrl("EmergencyLogs"));
    },
    onError: () => {
      toast.error("Failed to create emergency log");
    }
  });

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => createEmergencyMutation.mutate()}
        disabled={createEmergencyMutation.isPending}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 group disabled:opacity-70"
        size="icon"
      >
        <AlertTriangle className="w-8 h-8 text-white animate-pulse group-hover:animate-none" />
      </Button>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg">
          Emergency - Timestamp Now
        </div>
      </div>
    </div>
  );
}