import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Clock,
  MapPin,
  DollarSign,
  Camera,
  FileText,
  CheckCircle2,
  Shield,
  Edit,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function EmergencyLogs() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [uploading, setUploading] = useState(false);

  const { data: emergencyLogs = [], isLoading } = useQuery({
    queryKey: ['emergency-logs'],
    queryFn: () => base44.entities.EmergencyLog.list('-timestamp'),
  });

  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const updateLogMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmergencyLog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-logs'] });
      setSelectedLog(null);
      setEditFormData({});
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const fileUrls = results.map(r => r.file_url);
      setEditFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...fileUrls]
      }));
    } catch (error) {
      alert("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async () => {
    await updateLogMutation.mutateAsync({
      id: selectedLog.id,
      data: editFormData
    });
  };

  const filteredLogs = emergencyLogs.filter(log => {
    if (filterStatus === "all") return true;
    if (filterStatus === "unresolved") return !log.resolved;
    if (filterStatus === "resolved") return log.resolved;
    if (filterStatus === "critical") return log.severity === "critical";
    return true;
  });

  const unresolvedCount = emergencyLogs.filter(l => !l.resolved).length;
  const criticalCount = emergencyLogs.filter(l => l.severity === "critical" && !l.resolved).length;
  const totalFinancialImpact = emergencyLogs.reduce((sum, l) => sum + (l.financial_impact || 0), 0);

  const severityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700"
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Emergency Logs</h1>
            <p className="text-gray-600 mt-1">Timestamped records for insurance and vet documentation</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unresolved</p>
                  <p className="text-2xl font-bold text-red-700">{unresolvedCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical Active</p>
                  <p className="text-2xl font-bold text-orange-700">{criticalCount}</p>
                </div>
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Financial Impact</p>
                  <p className="text-2xl font-bold text-purple-700">${totalFinancialImpact.toFixed(0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className="bg-white">
            <TabsTrigger value="all">All Logs</TabsTrigger>
            <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Logs List */}
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <Card 
              key={log.id} 
              className={`border-l-4 cursor-pointer hover:shadow-lg transition-all ${
                log.severity === 'critical' ? 'border-l-red-600' :
                log.severity === 'high' ? 'border-l-orange-600' :
                log.severity === 'medium' ? 'border-l-yellow-600' :
                'border-l-blue-600'
              }`}
              onClick={() => {
                setSelectedLog(log);
                setEditFormData(log);
              }}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {log.emergency_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <Badge className={severityColors[log.severity]}>
                        {log.severity}
                      </Badge>
                      {log.resolved && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                      {log.insurance_claim_filed && (
                        <Badge className="bg-blue-600 text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Insurance Claimed
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-700 mb-3">{log.quick_description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      {log.location_on_property && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{log.location_on_property}</span>
                        </div>
                      )}
                      {log.financial_impact && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-red-700">${log.financial_impact.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Edit className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Modal */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedLog && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Emergency Log Details
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Type:</p>
                        <p className="font-semibold">{selectedLog.emergency_type.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Severity:</p>
                        <Badge className={severityColors[selectedLog.severity]}>
                          {selectedLog.severity}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Timestamp:</p>
                        <p className="font-semibold">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Location:</p>
                        <p className="font-semibold">{selectedLog.location_on_property || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Initial Description</Label>
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                      {selectedLog.quick_description}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="detailed_notes">Detailed Notes (add more info)</Label>
                    <Textarea
                      id="detailed_notes"
                      value={editFormData.detailed_notes || ""}
                      onChange={(e) => setEditFormData({...editFormData, detailed_notes: e.target.value})}
                      placeholder="Add detailed observations, follow-up actions, outcomes..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="financial_impact">Financial Impact ($)</Label>
                    <Input
                      id="financial_impact"
                      type="number"
                      step="0.01"
                      value={editFormData.financial_impact || ""}
                      onChange={(e) => setEditFormData({...editFormData, financial_impact: parseFloat(e.target.value)})}
                      placeholder="Estimated or actual cost"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="insurance_filed"
                        checked={editFormData.insurance_claim_filed || false}
                        onCheckedChange={(checked) => setEditFormData({...editFormData, insurance_claim_filed: checked})}
                      />
                      <Label htmlFor="insurance_filed" className="cursor-pointer">
                        Insurance Claim Filed
                      </Label>
                    </div>

                    {editFormData.insurance_claim_filed && (
                      <div>
                        <Label htmlFor="claim_number">Claim Number</Label>
                        <Input
                          id="claim_number"
                          value={editFormData.insurance_claim_number || ""}
                          onChange={(e) => setEditFormData({...editFormData, insurance_claim_number: e.target.value})}
                          placeholder="Claim #"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="resolved"
                      checked={editFormData.resolved || false}
                      onCheckedChange={(checked) => setEditFormData({...editFormData, resolved: checked})}
                    />
                    <Label htmlFor="resolved" className="cursor-pointer">
                      Mark as Resolved
                    </Label>
                  </div>

                  <div>
                    <Label>Upload Photos</Label>
                    <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mt-2">
                      <div className="flex flex-col items-center">
                        {uploading ? (
                          <>
                            <Camera className="w-8 h-8 text-blue-600 animate-pulse mb-2" />
                            <span className="text-sm text-blue-600">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600">Click to upload documentation photos</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>

                    {editFormData.photos && editFormData.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {editFormData.photos.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-24 object-cover rounded border" />
                            <button
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                setEditFormData(prev => ({
                                  ...prev,
                                  photos: prev.photos.filter((_, i) => i !== idx)
                                }));
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedLog(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDetails} className="bg-blue-600 hover:bg-blue-700">
                    Save Details
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}