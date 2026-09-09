import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Weight,
  Activity,
  Syringe,
  Stethoscope,
  DollarSign,
  Calendar,
  TrendingUp,
  Heart,
  FileText,
  GitGraph,
  Baby,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

import AddWeightRecordModal from "../components/livestock/AddWeightRecordModal";
import AddVetVisitModal from "../components/livestock/AddVetVisitModal";
import AddVaccinationModal from "../components/livestock/AddVaccinationModal";
import AddProductionModal from "../components/livestock/AddProductionModal";
import EditLivestockModal from "../components/livestock/EditLivestockModal";
// New imports for breeding/lineage features
import LineageChart from "../components/livestock/LineageChart";
import BreedingManager from "../components/livestock/BreedingManager";
import EstrousCycleTracker from "../components/livestock/EstrousCycleTracker";
import AnimalTasksList from "../components/livestock/AnimalTasksList";
import ExportButtons from "../components/utils/ExportButtons";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";


import AnimalIcon from "../components/livestock/AnimalIcon";

const statusColors = {
  active: "bg-green-100 text-green-700 border-green-200",
  sold: "bg-blue-100 text-blue-700 border-blue-200",
  deceased: "bg-gray-100 text-gray-700 border-gray-200",
  butchered: "bg-orange-100 text-orange-700 border-orange-200"
};

