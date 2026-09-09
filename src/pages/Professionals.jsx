import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Stethoscope,
  Footprints,
  Wrench,
  Zap,
  Droplets,
  Fence,
  Truck,
  Leaf,
  Apple,
  Calculator,
  Tractor,
  HelpCircle,
  Plus,
  Loader2,
  X,
  Trash2,
  Phone,
  Mail,
  Star,
  Calendar,
  Filter,
  ClipboardList
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
import { useToast } from "@/components/ui/use-toast";

const PROFESSION_TYPES = [
  { value: "veterinarian", label: "Veterinarian", icon: Stethoscope },
  { value: "farrier", label: "Farrier", icon: Footprints },
  { value: "mechanic", label: "Mechanic", icon: Wrench },
  { value: "electrician", label: "Electrician", icon: Zap },
  { value: "plumber", label: "Plumber", icon: Droplets },
  { value: "fence_contractor", label: "Fence Contractor", icon: Fence },
  { value: "excavator", label: "Excavator", icon: Truck },
  { value: "agronomist", label: "Agronomist", icon: Leaf },
  { value: "nutritionist", label: "Nutritionist", icon: Apple },
  { value: "accountant", label: "Accountant", icon: Calculator },
  { value: "equipment_dealer", label: "Equipment Dealer", icon: Tractor },
  { value: "other", label: "Other", icon: HelpCircle },
];

const profIcon = (type) => PROFESSION_TYPES.find(p => p.value === type)?.icon || HelpCircle;

