import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Home,
  BookOpen,
  CheckSquare,
  Sprout,
  Menu,
  MessageSquare,
  Crown,
  DollarSign,
  Heart,
  LayoutGrid,
  Beaker,
  Map,
  Cloud,
  Package,
  Settings,
  Wrench,
  Milk,
  Gift,
  Sparkles
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { checkSubscription } from "@/components/utils/subscriptionUtils";

import { User } from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "Guides",
    url: createPageUrl("Guides"),
    icon: BookOpen,
  },
  {
    title: "My Tasks",
    url: createPageUrl("MyTasks"),
    icon: User,
    proOnly: true,
  },
  {
    title: "My Checklists",
    url: createPageUrl("Checklists"),
    icon: CheckSquare,
    proOnly: true,
  },
  {
    title: "Community Forum",
    url: createPageUrl("Forum"),
    icon: MessageSquare,
  },
  {
    title: "AI Scenario Analysis",
    url: createPageUrl("AIScenarioAnalysis"),
    icon: Sparkles,
    proOnly: true,
  },
  {
    title: "Weather",
    url: createPageUrl("WeatherDashboard"),
    icon: Cloud,
  },
  {
    title: "Property Map",
    url: createPageUrl("PropertyMap"),
    icon: Map,
    proOnly: true,
  },
  {
    title: "Farm Planning",
    url: createPageUrl("FarmPlanDashboard"),
    icon: LayoutGrid,
    proOnly: true,
  },
  {
    title: "Financials",
    url: createPageUrl("FinancialManagement"),
    icon: DollarSign,
    proOnly: true,
  },
  {
    title: "Referral Program",
    url: createPageUrl("ReferralProgram"),
    icon: Gift,
  },
  {
    title: "Pricing",
    url: createPageUrl("Pricing"),
    icon: Crown,
  },
];

const operationsItems = [
  {
    title: "Livestock",
    url: createPageUrl("LivestockManagement"),
    icon: Heart,
    proOnly: true,
  },
  {
    title: "Dairy Production",
    url: createPageUrl("DairyProduction"),
    icon: Milk,
    proOnly: true,
  },
  {
    title: "Fermentation",
    url: createPageUrl("FermentationTracking"),
    icon: Beaker,
    proOnly: true,
  },
  {
    title: "Inventory",
    url: createPageUrl("InventoryManagement"),
    icon: Package,
    proOnly: true,
  },
];

const infrastructureItems = [
  {
    title: "Equipment",
    url: createPageUrl("EquipmentManagement"),
    icon: Wrench,
    proOnly: true,
  },
  {
    title: "Maintenance",
    url: createPageUrl("MaintenancePlanning"),
    icon: Settings,
    proOnly: true,
  },
];

