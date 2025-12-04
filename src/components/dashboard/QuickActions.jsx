import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  BookOpen,
  Sprout,
  Droplets
} from "lucide-react";

const actions = [
  {
    icon: Plus,
    title: "Add New Task",
    description: "Create a checklist item",
    color: "bg-green-100 text-green-600",
    link: createPageUrl("Checklists")
  },
  {
    icon: BookOpen,
    title: "Browse Guides",
    description: "Explore all guides",
    color: "bg-blue-100 text-blue-600",
    link: createPageUrl("Guides")
  },
  {
    icon: Sprout,
    title: "Gardening Tips",
    description: "Learn best practices",
    color: "bg-emerald-100 text-emerald-600",
    link: createPageUrl("Guides")
  },
  {
    icon: Droplets,
    title: "Water Management",
    description: "Optimize resources",
    color: "bg-cyan-100 text-cyan-600",
    link: createPageUrl("Guides")
  }
];

export default function QuickActions() {
  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, idx) => (
            <Link key={idx} to={action.link}>
              <div className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm text-center text-gray-900">{action.title}</h4>
                <p className="text-xs text-gray-500 text-center mt-1">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}