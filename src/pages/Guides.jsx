import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Search,
  BookOpen,
  Leaf,
  Droplets,
  Sprout,
  Home as HomeIcon,
  Clock,
  BarChart3,
  ChevronRight,
  Wind,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkSubscription, FREE_GUIDE_LIMIT } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

import { getCurrentSeason, getSeasonName, getSeasonEmoji } from "@/components/utils/seasonUtils";
import SeasonSelector from "@/components/dashboard/SeasonSelector";

const categoryIcons = {
  composting: Wind,
  gardening: Sprout,
  raised_beds: BarChart3,
  biointensive: Leaf,
  harvesting: Leaf,
  livestock: HomeIcon,
  water_management: Droplets,
  greenhouse: HomeIcon,
  property_engineering: HomeIcon,
  seasonal_planning: Clock
};

const categoryColors = {
  composting: "bg-amber-100 text-amber-800 border-amber-200",
  gardening: "bg-green-100 text-green-800 border-green-200",
  raised_beds: "bg-emerald-100 text-emerald-800 border-emerald-200",
  biointensive: "bg-lime-100 text-lime-800 border-lime-200",
  harvesting: "bg-orange-100 text-orange-800 border-orange-200",
  livestock: "bg-blue-100 text-blue-800 border-blue-200",
  water_management: "bg-cyan-100 text-cyan-800 border-cyan-200",
  greenhouse: "bg-teal-100 text-teal-800 border-teal-200",
  property_engineering: "bg-purple-100 text-purple-800 border-purple-200",
  seasonal_planning: "bg-pink-100 text-pink-800 border-pink-200"
};

const difficultyColors = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700"
};

export default function Guides() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showPaywall, setShowPaywall] = useState(false);
  
  const autoSeason = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState(autoSeason);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ['guides'],
    queryFn: () => base44.entities.Guide.list(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - guides are static content
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || guide.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || guide.difficulty === selectedDifficulty;
    
    // Season filtering
    // Assuming guide.season is an array of season strings or 'year_round', or undefined
    const matchesSeason = !guide.season || 
                         (Array.isArray(guide.season) && (guide.season.includes(selectedSeason) || guide.season.includes('year_round')));
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesSeason;
  });

  const displayGuides = subscriptionData.isPro 
    ? filteredGuides 
    : filteredGuides.slice(0, FREE_GUIDE_LIMIT);

  const categories = [...new Set(guides.map(g => g.category))];
  const isLimitReached = !subscriptionData.isPro && filteredGuides.length > FREE_GUIDE_LIMIT;

  const handleGuideClick = (guideId) => {
    navigate(createPageUrl(`GuideDetail?id=${guideId}`));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Homesteading Guides</h1>
              <p className="text-gray-600 mt-1">
                Complete step-by-step instructions for every task
                {selectedSeason && <span className="ml-2">{getSeasonEmoji(selectedSeason)} {getSeasonName(selectedSeason)}</span>}
              </p>
            </div>
            {!subscriptionData.isPro && (
              <Button
                onClick={() => setShowPaywall(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock All
              </Button>
            )}
          </div>

          {/* Season Selector */}
          <SeasonSelector 
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
          />

          {!subscriptionData.isPro && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-1">
                    Free Preview Mode - Limited to {FREE_GUIDE_LIMIT} Guides
                  </h3>
                  <p className="text-sm text-purple-700 mb-3">
                    You're viewing {displayGuides.length} of {guides.length} available guides. 
                    Upgrade to access all {guides.length}+ expert guides and unlock premium features.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate(createPageUrl("Pricing"))}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    View Pricing
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            
            <Tabs value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <TabsList className="bg-white">
                <TabsTrigger value="all">All Levels</TabsTrigger>
                <TabsTrigger value="beginner">Beginner</TabsTrigger>
                <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              All Categories
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGuides.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No guides found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGuides.map(guide => {
                const Icon = categoryIcons[guide.category] || BookOpen;
                return (
                  <Card 
                    key={guide.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-none bg-white/80 backdrop-blur-sm"
                    onClick={() => handleGuideClick(guide.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[guide.category]?.replace('text-', 'bg-').replace('800', '200')}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        {guide.difficulty && (
                          <Badge className={difficultyColors[guide.difficulty]}>
                            {guide.difficulty}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="group-hover:text-green-700 transition-colors flex items-start justify-between">
                        <span>{guide.title}</span>
                        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-gray-600 text-sm line-clamp-2">{guide.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={categoryColors[guide.category]}>
                          {guide.category.replace(/_/g, ' ')}
                        </Badge>
                        {guide.time_estimate && (
                          <Badge variant="outline" className="text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {guide.time_estimate}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {isLimitReached && (
              <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-500 rounded-2xl flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {filteredGuides.length - FREE_GUIDE_LIMIT}+ More Guides Available
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Unlock all guides with detailed step-by-step instructions, expert tips, and comprehensive resources
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setShowPaywall(true)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Full guide library access"
        />
      </div>
    </div>
  );
}