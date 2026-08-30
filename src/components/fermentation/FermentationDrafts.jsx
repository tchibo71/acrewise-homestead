import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDraftsByType, deleteDraft } from "@/components/utils/offlineStorage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Trash2, WifiOff, Inbox } from "lucide-react";

export default function FermentationDrafts({ userEmail, onResume }) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingingId] = useState(null);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['fermentation-drafts', userEmail],
    queryFn: () => getDraftsByType('fermentation_batch', userEmail),
    enabled: !!userEmail,
  });

  const handleDelete = async (draftId) => {
    setDeletingingId(draftId);
    try {
      await deleteDraft(draftId);
      queryClient.invalidateQueries({ queryKey: ['fermentation-drafts', userEmail] });
    } catch (error) {
      console.error("Failed to delete draft:", error);
    } finally {
      setDeletingingId(null);
    }
  };

  if (isLoading || drafts.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <FileEdit className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-amber-900">Saved Drafts</h3>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
            {drafts.length}
          </Badge>
          {!navigator.onLine && (
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 ml-auto">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {drafts.map((draft) => {
            const data = draft.formData || {};
            return (
              <div
                key={draft.id}
                className="flex items-center justify-between gap-3 bg-white rounded-lg border border-amber-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {data.batch_name || "Untitled Batch"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data.fermentation_type || "fermentation"} •{" "}
                    {data.primary_produce || "no produce"} •{" "}
                    {new Date(draft.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResume(draft)}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(draft.id)}
                    disabled={deletingId === draft.id}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}