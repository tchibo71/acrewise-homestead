import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Plus, Crown, LayoutGrid, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { format, isPast } from "date-fns";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "@/components/paywall/PaywallModal";
import AddMaintenanceModal from "@/components/farm-planning/AddMaintenanceModal";
import { useIsMobile } from "@/hooks/use-mobile";
import SummaryBand from "@/components/build-maintenance/SummaryBand";
import StructureCard from "@/components/build-maintenance/StructureCard";
import StructureDetailPanel from "@/components/build-maintenance/StructureDetailPanel";
import TimelineView from "@/components/build-maintenance/TimelineView";

export default function BuildMaintenance() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [view, setView] = useState("structures");
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [prefillData, setPrefillData] = useState({});
  const [showPaywall, setShowPaywall] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription"],
    queryFn: checkSubscription,
    initialData: { isPro: false },
  });

  const { data: farmProfiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["farm-profiles"],
    queryFn: () => base44.entities.FarmProfile.list(),
    enabled: subscriptionData.isPro,
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["maintenance-tasks"],
    queryFn: () => base44.entities.MaintenanceTask.list("-next_due"),
    enabled: subscriptionData.isPro,
  });

  const buildingTasks = allTasks.filter((t) => t.category === "buildings");

  const structures = farmProfiles.flatMap((profile) =>
    (profile.infrastructure || []).map((item, index) => ({
      ...item,
      syntheticId: `${profile.id}-${index}`,
      profileId: profile.id,
    }))
  );

  const structuresWithTasks = structures.map((s) => ({
    ...s,
    tasks: buildingTasks.filter((t) => t.related_infrastructure_id === s.syntheticId),
  }));

  const unassignedTasks = buildingTasks.filter(
    (t) =>
      !t.related_infrastructure_id ||
      !structures.some((s) => s.syntheticId === t.related_infrastructure_id)
  );

  const overdueCount = buildingTasks.filter(
    (t) => t.next_due && isPast(new Date(t.next_due)) && t.status !== "completed"
  ).length;

  const upcomingCount = buildingTasks.filter((t) => {
    if (!t.next_due) return false;
    const daysDiff = Math.floor(
      (new Date(t.next_due) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff >= 0 && daysDiff <= 30 && t.status !== "completed";
  }).length;

  const pendingCost = buildingTasks
    .filter((t) => t.status !== "completed")
    .reduce((sum, t) => sum + (t.estimated_cost || 0), 0);

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ task, completed }) => {
      const updates = completed
        ? { status: "completed", last_completed: format(new Date(), "yyyy-MM-dd") }
        : { status: "pending" };
      return base44.entities.MaintenanceTask.update(task.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-tasks"] });
    },
  });

  const handleAddTaskForStructure = (structure) => {
    setPrefillData({ category: "buildings", related_infrastructure_id: structure.syntheticId });
    setEditingTask(null);
    setShowAddModal(true);
  };

  const handleAddStandaloneTask = () => {
    setPrefillData({ category: "buildings" });
    setEditingTask(null);
    setShowAddModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setPrefillData({});
    setShowAddModal(true);
  };

  const handleToggleComplete = (task) => {
    const completed = task.status !== "completed";
    toggleCompleteMutation.mutate({ task, completed });
  };

  // Pro gate
  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32 bg-bm-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Build Maintenance</h1>
              <p className="text-gray-600 mt-1">Track building upkeep and scheduled maintenance</p>
            </div>
          </div>
          <div className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-xl p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Build Maintenance is a Pro Feature
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Upgrade to track building conditions, link maintenance tasks to structures, and
              visualize upcoming work
            </p>
            <Button
              size="lg"
              onClick={() => setShowPaywall(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-lg px-8 py-6"
            >
              <Crown className="w-5 h-5 mr-2" /> Upgrade to Pro
            </Button>
          </div>
          <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bm-surface p-4 md:p-8 pb-32 overflow-x-hidden">
      <div className="max-w-7xl mx-auto min-w-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#D97706] to-[#DC2626] rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1
                className="font-display font-semibold text-bm-primary leading-tight"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
              >
                Build Maintenance
              </h1>
              <p className="text-bm-muted font-body text-sm md:text-base mt-0.5">
                Track building upkeep, condition, and scheduled maintenance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleAddStandaloneTask}
              className="bg-bm-accent hover:bg-bm-accent/90 text-white shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Task
            </Button>
            {/* Segment toggle */}
            <div className="flex bg-bm-card border border-bm-border rounded-lg p-1">
              <button
                onClick={() => setView("structures")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors ${
                  view === "structures"
                    ? "bg-bm-accent text-white"
                    : "text-bm-muted hover:text-bm-primary"
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Structures
              </button>
              <button
                onClick={() => setView("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors ${
                  view === "timeline"
                    ? "bg-bm-accent text-white"
                    : "text-bm-muted hover:text-bm-primary"
                }`}
              >
                <Calendar className="w-4 h-4" /> Timeline
              </button>
            </div>
          </div>
        </div>

        {/* Summary band */}
        <SummaryBand
          totalStructures={structures.length}
          overdueCount={overdueCount}
          upcomingCount={upcomingCount}
          pendingCost={pendingCost}
        />

        {/* Main content */}
        {isLoadingProfiles ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-bm-border border-t-bm-accent rounded-full animate-spin" />
          </div>
        ) : view === "structures" ? (
          <div className="mt-6">
            {structures.length === 0 ? (
              <div className="border-2 border-dashed border-bm-border rounded-lg p-12 text-center">
                <Building2 className="w-12 h-12 text-bm-muted mx-auto mb-4" />
                <p className="text-bm-muted font-body mb-2">
                  No structures found in your Farm Profile
                </p>
                <p className="text-sm text-bm-muted font-body">
                  Add infrastructure entries in your Farm Profile to start tracking building
                  maintenance
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {structuresWithTasks.map((s) => {
                  const overdue = s.tasks.filter(
                    (t) =>
                      t.next_due && isPast(new Date(t.next_due)) && t.status !== "completed"
                  ).length;
                  const nextDue = s.tasks
                    .filter((t) => t.next_due && t.status !== "completed")
                    .sort((a, b) => new Date(a.next_due) - new Date(b.next_due))[0]?.next_due;
                  return (
                    <StructureCard
                      key={s.syntheticId}
                      structure={s}
                      taskCount={s.tasks.length}
                      overdueCount={overdue}
                      nextDueDate={nextDue}
                      onClick={() => setSelectedStructure(s)}
                    />
                  );
                })}
                {/* Unassigned tasks card */}
                {unassignedTasks.length > 0 && (
                  <div
                    className="border-2 border-dashed border-bm-border rounded-lg p-4 cursor-pointer hover:bg-bm-surface/50 transition-colors"
                    onClick={() =>
                      setSelectedStructure({
                        type: "Unassigned Tasks",
                        syntheticId: "__unassigned__",
                        tasks: unassignedTasks,
                      })
                    }
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-bm-amber" />
                      <h3
                        className="font-display font-semibold text-bm-muted"
                        style={{ fontSize: "1.125rem" }}
                      >
                        Unassigned Tasks
                      </h3>
                    </div>
                    <p className="text-sm text-bm-muted font-body">
                      {unassignedTasks.length} task{unassignedTasks.length !== 1 ? "s" : ""} not
                      linked to a specific structure
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <TimelineView
              tasks={buildingTasks}
              structures={structures}
              onEditTask={handleEditTask}
            />
          </div>
        )}
      </div>

      {/* Structure detail panel — Sheet on desktop, Drawer on mobile */}
      {selectedStructure &&
        (isMobile ? (
          <Drawer
            open={!!selectedStructure}
            onOpenChange={(open) => !open && setSelectedStructure(null)}
          >
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="text-left">
                <DrawerTitle className="font-display font-semibold text-bm-primary">
                  {selectedStructure.type}
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 overflow-y-auto">
                <StructureDetailPanel
                  structure={selectedStructure}
                  tasks={selectedStructure.tasks || []}
                  onAddTask={() => {
                    if (selectedStructure.syntheticId !== "__unassigned__") {
                      handleAddTaskForStructure(selectedStructure);
                    } else {
                      handleAddStandaloneTask();
                    }
                    setSelectedStructure(null);
                  }}
                  onEditTask={(task) => {
                    setSelectedStructure(null);
                    handleEditTask(task);
                  }}
                  onToggleComplete={handleToggleComplete}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Sheet
            open={!!selectedStructure}
            onOpenChange={(open) => !open && setSelectedStructure(null)}
          >
            <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-6">
              <SheetHeader className="mb-4">
                <SheetTitle className="font-display font-semibold text-bm-primary">
                  {selectedStructure.type}
                </SheetTitle>
              </SheetHeader>
              <StructureDetailPanel
                structure={selectedStructure}
                tasks={selectedStructure.tasks || []}
                onAddTask={() => {
                  if (selectedStructure.syntheticId !== "__unassigned__") {
                    handleAddTaskForStructure(selectedStructure);
                  } else {
                    handleAddStandaloneTask();
                  }
                  setSelectedStructure(null);
                }}
                onEditTask={(task) => {
                  setSelectedStructure(null);
                  handleEditTask(task);
                }}
                onToggleComplete={handleToggleComplete}
              />
            </SheetContent>
          </Sheet>
        ))}

      {/* Add/Edit task modal */}
      {showAddModal && (
        <AddMaintenanceModal
          task={editingTask}
          prefill={prefillData}
          onClose={() => {
            setShowAddModal(false);
            setEditingTask(null);
            setPrefillData({});
          }}
        />
      )}
    </div>
  );
}