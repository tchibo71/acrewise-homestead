import React, { useState, lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Sprout, 
  BookOpen, 
  Droplets,
  Sun,
  Leaf,
  Calendar,
  TrendingUp,
  ListChecks,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load non-critical components
const SeasonalGuide = lazy(() => import("../components/dashboard/SeasonalGuide"));
const QuickActions = lazy(() => import("../components/dashboard/QuickActions"));
const RecentActivity = lazy(() => import("@/components/dashboard/RecentActivity"));
const WeatherWidget = lazy(() => import("../components/dashboard/WeatherWidget"));
const SmartReorderAlert = lazy(() => import("../components/dashboard/SmartReorderAlert"));
const TeamCollaboration = lazy(() => import("../components/dashboard/TeamCollaboration"));

// Eagerly load critical above-the-fold components
import SeasonSelector from "../components/dashboard/SeasonSelector";
import FarmHealthScore from "../components/dashboard/FarmHealthScore";
import { getCurrentSeason, getSeasonName, getSeasonEmoji } from "@/components/utils/seasonUtils";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";
import DraftSyncManager from "@/components/offline/DraftSyncManager";

// Loading fallback component
const CardSkeleton = () => (
  <Card className="border-none shadow-lg bg-white/80">
    <CardContent className="p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const autoSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState(autoSeason);
  const [showPaywall, setShowPaywall] = useState(false);

  // Memoize callbacks to prevent child re-renders
  const handleUpgrade = React.useCallback(() => setShowPaywall(true), []);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['current-user-dashboard'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return null;
      return base44.auth.me();
    },
  });

  const { data: checklists = [], isLoading: checklistsLoading, isError: checklistsError } = useQuery({
    queryKey: ['dashboard-checklists'],
    queryFn: async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return [];
      return base44.entities.ChecklistItem.list('-created_date', 50);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - render stale instantly
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data, refetch in background
  });

  const { data: guides = [], isLoading: guidesLoading, isError: guidesError } = useQuery({
    queryKey: ['guides'],
    queryFn: () => base44.entities.Guide.list(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - static content
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Memoize computed values to prevent unnecessary recalculations
  const { completedTasks, totalTasks, completionRate, urgentTasks } = useMemo(() => {
    const completed = checklists.filter(item => item.completed).length;
    const total = checklists.length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    const urgent = checklists.filter(
      item => !item.completed && (item.priority === 'high' || item.priority === 'critical')
    ).length;
    return { completedTasks: completed, totalTasks: total, completionRate: rate, urgentTasks: urgent };
  }, [checklists]);

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-48 -translate-x-48" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sprout className="w-7 h-7" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {getSeasonEmoji(selectedSeason)} {getSeasonName(selectedSeason)} Season
                {selectedSeason === autoSeason && <span className="ml-1">(Auto)</span>}
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              Welcome to Your Homestead
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              Your complete guide to sustainable living, from garden to table.
            </p>
          </div>
        </div>

        {/* Farm Health Score - visible to all users */}
        <FarmHealthScore />

        {/* Draft Sync Manager - for offline entries */}
        {user && <DraftSyncManager userEmail={user.email} />}

        {/* Stats Grid - Render immediately with skeleton or cached data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Task Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklistsError ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Failed to load tasks</span>
                </div>
              ) : checklistsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-green-700">{completedTasks}</span>
                    <span className="text-gray-500 mb-1">/ {totalTasks}</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                  <p className="text-xs text-gray-500">{completionRate.toFixed(0)}% Complete</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Available Guides
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guidesError ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Failed to load guides</span>
                </div>
              ) : guidesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-emerald-700">{guides.length}</span>
                    <span className="text-gray-500 mb-1">guides</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Across all categories</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Urgent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklistsError ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Failed to load tasks</span>
                </div>
              ) : checklistsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-12" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2">
                    <span className={`text-3xl font-bold ${urgentTasks > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {urgentTasks}
                    </span>
                    <span className="text-gray-500 mb-1">pending</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">High priority items</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Season Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {selectedSeason === 'spring' && <Leaf className="w-8 h-8 text-green-500" />}
                {selectedSeason === 'summer' && <Sun className="w-8 h-8 text-yellow-500" />}
                {selectedSeason === 'fall' && <Leaf className="w-8 h-8 text-orange-500" />}
                {selectedSeason === 'winter' && <Droplets className="w-8 h-8 text-blue-500" />}
                {selectedSeason === 'year_round' && <Calendar className="w-8 h-8 text-gray-500" />}
                <span className="text-2xl font-bold text-gray-700 capitalize">{getSeasonName(selectedSeason)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Active season guides</p>
            </CardContent>
          </Card>
        </div>

        {/* Season Selector */}
        <SeasonSelector 
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
        />

        {/* Main Content Grid - Lazy loaded */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<CardSkeleton />}>
              <SeasonalGuide season={selectedSeason} guides={guides} />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <QuickActions />
            </Suspense>
          </div>
          
          <div className="space-y-6">
            <Suspense fallback={<CardSkeleton />}>
              <WeatherWidget />
            </Suspense>
            {subscriptionData.isPro && (
              <Suspense fallback={<CardSkeleton />}>
                <SmartReorderAlert />
              </Suspense>
            )}
            <Suspense fallback={<CardSkeleton />}>
              <TeamCollaboration 
                subscription={subscriptionData.subscription} 
                onUpgrade={handleUpgrade} 
              />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <RecentActivity />
            </Suspense>
          </div>
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Team Collaboration"
        />
      </div>
    </div>
  );
}