// Navigation content component to avoid duplication
function NavigationContent({ subscriptionData, location, onItemClick }) {
  return (
    <>
      {/* Navigation Group */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider px-3 py-2">
          Navigation
        </p>
        {navigationItems.map((item) => (
          <Link
            key={item.title}
            to={item.url}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              location.pathname === item.url
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm'
                : 'hover:bg-green-100 hover:text-green-800 text-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium flex-1">{item.title}</span>
            {item.proOnly && !subscriptionData.isPro && (
              <Crown className="w-4 h-4 text-purple-600" />
            )}
          </Link>
        ))}
      </div>

      {/* Operations Group */}
      <div className="space-y-1 mt-4">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider px-3 py-2">
          Operations
        </p>
        {operationsItems.map((item) => (
          <Link
            key={item.title}
            to={item.url}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              location.pathname === item.url
                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm'
                : 'hover:bg-blue-100 hover:text-blue-800 text-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium flex-1">{item.title}</span>
            {item.proOnly && !subscriptionData.isPro && (
              <Crown className="w-4 h-4 text-purple-600" />
            )}
          </Link>
        ))}
      </div>

      {/* Infrastructure Group */}
      <div className="space-y-1 mt-4">
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider px-3 py-2">
          Infrastructure
        </p>
        {infrastructureItems.map((item) => (
          <Link
            key={item.title}
            to={item.url}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              location.pathname === item.url
                ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 shadow-sm'
                : 'hover:bg-orange-100 hover:text-orange-800 text-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium flex-1">{item.title}</span>
            {item.proOnly && !subscriptionData.isPro && (
              <Crown className="w-4 h-4 text-purple-600" />
            )}
          </Link>
        ))}
      </div>

      {/* Subscription Status */}
      <div className="mt-6">
        {subscriptionData.isPro ? (
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-300">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-purple-700" />
              <span className="text-sm font-semibold text-purple-900">Pro Member</span>
            </div>
            <p className="text-xs text-purple-700">
              {subscriptionData.plan === "monthly" ? "Monthly Plan" : "Yearly Plan"}
            </p>
          </div>
        ) : (
          <Link to={createPageUrl("Pricing")} onClick={onItemClick}>
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Sprout className="w-4 h-4 text-green-700" />
                <span className="text-sm font-semibold text-green-900">Free Preview</span>
              </div>
              <p className="text-xs text-green-700 mb-2">
                Upgrade for full access
              </p>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded-md flex items-center justify-center gap-1">
                <Crown className="w-3 h-3" />
                Upgrade Now
              </button>
            </div>
          </Link>
        )}
      </div>

      {/* Settings */}
      <div className="mt-4 pt-4 border-t border-green-200">
        <Link
          to={createPageUrl("UserSettings")}
          onClick={onItemClick}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-green-100 hover:text-green-800 transition-all duration-200 rounded-lg text-gray-700"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false, plan: "free", status: "none" }
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-amber-50 via-green-50 to-emerald-50">
        {/* Desktop Sidebar - hidden below 1024px */}
        <Sidebar className="border-r border-green-200 bg-white/80 backdrop-blur-sm hidden lg:flex">
          <SidebarHeader className="border-b border-green-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-green-900">Homestead Acres</h2>
                <p className="text-xs text-green-600">Your Complete Homesteading Solution</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3 overflow-y-auto max-h-[calc(100vh-280px)]">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-green-700 uppercase tracking-wider px-3 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-green-100 hover:text-green-800 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm'
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.proOnly && !subscriptionData.isPro && (
                            <Crown className="w-4 h-4 ml-auto text-purple-600" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-blue-700 uppercase tracking-wider px-3 py-2">
                Operations
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {operationsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url
                            ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm'
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.proOnly && !subscriptionData.isPro && (
                            <Crown className="w-4 h-4 ml-auto text-purple-600" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-orange-700 uppercase tracking-wider px-3 py-2">
                Infrastructure
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {infrastructureItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-orange-100 hover:text-orange-800 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url
                            ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 shadow-sm'
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.proOnly && !subscriptionData.isPro && (
                            <Crown className="w-4 h-4 ml-auto text-purple-600" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupContent>
                {subscriptionData.isPro ? (
                  <div className="mx-3 p-3 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-300">
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-purple-700" />
                      <span className="text-sm font-semibold text-purple-900">Pro Member</span>
                    </div>
                    <p className="text-xs text-purple-700">
                      {subscriptionData.plan === "monthly" ? "Monthly Plan" : "Yearly Plan"}
                    </p>
                  </div>
                ) : (
                  <Link to={createPageUrl("Pricing")}>
                    <div className="mx-3 p-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Sprout className="w-4 h-4 text-green-700" />
                        <span className="text-sm font-semibold text-green-900">Free Preview</span>
                      </div>
                      <p className="text-xs text-green-700 mb-2">
                        Upgrade for full access
                      </p>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded-md flex items-center justify-center gap-1">
                        <Crown className="w-3 h-3" />
                        Upgrade Now
                      </button>
                    </div>
                  </Link>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-green-200">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to={createPageUrl("UserSettings")} className="flex items-center gap-3 px-3 py-2.5 hover:bg-green-100 hover:text-green-800 transition-all duration-200 rounded-lg">
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          {/* Mobile Header - visible below 1024px */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 px-4 py-3 lg:hidden sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Sheet */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-green-100">
                      <Menu className="w-6 h-6 text-green-700" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] p-0 bg-white">
                    <SheetHeader className="border-b border-green-200 p-4">
                      <SheetTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Sprout className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg text-green-900">Homestead Acres</p>
                          <p className="text-xs text-green-600 font-normal">Your Complete Homesteading Solution</p>
                        </div>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="p-4 overflow-y-auto max-h-[calc(100vh-100px)]">
                      <NavigationContent 
                        subscriptionData={subscriptionData} 
                        location={location}
                        onItemClick={() => setMobileMenuOpen(false)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-600" />
                  <h1 className="text-lg font-bold text-green-900">Homestead Acres</h1>
                </div>
              </div>
              {!subscriptionData.isPro && (
                <Link to={createPageUrl("Pricing")}>
                  <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium py-1.5 px-3 rounded-md flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Upgrade
                  </button>
                </Link>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}