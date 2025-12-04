import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Crown,
  UserPlus,
  MessageSquare,
  CheckSquare,
  Activity,
  Lock,
  Settings
} from "lucide-react";

export default function TeamCollaboration({ subscription, onUpgrade }) {
  const isTeamPlan = subscription?.plan === "team_monthly" || subscription?.plan === "team_yearly";

  const { data: user } = useQuery({
    queryKey: ['current-user-team'],
    queryFn: () => base44.auth.me(),
    enabled: isTeamPlan,
  });

  const { data: teamTasks = [] } = useQuery({
    queryKey: ['team-tasks'],
    queryFn: async () => {
      if (!user?.email) return [];
      // Get tasks where user is team owner or assigned
      const tasks = await base44.entities.ChecklistItem.filter({
        $or: [
          { team_owner_email: user.email },
          { assigned_to_email: user.email }
        ]
      }, '-created_date', 5);
      return tasks;
    },
    enabled: isTeamPlan && !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  // Non-team users see locked preview
  if (!isTeamPlan) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="absolute top-3 right-3">
          <Badge className="bg-blue-600 text-white">
            <Users className="w-3 h-3 mr-1" />
            Team Tier
          </Badge>
        </div>
        
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Team Collaboration
            <Lock className="w-4 h-4 text-gray-400 ml-1" />
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm">
            Work together with family or staff on your homestead operations.
          </p>
          
          {/* Blurred preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-lg" />
            <div className="space-y-3 opacity-50">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="flex -space-x-2">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="bg-green-500 text-white text-xs">SM</AvatarFallback>
                  </Avatar>
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarFallback className="bg-purple-500 text-white text-xs">+1</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-sm text-gray-600">3 team members</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded text-center">
                  <p className="text-lg font-bold text-blue-600">12</p>
                  <p className="text-xs text-gray-500">Shared Tasks</p>
                </div>
                <div className="p-2 bg-white rounded text-center">
                  <p className="text-lg font-bold text-green-600">5</p>
                  <p className="text-xs text-gray-500">Completed Today</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features list */}
          <div className="space-y-2 pt-2">
            {[
              { icon: UserPlus, text: "3 user seats included" },
              { icon: CheckSquare, text: "Assign tasks to team members" },
              { icon: Activity, text: "Activity logs & audit trails" },
              { icon: MessageSquare, text: "Shared notes & comments" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <feature.icon className="w-4 h-4 text-blue-500" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Team Plan
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            Starting at $24.99/month for 3 seats
          </p>
        </CardContent>
      </Card>
    );
  }

  // Team tier users see full collaboration widget
  const teamMembers = subscription?.team_member_emails || [];
  const assignedTasks = teamTasks.filter(t => t.assigned_to_email && !t.completed);
  const completedToday = teamTasks.filter(t => {
    if (!t.completed || !t.completed_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.completed_date === today;
  });

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Team Collaboration
          </CardTitle>
          <Link to={createPageUrl("UserSettings")}>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Team Members */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  {user?.full_name?.charAt(0) || 'Y'}
                </AvatarFallback>
              </Avatar>
              {teamMembers.slice(0, 2).map((email, idx) => (
                <Avatar key={idx} className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className={`${idx === 0 ? 'bg-green-500' : 'bg-purple-500'} text-white text-xs`}>
                    {email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {teamMembers.length + 1} of 3 seats used
            </span>
          </div>
          
          {teamMembers.length < 2 && (
            <Link to={createPageUrl("UserSettings")}>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                <UserPlus className="w-4 h-4 mr-1" />
                Invite
              </Button>
            </Link>
          )}
        </div>
        
        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white rounded-lg text-center shadow-sm">
            <p className="text-xl font-bold text-blue-600">{assignedTasks.length}</p>
            <p className="text-xs text-gray-500">Active Tasks</p>
          </div>
          <div className="p-3 bg-white rounded-lg text-center shadow-sm">
            <p className="text-xl font-bold text-green-600">{completedToday.length}</p>
            <p className="text-xs text-gray-500">Done Today</p>
          </div>
          <div className="p-3 bg-white rounded-lg text-center shadow-sm">
            <p className="text-xl font-bold text-purple-600">{teamMembers.length + 1}</p>
            <p className="text-xs text-gray-500">Members</p>
          </div>
        </div>
        
        {/* Recent Team Activity */}
        {assignedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Recent Assignments</p>
            {assignedTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 bg-white rounded-lg text-sm">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <span className="flex-1 truncate">{task.title}</span>
                <Badge variant="outline" className="text-xs">
                  {task.assigned_to_email?.split('@')[0]}
                </Badge>
              </div>
            ))}
          </div>
        )}
        
        <Link to={createPageUrl("MyTasks")} className="block">
          <Button variant="outline" className="w-full">
            View All Team Tasks
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}