export default function LivestockDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const livestockId = urlParams.get('id');

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: animal, isLoading: loadingAnimal } = useQuery({
    queryKey: ['livestock', livestockId],
    queryFn: async () => {
      const animals = await base44.entities.Livestock.list();
      return animals.find(a => a.id === livestockId);
    },
  });

  const { data: weightRecords = [] } = useQuery({
    queryKey: ['weight-records', livestockId],
    queryFn: async () => {
      const records = await base44.entities.WeightRecord.list('-measurement_date');
      return records.filter(r => r.livestock_id === livestockId);
    },
  });

  const { data: vetVisits = [] } = useQuery({
    queryKey: ['vet-visits', livestockId],
    queryFn: async () => {
      const visits = await base44.entities.VetVisit.list('-visit_date');
      return visits.filter(v => v.livestock_id === livestockId);
    },
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', livestockId],
    queryFn: async () => {
      const vax = await base44.entities.Vaccination.list('-vaccination_date');
      return vax.filter(v => v.livestock_id === livestockId);
    },
  });

  const { data: production = [] } = useQuery({
    queryKey: ['production', livestockId],
    queryFn: async () => {
      const prod = await base44.entities.Production.list('-production_date');
      return prod.filter(p => p.livestock_id === livestockId);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Livestock.delete(livestockId),
    onSuccess: () => {
      navigate(createPageUrl("LivestockManagement"));
    },
  });

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setDeleteConfirmOpen(false);
  };

  const getAge = () => {
    if (!animal?.birth_date) return "Unknown";
    const birth = new Date(animal.birth_date);
    const now = new Date();
    const months = Math.floor((now - birth) / (1000 * 60 * 60 * 24 * 30));
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo`;
  };

  const getWeightGain = () => {
    if (weightRecords.length < 2) return null;
    const latest = weightRecords[0].weight;
    const oldest = weightRecords[weightRecords.length - 1].weight;
    const gain = latest - oldest;
    const days = Math.floor((new Date(weightRecords[0].measurement_date) - new Date(weightRecords[weightRecords.length - 1].measurement_date)) / (1000 * 60 * 60 * 24));
    const avgPerDay = days > 0 ? gain / days : 0;
    return { total: gain, perDay: avgPerDay };
  };

  const upcomingVaccinations = vaccinations.filter(v => {
    if (!v.next_due_date) return false;
    const dueDate = new Date(v.next_due_date);
    const today = new Date();
    const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 30;
  });

  if (loadingAnimal) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading animal details...</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Animal not found</h2>
          <Button onClick={() => navigate(createPageUrl("LivestockManagement"))}>
            Back to Livestock
          </Button>
        </div>
      </div>
    );
  }

  const weightGain = getWeightGain();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl("LivestockManagement"))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Livestock
          </Button>
          <div className="flex gap-2 flex-wrap">
            <ExportButtons
              data={[{
                name: animal.name_or_tag,
                type: animal.animal_type,
                breed: animal.breed || '-',
                gender: animal.gender,
                status: animal.status,
                purpose: animal.purpose,
                birth_date: animal.birth_date || '-',
                current_weight: animal.current_weight ? `${animal.current_weight} ${animal.weight_unit}` : '-',
                acquisition_cost: animal.acquisition_cost ? `$${animal.acquisition_cost}` : '-',
                acquisition_date: animal.acquisition_date || '-',
                notes: animal.notes || '-'
              }]}
              columns={[
                { key: 'name', label: 'Name/Tag' },
                { key: 'type', label: 'Type' },
                { key: 'breed', label: 'Breed' },
                { key: 'gender', label: 'Gender' },
                { key: 'status', label: 'Status' },
                { key: 'purpose', label: 'Purpose' },
                { key: 'birth_date', label: 'Birth Date' },
                { key: 'current_weight', label: 'Current Weight' },
                { key: 'acquisition_cost', label: 'Acquisition Cost' },
                { key: 'acquisition_date', label: 'Acquisition Date' },
                { key: 'notes', label: 'Notes' }
              ]}
              title={`Livestock Record: ${animal.name_or_tag}`}
              subtitle={`Exported from Homestead Acres`}
              fileName={`livestock-${animal.name_or_tag.toLowerCase().replace(/\s+/g, '-')}`}
              variant="outline"
            />
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Animal Overview Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <AnimalIcon animal={animal} emojiClass="text-6xl" svgClass="w-16 h-16 text-blue-600" />
                <div>
                  <CardTitle className="text-3xl">{animal.name_or_tag}</CardTitle>
                  <p className="text-lg text-gray-600 capitalize mt-1">
                    {animal.breed || animal.animal_type.replace(/_/g, ' ')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={statusColors[animal.status]}>
                      {animal.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {animal.gender}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {animal.purpose}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Age</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {getAge()}
                </p>
                {animal.birth_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Born: {format(new Date(animal.birth_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Current Weight</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Weight className="w-4 h-4 text-gray-400" />
                  {animal.current_weight ? `${animal.current_weight} ${animal.weight_unit}` : 'Not recorded'}
                </p>
                {animal.birth_weight && (
                  <p className="text-xs text-gray-500 mt-1">
                    Birth: {animal.birth_weight} {animal.weight_unit}
                  </p>
                )}
              </div>

              {weightGain && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Weight Gain</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    {weightGain.total.toFixed(1)} {animal.weight_unit}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {weightGain.perDay.toFixed(2)} {animal.weight_unit}/day avg
                  </p>
                </div>
              )}

              {animal.acquisition_cost && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Acquisition Cost</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    ${animal.acquisition_cost.toFixed(2)}
                  </p>
                  {animal.acquisition_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(animal.acquisition_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {animal.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </p>
                <p className="text-gray-600 whitespace-pre-wrap">{animal.notes}</p>
              </div>
            )}

            {upcomingVaccinations.length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <Syringe className="w-4 h-4" />
                  Upcoming Vaccinations ({upcomingVaccinations.length})
                </p>
                {upcomingVaccinations.map(v => (
                  <p key={v.id} className="text-sm text-orange-700">
                    {v.vaccine_name} - Due {format(new Date(v.next_due_date), 'MMM d, yyyy')}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Records */}
        <Tabs defaultValue="weights" className="w-full">
          <TabsList className="flex flex-wrap w-full h-auto gap-1 p-1">
            <TabsTrigger value="weights" className="flex-1 min-w-[110px]">
              <Weight className="w-4 h-4 mr-2" />
              Weights
            </TabsTrigger>
            <TabsTrigger value="health" className="flex-1 min-w-[110px]">
              <Stethoscope className="w-4 h-4 mr-2" />
              Health
            </TabsTrigger>
            <TabsTrigger value="vaccinations" className="flex-1 min-w-[110px]">
              <Syringe className="w-4 h-4 mr-2" />
              Vaccinations
            </TabsTrigger>
            <TabsTrigger value="production" className="flex-1 min-w-[110px]">
              <Activity className="w-4 h-4 mr-2" />
              Production
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 min-w-[110px]">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="lineage" className="flex-1 min-w-[110px]">
              <GitGraph className="w-4 h-4 mr-2" />
              Lineage
            </TabsTrigger>
            <TabsTrigger value="breeding" className="flex-1 min-w-[110px]">
              <Baby className="w-4 h-4 mr-2" />
              Breeding
            </TabsTrigger>
          </TabsList>

          {/* Weight Records */}
          <TabsContent value="weights" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xl font-semibold">Weight History</h3>
              <div className="flex gap-2">
                {weightRecords.length > 0 && (
                  <ExportButtons
                    data={weightRecords}
                    columns={[
                      { key: 'measurement_date', label: 'Date' },
                      { key: 'weight', label: 'Weight' },
                      { key: 'weight_unit', label: 'Unit' },
                      { key: 'notes', label: 'Notes' }
                    ]}
                    title={`Weight Records: ${animal.name_or_tag}`}
                    subtitle="Homestead Acres Weight Tracking"
                    fileName={`weight-records-${animal.name_or_tag.toLowerCase().replace(/\s+/g, '-')}`}
                    variant="outline"
                    size="sm"
                  />
                )}
                <Button onClick={() => setShowWeightModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Weight Record
                </Button>
              </div>
            </div>

            {weightRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Weight className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No weight records yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {weightRecords.map(record => (
                  <Card key={record.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">
                            {record.weight} {record.weight_unit}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(record.measurement_date), 'MMMM d, yyyy')}
                          </p>
                          {record.notes && (
                            <p className="text-sm text-gray-500 mt-2">{record.notes}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Vet Visits */}
          <TabsContent value="health" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xl font-semibold">Veterinary History</h3>
              <div className="flex gap-2">
                {vetVisits.length > 0 && (
                  <ExportButtons
                    data={vetVisits}
                    columns={[
                      { key: 'visit_date', label: 'Date' },
                      { key: 'visit_type', label: 'Type' },
                      { key: 'veterinarian_name', label: 'Veterinarian' },
                      { key: 'diagnosis', label: 'Diagnosis' },
                      { key: 'treatment', label: 'Treatment' },
                      { key: 'cost', label: 'Cost', format: (v) => v ? `$${v}` : '-' }
                    ]}
                    title={`Vet Records: ${animal.name_or_tag}`}
                    subtitle="Homestead Acres Veterinary History"
                    fileName={`vet-records-${animal.name_or_tag.toLowerCase().replace(/\s+/g, '-')}`}
                    variant="outline"
                    size="sm"
                  />
                )}
                <Button onClick={() => setShowVetModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vet Visit
                </Button>
              </div>
            </div>

            {vetVisits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No vet visits recorded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {vetVisits.map(visit => (
                  <Card key={visit.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {visit.visit_type.replace(/_/g, ' ')}
                            </Badge>
                            <p className="text-sm text-gray-600">
                              {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {visit.veterinarian_name && (
                            <p className="text-sm text-gray-600 mb-1">
                              Dr. {visit.veterinarian_name}
                            </p>
                          )}
                          {visit.diagnosis && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-gray-700">Diagnosis:</p>
                              <p className="text-sm text-gray-600">{visit.diagnosis}</p>
                            </div>
                          )}
                          {visit.treatment && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-gray-700">Treatment:</p>
                              <p className="text-sm text-gray-600">{visit.treatment}</p>
                            </div>
                          )}
                          {visit.medications && visit.medications.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-gray-700">Medications:</p>
                              <ul className="text-sm text-gray-600 list-disc list-inside">
                                {visit.medications.map((med, idx) => (
                                  <li key={idx}>{med}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {visit.follow_up_date && (
                            <p className="text-sm text-orange-600 mt-2">
                              Follow-up: {format(new Date(visit.follow_up_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        {visit.cost && (
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${visit.cost.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Vaccinations */}
          <TabsContent value="vaccinations" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xl font-semibold">Vaccination Records</h3>
              <div className="flex gap-2">
                {vaccinations.length > 0 && (
                  <ExportButtons
                    data={vaccinations}
                    columns={[
                      { key: 'vaccination_date', label: 'Date Given' },
                      { key: 'vaccine_name', label: 'Vaccine' },
                      { key: 'next_due_date', label: 'Next Due' },
                      { key: 'administered_by', label: 'Administered By' },
                      { key: 'batch_number', label: 'Batch #' },
                      { key: 'cost', label: 'Cost', format: (v) => v ? `$${v}` : '-' }
                    ]}
                    title={`Vaccination Records: ${animal.name_or_tag}`}
                    subtitle="Homestead Acres Vaccination History"
                    fileName={`vaccination-records-${animal.name_or_tag.toLowerCase().replace(/\s+/g, '-')}`}
                    variant="outline"
                    size="sm"
                  />
                )}
                <Button onClick={() => setShowVaccinationModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vaccination
                </Button>
              </div>
            </div>

            {vaccinations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Syringe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No vaccinations recorded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {vaccinations.map(vax => (
                  <Card key={vax.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{vax.vaccine_name}</p>
                          <p className="text-sm text-gray-600">
                            Given: {format(new Date(vax.vaccination_date), 'MMM d, yyyy')}
                          </p>
                          {vax.next_due_date && (
                            <p className="text-sm text-orange-600 mt-1">
                              Next Due: {format(new Date(vax.next_due_date), 'MMM d, yyyy')}
                            </p>
                          )}
                          {vax.administered_by && (
                            <p className="text-xs text-gray-500 mt-2">
                              By: {vax.administered_by}
                            </p>
                          )}
                          {vax.batch_number && (
                            <p className="text-xs text-gray-500">
                              Batch: {vax.batch_number}
                            </p>
                          )}
                          {vax.notes && (
                            <p className="text-sm text-gray-600 mt-2">{vax.notes}</p>
                          )}
                        </div>
                        {vax.cost && (
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">${vax.cost.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Production */}
          <TabsContent value="production" className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-xl font-semibold">Production Records</h3>
              <div className="flex gap-2">
                {production.length > 0 && (
                  <ExportButtons
                    data={production}
                    columns={[
                      { key: 'production_date', label: 'Date' },
                      { key: 'production_type', label: 'Type' },
                      { key: 'quantity', label: 'Quantity' },
                      { key: 'unit', label: 'Unit' },
                      { key: 'quality_grade', label: 'Quality' },
                      { key: 'notes', label: 'Notes' }
                    ]}
                    title={`Production Records: ${animal.name_or_tag}`}
                    subtitle="Homestead Acres Production Tracking"
                    fileName={`production-records-${animal.name_or_tag.toLowerCase().replace(/\s+/g, '-')}`}
                    variant="outline"
                    size="sm"
                  />
                )}
                <Button onClick={() => setShowProductionModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Production
                </Button>
              </div>
            </div>

            {production.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No production records yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {production.map(prod => (
                  <Card key={prod.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {prod.production_type}
                            </Badge>
                            {prod.quality_grade && (
                              <Badge className="capitalize">{prod.quality_grade}</Badge>
                            )}
                          </div>
                          <p className="font-semibold text-lg">
                            {prod.quantity} {prod.unit}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(prod.production_date), 'MMMM d, yyyy')}
                          </p>
                          {prod.notes && (
                            <p className="text-sm text-gray-500 mt-2">{prod.notes}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* New Tab: Animal-Specific Tasks */}
          <TabsContent value="tasks">
            <AnimalTasksList animalId={livestockId} animalName={animal.name_or_tag} />
          </TabsContent>

          {/* New Tab: Lineage */}
          <TabsContent value="lineage">
            <LineageChart animal={animal} />
          </TabsContent>

          {/* New Tab: Breeding */}
          <TabsContent value="breeding">
            <div className="space-y-4">
              <BreedingManager animal={animal} />
              {animal.gender === 'female' && (
                <EstrousCycleTracker animal={animal} />
              )}
            </div>
          </TabsContent>

        </Tabs>

        {/* Modals */}
        {showWeightModal && (
          <AddWeightRecordModal
            livestockId={livestockId}
            onClose={() => setShowWeightModal(false)}
          />
        )}

        {showVetModal && (
          <AddVetVisitModal
            livestockId={livestockId}
            onClose={() => setShowVetModal(false)}
          />
        )}

        {showVaccinationModal && (
          <AddVaccinationModal
            livestockId={livestockId}
            animalName={animal?.name_or_tag}
            onClose={() => setShowVaccinationModal(false)}
          />
        )}

        {showProductionModal && (
          <AddProductionModal
            livestockId={livestockId}
            onClose={() => setShowProductionModal(false)}
          />
        )}

        {showEditModal && (
          <EditLivestockModal
            animal={animal}
            onClose={() => setShowEditModal(false)}
          />
        )}

        <ConfirmDeleteDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={confirmDelete}
          title="Delete Livestock"
          itemName={animal?.name_or_tag}
          description={`Are you sure you want to permanently delete ${animal?.name_or_tag}? This will also remove all associated records including weight history, vet visits, vaccinations, and production data.`}
        />
      </div>
    </div>
  );
}