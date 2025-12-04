import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, Sparkles, X, Lock } from "lucide-react";

const PRO_FEATURES = [
  "Unlimited Checklists & Task Management",
  "AI-Powered Scenario Analysis",
  "Interactive Property Mapping",
  "Complete Farm Business Planning",
  "Full Livestock Management Suite",
  "Dairy & Production Tracking",
  "Fermentation Batch Tracking",
  "Inventory & Equipment Management",
  "Financial Reports & Analytics",
  "Data Export & Print Reports",
  "Priority Customer Support",
  "Team Collaboration (Farm Team Plan)"
];

const FREE_LIMITATIONS = [
  "Limited to 3 guides",
  "Read-only forum access",
  "No checklist creation",
  "No livestock tracking",
  "No financial tools"
];

export default function PaywallModal({ isOpen, onClose, feature }) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate(createPageUrl("Pricing"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Crown className="w-8 h-8 text-yellow-300" />
          </div>
          <DialogTitle className="text-2xl md:text-3xl font-bold mb-2">
            Unlock Your Farm's Full Potential
          </DialogTitle>
          <p className="text-purple-100 text-lg">
            {feature ? (
              <><span className="font-semibold text-white">{feature}</span> is a Pro feature</>
            ) : (
              "This feature requires a Pro subscription"
            )}
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Free Tier - What you're missing */}
            <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-700">Free Preview</h3>
                  <p className="text-xs text-gray-500">Current limitations</p>
                </div>
              </div>
              <div className="space-y-2">
                {FREE_LIMITATIONS.map((limitation, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tier - What you gain */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border-2 border-purple-300 relative">
              <div className="absolute -top-3 right-4">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">Pro Access</h3>
                  <p className="text-xs text-purple-600">Starting at $2.99/mo</p>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {PRO_FEATURES.map((proFeature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{proFeature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 text-center">
            <p className="text-green-800 font-medium">
              🌱 Join thousands of homesteaders managing their farms smarter, not harder
            </p>
            <p className="text-green-600 text-sm mt-1">
              Save hours every week with automated tracking, AI insights, and professional reports
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-lg py-6 shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Upgrade to Pro
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="sm:w-auto px-8 py-6 border-gray-300 text-gray-600"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Cancel anytime • 100% satisfaction guaranteed • Secure payment
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}