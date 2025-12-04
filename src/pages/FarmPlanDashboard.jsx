import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutGrid,
  Target,
  History,
  MapPin,
  DollarSign,
  TrendingUp,
  Sprout,
  Package,
  Crown,
  CheckCircle2
} from "lucide-react";
import FarmTimeline from "../components/farm-planning/FarmTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkSubscription } from "@/components/utils/subscriptionUtils";
import PaywallModal from "../components/paywall/PaywallModal";

const planSections = [
  {
    title: "Farm Profile",
    icon: MapPin,
    description: "Location, acreage, soil types, infrastructure with AI recommendations",
    link: "FarmProfile",
    color: "from-blue-500 to-blue-600"
  },
  {
    title: "Goals & Objectives",
    icon: Target,
    description: "Track goals with progress monitoring",
    link: "FarmGoals",
    color: "from-green-500 to-green-600"
  },
  {
    title: "Farm History",
    icon: History,
    description: "Operations history, successes, failures, emergencies",
    link: "FarmHistory",
    color: "from-purple-500 to-purple-600"
  },
  {
    title: "Maintenance Planning",
    icon: CheckCircle2,
    description: "Ongoing, seasonal, and recurring maintenance tasks",
    link: "MaintenancePlanning",
    color: "from-orange-500 to-orange-600"
  },
  {
    title: "Financial Planning",
    icon: DollarSign,
    description: "Startup costs, budgets, forecasts, ROI analysis",
    link: "FinancialPlanning",
    color: "from-emerald-500 to-emerald-600"
  },
  {
    title: "Crop Management",
    icon: Sprout,
    description: "Planting plans, rotation, soil health, pest management",
    link: "CropManagement",
    color: "from-lime-500 to-lime-600"
  },
  {
    title: "Marketing & Sales",
    icon: Package,
    description: "Products, channels, branding, AI market analysis",
    link: "MarketingPlanning",
    color: "from-pink-500 to-pink-600"
  },
  {
    title: "Financial Reports",
    icon: TrendingUp,
    description: "Balance sheets, cash flow, ROI, 5-year projections",
    link: "FinancialReports",
    color: "from-indigo-500 to-indigo-600"
  }
];

export default function FarmPlanDashboard() {
  const [showPaywall, setShowPaywall] = React.useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false }
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['farm-goals'],
    queryFn: () => base44.entities.FarmGoal.list(),
    enabled: subscriptionData.isPro
  });

  const { data: maintenanceTasks = [] } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: () => base44.entities.MaintenanceTask.list(),
    enabled: subscriptionData.isPro
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
    enabled: subscriptionData.isPro
  });

  const activeGoals = goals.filter(g => g.status === "in_progress").length;
  const overdueTasks = maintenanceTasks.filter(t => {
    if (!t.next_due) return false;
    return new Date(t.next_due) < new Date() && t.status !== "completed";
  }).length;
  const currentYearBudgets = budgets.filter(b => b.year === new Date().getFullYear()).length;

  if (!subscriptionData.isPro) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Farm Business Planning</h1>
              <p className="text-gray-600 mt-1">Comprehensive management system with AI-powered recommendations</p>
            </div>
          </div>

          <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Farm Business Planning is a Pro Feature
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Upgrade to access comprehensive business planning tools with AI-powered recommendations for goals, budgets, crop planning, marketing strategies, and 5-year financial projections
              </p>

              <div className="max-w-md mx-auto mb-8 bg-white rounded-xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">With Pro, you get:</h3>
                <ul className="space-y-3 text-left">
                  {[
                    "Complete farm profile with AI recommendations",
                    "Goal tracking with progress monitoring",
                    "Detailed farm history and records",
                    "Maintenance planning by frequency",
                    "Startup & operating cost tracking",
                    "Enterprise-specific budgets",
                    "5-year financial projections",
                    "AI-powered crop & rotation planning",
                    "Soil health & nutrient management",
                    "Pest & disease management",
                    "Marketing & sales strategies",
                    "Customer analysis & branding"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                onClick={() => setShowPaywall(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg px-8 py-6"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro - Starting at $2.99/mo
              </Button>
            </CardContent>
          </Card>

          <PaywallModal
            isOpen={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="Farm Business Planning"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Farm Business Planning</h1>
            <p className="text-gray-600 mt-1">Comprehensive management with AI recommendations</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Goals</p>
                  <p className="text-2xl font-bold text-green-700">{activeGoals}</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-orange-700">{overdueTasks}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Budgets</p>
                  <p className="text-2xl font-bold text-blue-700">{currentYearBudgets}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planning Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planSections.map((section) => (
            <Link key={section.title} to={createPageUrl(section.link)}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-none bg-white/80 backdrop-blur-sm h-full">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="group-hover:text-green-700 transition-colors">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Farm Timeline */}
        <FarmTimeline limit={5} />

        {/* AI Features Badge */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  AI-Powered Recommendations
                  <Badge className="bg-purple-100 text-purple-700">NEW</Badge>
                </h3>
                <p className="text-gray-600 text-sm">
                  Get intelligent recommendations for farm layout, crop rotations, pest management, market analysis, and financial forecasting powered by advanced AI
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}