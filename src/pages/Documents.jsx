import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  FileText,
  Plus,
  Search,
  Upload,
  Loader2,
  X,
  AlertTriangle,
  Calendar,
  Building2,
  Tag,
  ExternalLink,
  Trash2,
  Paperclip
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";

const DOCUMENT_TYPES = [
  { value: "receipt", label: "Receipt" },
  { value: "invoice", label: "Invoice" },
  { value: "warranty", label: "Warranty" },
  { value: "manual", label: "Manual" },
  { value: "permit", label: "Permit" },
  { value: "insurance_policy", label: "Insurance Policy" },
  { value: "veterinary_record", label: "Veterinary Record" },
  { value: "soil_test_report", label: "Soil Test Report" },
  { value: "contract", label: "Contract" },
  { value: "certification", label: "Certification" },
  { value: "other", label: "Other" },
];

const typeColors = {
  receipt: "bg-gray-100 text-gray-700",
  invoice: "bg-blue-100 text-blue-700",
  warranty: "bg-purple-100 text-purple-700",
  manual: "bg-indigo-100 text-indigo-700",
  permit: "bg-amber-100 text-amber-700",
  insurance_policy: "bg-green-100 text-green-700",
  veterinary_record: "bg-red-100 text-red-700",
  soil_test_report: "bg-yellow-100 text-yellow-700",
  contract: "bg-orange-100 text-orange-700",
  certification: "bg-teal-100 text-teal-700",
  other: "bg-slate-100 text-slate-700",
};

export default function Documents() {
  const queryClient = useQueryClient();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterExpiring, setFilterExpiring] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    document_type: "",
    issue_date: "",
    expiration_date: "",
    issuing_organization: "",
    related_entity_type: "",
    related_entity_id: "",
    tags: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowUploadForm(false);
      setFormData({
        title: "", document_type: "", issue_date: "", expiration_date: "",
        issuing_organization: "", related_entity_type: "", related_entity_id: "",
        tags: "", notes: ""
      });
      setSelectedFile(null);
      setError(null);
    },
    onError: (err) => setError(err.message || "Failed to save document"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.document_type || !selectedFile) {
      setError("Title, document type, and file are required");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      createMutation.mutate({
        title: formData.title,
        document_type: formData.document_type,
        file_url,
        issue_date: formData.issue_date || null,
        expiration_date: formData.expiration_date || null,
        issuing_organization: formData.issuing_organization || null,
        related_entity_type: formData.related_entity_type || null,
        related_entity_id: formData.related_entity_id || null,
        tags: formData.tags
          ? formData.tags.split(",").map(t => t.trim()).filter(Boolean)
          : [],
        notes: formData.notes || null,
      });
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    if (confirm("Delete this document? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm ||
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.issuing_organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || doc.document_type === filterType;
    const matchesExpiring = !filterExpiring ||
      (doc.expiration_date && differenceInDays(new Date(doc.expiration_date), new Date()) <= 30 && differenceInDays(new Date(doc.expiration_date), new Date()) >= 0);
    return matchesSearch && matchesType && matchesExpiring;
  });

  const expiringCount = documents.filter(d =>
    d.expiration_date && differenceInDays(new Date(d.expiration_date), new Date()) <= 30 && differenceInDays(new Date(d.expiration_date), new Date()) >= 0
  ).length;

  const expiredCount = documents.filter(d =>
    d.expiration_date && differenceInDays(new Date(d.expiration_date), new Date()) < 0
  ).length;

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Documents</h1>
              <p className="text-gray-600 mt-1">{documents.length} documents stored</p>
            </div>
          </div>
          <Button onClick={() => setShowUploadForm(true)} className="bg-gray-700 hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-white/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-amber-700">{expiringCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-700">{expiredCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by title, organization, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48 bg-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={filterExpiring ? "default" : "outline"}
            onClick={() => setFilterExpiring(!filterExpiring)}
            className={filterExpiring ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Expiring ≤ 30 days
          </Button>
        </div>

        {/* Document List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-500 mb-4">Upload receipts, warranties, permits, and more</p>
              <Button onClick={() => setShowUploadForm(true)} className="bg-gray-700 hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => {
              const daysToExpire = doc.expiration_date
                ? differenceInDays(new Date(doc.expiration_date), new Date())
                : null;
              const isExpired = daysToExpire !== null && daysToExpire < 0;
              const isExpiringSoon = daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 30;

              return (
                <Card key={doc.id} className={`hover:shadow-lg transition-shadow ${isExpired ? 'border-l-4 border-l-red-500' : isExpiringSoon ? 'border-l-4 border-l-amber-500' : ''}`}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                        <Badge className={`${typeColors[doc.document_type] || typeColors.other} mt-1`}>
                          {doc.document_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-gray-400 hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {doc.issuing_organization && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{doc.issuing_organization}</span>
                      </div>
                    )}

                    {doc.issue_date && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>Issued: {format(new Date(doc.issue_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}

                    {doc.expiration_date && (
                      <div className={`flex items-center gap-1.5 text-sm ${isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {isExpired
                            ? `Expired ${Math.abs(daysToExpire)} day${Math.abs(daysToExpire) !== 1 ? 's' : ''} ago`
                            : isExpiringSoon
                              ? `Expires in ${daysToExpire} day${daysToExpire !== 1 ? 's' : ''}`
                              : `Expires: ${format(new Date(doc.expiration_date), 'MMM d, yyyy')}`}
                        </span>
                      </div>
                    )}

                    {doc.related_entity_type && (
                      <p className="text-xs text-gray-500">
                        Related: {doc.related_entity_type}
                        {doc.related_entity_id ? ` (${doc.related_entity_id.substring(0, 8)}...)` : ''}
                      </p>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {doc.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">{doc.notes}</p>
                    )}

                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 pt-2 border-t"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View File
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <div className="sticky top-0 bg-white z-10 border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Document
                </h2>
                <Button variant="ghost" size="icon" onClick={() => { setShowUploadForm(false); setError(null); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-gray-700">
                          <Paperclip className="w-5 h-5" />
                          <span className="font-medium">{selectedFile.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(0)} KB
                        </p>
                        <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                          Choose Different File
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600">Click to upload a file</p>
                          <p className="text-sm text-gray-400">PDF, images, docs up to 10MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Tractor Insurance 2026"
                    className="bg-white"
                  />
                </div>

                {/* Document Type */}
                <div className="space-y-2">
                  <Label>Document Type *</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(v) => setFormData({ ...formData, document_type: v })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration Date</Label>
                    <Input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Issuing Organization */}
                <div className="space-y-2">
                  <Label>Issuing Organization</Label>
                  <Input
                    value={formData.issuing_organization}
                    onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
                    placeholder="e.g. State Farm, USDA"
                    className="bg-white"
                  />
                </div>

                {/* Related Entity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Related Entity Type</Label>
                    <Input
                      value={formData.related_entity_type}
                      onChange={(e) => setFormData({ ...formData, related_entity_type: e.target.value })}
                      placeholder="e.g. Livestock, Equipment"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Related Entity ID</Label>
                    <Input
                      value={formData.related_entity_id}
                      onChange={(e) => setFormData({ ...formData, related_entity_id: e.target.value })}
                      placeholder="Record ID"
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. important, renewal, tractor"
                    className="bg-white"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                    className="bg-white"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={uploading || !formData.title || !formData.document_type || !selectedFile}
                    className="flex-1 bg-gray-700 hover:bg-gray-800"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowUploadForm(false); setError(null); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}