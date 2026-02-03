import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Upload, CheckCircle2, Clock, X } from "lucide-react";
import { getUnsyncedDrafts, deleteDraft, markDraftSynced } from "@/components/utils/offlineStorage";
import { format } from "date-fns";

export default function DraftSyncManager({ userEmail }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState([]);

  const loadDrafts = async () => {
    if (userEmail) {
      const unsyncedDrafts = await getUnsyncedDrafts(userEmail);
      setDrafts(unsyncedDrafts);
    }
  };

  useEffect(() => {
    loadDrafts();
    const interval = setInterval(loadDrafts, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [userEmail]);

  const syncDraft = async (draft) => {
    const entityMap = {
      'emergency_log': 'EmergencyLog',
      'checklist_item': 'ChecklistItem',
      'livestock': 'Livestock',
      'vaccination': 'Vaccination',
      'vet_visit': 'VetVisit',
      'weight_record': 'WeightRecord',
      'production': 'Production',
      'financial_transaction': 'FinancialTransaction',
      'harvest_record': 'HarvestRecord',
      'milk_production': 'MilkProduction',
      'fermentation_batch': 'FermentationBatch',
      'inventory_item': 'InventoryItem'
    };

    const entityName = entityMap[draft.formType];
    if (!entityName) {
      throw new Error(`Unknown form type: ${draft.formType}`);
    }

    return await base44.entities[entityName].create(draft.formData);
  };

  const handleSyncAll = async () => {
    if (!navigator.onLine) {
      alert("Cannot sync while offline. Please connect to internet.");
      return;
    }

    setSyncing(true);
    const results = [];

    for (const draft of drafts) {
      try {
        await syncDraft(draft);
        await markDraftSynced(draft.id);
        results.push({ id: draft.id, success: true });
        
        // Invalidate relevant queries
        queryClient.invalidateQueries();
      } catch (error) {
        console.error('Sync error:', error);
        results.push({ id: draft.id, success: false, error: error.message });
      }
    }

    setSyncResults(results);
    await loadDrafts();
    setSyncing(false);

    const successCount = results.filter(r => r.success).length;
    if (successCount === drafts.length) {
      alert(`✅ Successfully synced all ${successCount} draft(s)`);
    } else {
      alert(`⚠️ Synced ${successCount} of ${drafts.length} draft(s). Some failed.`);
    }
  };

  const handleDeleteDraft = async (draftId) => {
    if (confirm("Delete this draft? This cannot be undone.")) {
      await deleteDraft(draftId);
      await loadDrafts();
    }
  };

  if (drafts.length === 0) {
    return (
      <Card className="border-green-300 bg-green-50">
        <CardContent className="py-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-800 font-medium">All drafts synced!</p>
          <p className="text-sm text-green-700 mt-1">No offline drafts waiting to sync</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-300 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            Offline Drafts Ready to Sync
          </span>
          <Badge className="bg-orange-600 text-white">
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <p className="text-sm text-gray-700 mb-3">
            You have {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved offline. 
            {navigator.onLine ? ' Click below to sync to your account.' : ' Connect to internet to sync.'}
          </p>
          
          <Button
            onClick={handleSyncAll}
            disabled={syncing || !navigator.onLine}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Sync All Drafts
              </>
            )}
          </Button>
        </div>

        {/* Draft List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {draft.formType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(draft.timestamp), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteDraft(draft.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}