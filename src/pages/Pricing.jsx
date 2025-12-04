import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Check, 
  Sparkles,
  Zap,
  Lock,
  Unlock,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free Tier",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Unlock,
    color: "from-gray-500 to-gray-600",
    features: [
      "Dashboard & Farm Health Score",
      "View 3 guides",
      "Read-only forum access",
      "Basic weather forecasts"
    ],
    limitations: [
      "No checklist creation",
      "Cannot post in forum",
      "No financial tools",
      "No AI features"
    ],
    planKey: "free"
  },
  {
    name: "Harmony Pro",
    monthlyPrice: 9.99,
    annualPrice: 99.90, // 10 months
    icon: Zap,
    color: "from-green-500 to-emerald-600",
    popular: true,
    features: [
      "Unlimited guide access",
      "Full checklist & task management",
      "COGS & financial tracking",
      "AI Diagnostic Center",
      "AI Scenario Analysis",
      "Complete planning suite",
      "Inventory & equipment management",
      "Forum posting & interaction",
      "Data export (CSV & PDF)"
    ],
    planKey: "pro"
  },
  {
    name: "Farm Team",
    monthlyPrice: 24.99,
    annualPrice: 249.90, // 10 months
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    features: [
      "All Harmony Pro features",
      "3 user seats total",
      "Full Row-Level Security",
      "Shared farm data & records",
      "Team task assignments",
      "Advanced export & audit trails",
      "Business-ready reports"
    ],
    teamPlan: true,
    planKey: "team"
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const subs = await base44.entities.Subscription.filter({ created_by: currentUser.email });
        if (subs.length > 0) {
          setCurrentSubscription(subs[0]);
        }
      } catch (error) {
        console.log("User not logged in");
      }
    };
    fetchUserAndSubscription();
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async ({ planKey, billing }) => {
      const isYearly = billing === "annual";
      const endDate = isYearly
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const plan = planKey === "team" 
        ? (isYearly ? "team_yearly" : "team_monthly")
        : planKey === "pro"
        ? (isYearly ? "yearly" : "monthly")
        : "free";
      
      const isTeamPlan = planKey === "team";
      
      if (currentSubscription) {
        return await base44.entities.Subscription.update(currentSubscription.id, {
          plan,
          status: "active",
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate,
          team_member_emails: isTeamPlan ? (currentSubscription.team_member_emails || []) : []
        });
      } else {
        return await base44.entities.Subscription.create({
          plan,
          status: "active",
          start_date: new Date().toISOString().split('T')[0],
          end_date: endDate,
          team_member_emails: []
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      navigate(createPageUrl("Dashboard"));
    },
  });

  const handleSubscribe = (planKey) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    // In production, this would integrate with Stripe
    subscribeMutation.mutate({ planKey, billing: isAnnual ? "annual" : "monthly" });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our free preview, upgrade anytime to unlock the full homesteading experience
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-lg font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-16 h-8 rounded-full transition-colors ${isAnnual ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnnual ? 'translate-x-9' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-lg font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              <Badge className="ml-2 bg-green-100 text-green-700 border-green-300">Save 17%</Badge>
            </span>
          </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
          {plans.map((plan) => {
                const Icon = plan.icon;
                const currentPlanKey = currentSubscription?.plan;
                const isCurrent = plan.planKey === "free" 
                  ? currentPlanKey === "free" || !currentSubscription
                  : plan.planKey === "pro"
                  ? currentPlanKey === "monthly" || currentPlanKey === "yearly"
                  : currentPlanKey === "team_monthly" || currentPlanKey === "team_yearly";

                const displayPrice = plan.monthlyPrice === 0 
                  ? "$0" 
                  : isAnnual 
                  ? `$${(plan.annualPrice / 12).toFixed(2)}`
                  : `$${plan.monthlyPrice.toFixed(2)}`;

                const billingNote = plan.monthlyPrice === 0
                  ? "forever"
                  : isAnnual
                  ? `Billed annually at $${plan.annualPrice.toFixed(2)}`
                  : "per month";

                return (
                  <Card 
                    key={plan.planKey}
                    className={`relative overflow-hidden transition-all duration-300 ${
                      plan.popular 
                        ? 'border-green-500 border-2 shadow-2xl scale-105' 
                        : 'border-gray-200 hover:shadow-xl'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 text-sm font-semibold">
                        MOST POPULAR
                      </div>
                    )}

                    <CardHeader className="pb-8 pt-8">
                      <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <CardTitle className="text-2xl text-center">{plan.name}</CardTitle>

                      <div className="text-center mt-4">
                        <div className="flex items-end justify-center gap-2">
                          <span className="text-5xl font-bold text-gray-900">{displayPrice}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{plan.monthlyPrice > 0 ? "per month" : ""}</p>
                        <p className="text-sm text-gray-500 mt-1">{billingNote}</p>
                        {isAnnual && plan.monthlyPrice > 0 && (
                          <Badge className="mt-2 bg-green-100 text-green-700 border-green-300">
                            Save 2 months
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {plan.limitations && (
                        <div className="pt-4 border-t space-y-3">
                          {plan.limitations.map((limitation, i) => (
                            <div key={i} className="flex items-start gap-3 opacity-60">
                              <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-600 text-sm">{limitation}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            : plan.teamPlan
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        } text-white shadow-lg`}
                        onClick={() => handleSubscribe(plan.planKey)}
                        disabled={isCurrent || subscribeMutation.isPending}
                      >
                        {isCurrent 
                          ? "Current Plan" 
                          : subscribeMutation.isPending 
                          ? "Processing..." 
                          : plan.planKey === "free" 
                          ? "Start Free Preview" 
                          : plan.teamPlan
                          ? "Start Team Plan"
                          : "Subscribe Now"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
        </div>

        {/* Features Comparison */}
        <Card className="mt-16 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">What's Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-gray-50">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-500 rounded-xl flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Free Tier</h3>
                <p className="text-gray-600 text-sm">
                  Explore the dashboard, view guides, and build the homesteading habit. Great for beginners!
                </p>
              </div>

              <div className="text-center p-6 rounded-lg bg-green-50 border-2 border-green-300">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Harmony Pro</h3>
                <p className="text-gray-600 text-sm">
                  Financial independence with COGS tracking, AI diagnostics, scenario analysis, and full planning tools.
                </p>
              </div>

              <div className="text-center p-6 rounded-lg bg-blue-50 border-2 border-blue-300">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Farm Team</h3>
                <p className="text-gray-600 text-sm">
                  Scale your operation with 3 user seats, full RLS security, and advanced export/audit capabilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            Questions about pricing? <a href="mailto:support@homesteadhub.com" className="text-green-600 hover:text-green-700 font-semibold">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}