export default function Professionals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [visitModal, setVisitModal] = useState(null);
  const [visitForm, setVisitForm] = useState({ title: "", description: "", financial_impact: "", visit_date: new Date().toISOString().split("T")[0] });
  const [formData, setFormData] = useState({
    name: "",
    profession_type: "",
    business_name: "",
    phone: "",
    email: "",
    service_area_notes: "",
    last_service_date: "",
    rating: "",
    notes: "",
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => base44.entities.Professional.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Professional.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setShowForm(false);
      setFormData({ name: "", profession_type: "", business_name: "", phone: "", email: "", service_area_notes: "", last_service_date: "", rating: "", notes: "" });
      toast({ title: "Professional added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Professional.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast({ title: "Professional removed" });
    },
  });

  const visitMutation = useMutation({
    mutationFn: (data) => base44.entities.FarmHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setVisitModal(null);
      setVisitForm({ title: "", description: "", financial_impact: "", visit_date: new Date().toISOString().split("T")[0] });
      toast({ title: "Visit logged to farm history" });
    },
  });

  const filtered = useMemo(() => {
    if (filterType === "all") return professionals;
    return professionals.filter(p => p.profession_type === filterType);
  }, [professionals, filterType]);

  const handleSubmit = () => {
    if (!formData.name || !formData.profession_type) return;
    const payload = { ...formData };
    if (payload.rating) payload.rating = Number(payload.rating);
    if (payload.last_service_date === "") delete payload.last_service_date;
    if (user?.email) payload.team_owner_email = user.email;
    createMutation.mutate(payload);
  };

  const handleDelete = (id) => {
    if (confirm("Remove this professional from your directory?")) {
      deleteMutation.mutate(id);
    }
  };

  const openVisitModal = (prof) => {
    const ProfIcon = profIcon(prof.profession_type);
    setVisitModal(prof);
    setVisitForm({
      title: `Visit from ${prof.name}${prof.business_name ? ` (${prof.business_name})` : ""}`,
      description: "",
      financial_impact: "",
      visit_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleVisitSubmit = () => {
    if (!visitModal || !visitForm.title) return;
    const payload = {
      event_date: visitForm.visit_date || new Date().toISOString().split("T")[0],
      event_type: "professional_visit",
      title: visitForm.title,
      description: visitForm.description || undefined,
      financial_impact: visitForm.financial_impact ? Number(visitForm.financial_impact) : undefined,
      related_entities: [visitModal.id],
    };
    visitMutation.mutate(payload);

    // Also update last_service_date on the professional
    base44.entities.Professional.update(visitModal.id, { last_service_date: visitForm.visit_date || new Date().toISOString().split("T")[0] });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Professionals</h1>
              <p className="text-gray-600 mt-1">{professionals.length} contact{professionals.length !== 1 ? 's' : ''} in your directory</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Professional
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Professions</SelectItem>
              {PROFESSION_TYPES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterType !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setFilterType("all")}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {professionals.length === 0 ? "No professionals yet" : "No matches for this filter"}
              </h3>
              <p className="text-gray-500 mb-4">
                {professionals.length === 0
                  ? "Add vets, farriers, mechanics, and other service providers to your directory"
                  : "Try a different profession type or clear the filter"}
              </p>
              {professionals.length === 0 && (
                <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Professional
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(prof => {
              const ProfIcon = profIcon(prof.profession_type);
              return (
                <Card key={prof.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ProfIcon className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{prof.name}</h3>
                            {prof.business_name && (
                              <p className="text-sm text-gray-500 truncate">{prof.business_name}</p>
                            )}
                          </div>
                          <button onClick={() => handleDelete(prof.id)} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <Badge variant="outline" className="capitalize mt-1.5 bg-gray-50">
                          {prof.profession_type.replace(/_/g, " ")}
                        </Badge>

                        {/* Contact info */}
                        <div className="space-y-1 mt-2 text-sm text-gray-600">
                          {prof.phone && (
                            <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {prof.phone}</p>
                          )}
                          {prof.email && (
                            <p className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {prof.email}</p>
                          )}
                          {prof.last_service_date && (
                            <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 flex-shrink-0" /> Last: {prof.last_service_date}</p>
                          )}
                        </div>

                        {/* Rating */}
                        {prof.rating != null && prof.rating > 0 && (
                          <div className="flex items-center gap-0.5 mt-2">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className={`w-3.5 h-3.5 ${n <= prof.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                            ))}
                          </div>
                        )}

                        {prof.service_area_notes && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{prof.service_area_notes}</p>
                        )}
                        {prof.notes && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prof.notes}</p>
                        )}

                        {/* Log a Visit */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full text-teal-700 border-teal-200 hover:bg-teal-50"
                          onClick={() => openVisitModal(prof)}
                        >
                          <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                          Log a Visit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white">
              <div className="sticky top-0 bg-white z-10 border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Professional
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Dr. John Smith" className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>Profession Type *</Label>
                  <Select value={formData.profession_type} onValueChange={(v) => setFormData({ ...formData, profession_type: v })}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select profession" /></SelectTrigger>
                    <SelectContent>
                      {PROFESSION_TYPES.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2"><p.icon className="w-4 h-4" /> {p.label}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} placeholder="e.g. Smith Veterinary Clinic" className="bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="555-1234" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="name@example.com" className="bg-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Service Area Notes</Label>
                  <Input value={formData.service_area_notes} onChange={(e) => setFormData({ ...formData, service_area_notes: e.target.value })} placeholder="Counties served, travel radius, etc." className="bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Last Service Date</Label>
                    <Input type="date" value={formData.last_service_date} onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value })} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating (1-5)</Label>
                    <Select value={formData.rating} onValueChange={(v) => setFormData({ ...formData, rating: v })}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select rating" /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} star{n !== 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Specialties, availability, pricing..." className="bg-white" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSubmit} disabled={!formData.name || !formData.profession_type || createMutation.isPending} className="flex-1 bg-teal-600 hover:bg-teal-700">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    {createMutation.isPending ? "Adding..." : "Add Professional"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Visit Modal */}
        {visitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white">
              <div className="sticky top-0 bg-white z-10 border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-teal-600" />
                  Log a Visit
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setVisitModal(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800">
                  Logging a visit for <span className="font-semibold">{visitModal.name}</span> ({visitModal.profession_type.replace(/_/g, " ")})
                  <br />
                  <span className="text-xs text-teal-600">This creates a record in your Farm History and updates their last service date.</span>
                </div>

                <div className="space-y-2">
                  <Label>Visit Title *</Label>
                  <Input value={visitForm.title} onChange={(e) => setVisitForm({ ...visitForm, title: e.target.value })} className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>Visit Date *</Label>
                  <Input type="date" value={visitForm.visit_date} onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })} className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={visitForm.description} onChange={(e) => setVisitForm({ ...visitForm, description: e.target.value })} placeholder="What was done, outcomes, follow-up needed..." className="bg-white" />
                </div>

                <div className="space-y-2">
                  <Label>Financial Impact ($)</Label>
                  <Input type="number" value={visitForm.financial_impact} onChange={(e) => setVisitForm({ ...visitForm, financial_impact: e.target.value })} placeholder="Cost or value of service" className="bg-white" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleVisitSubmit} disabled={!visitForm.title || visitMutation.isPending} className="flex-1 bg-teal-600 hover:bg-teal-700">
                    {visitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}
                    {visitMutation.isPending ? "Logging..." : "Log Visit"}
                  </Button>
                  <Button variant="outline" onClick={() => setVisitModal(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}