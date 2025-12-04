import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Calendar, Bell, Users } from "lucide-react";
import { addWeeks, addDays, format } from "date-fns";
import { getCurrentSeason, getSeasonName, getAllSeasons } from "@/components/utils/seasonUtils";
import { checkSubscription } from "@/components/utils/subscriptionUtils";

const categories = [
  "composting", "gardening", "raised_beds", "biointensive", 
  "harvesting", "livestock", "water_management", "greenhouse", 
  "property_engineering", "daily_tasks", "seasonal_tasks"
];

export default function ChecklistForm({ task, onClose }) {
  const queryClient = useQueryClient();
  
  const autoSeason = getCurrentSeason();
  
  const [formData, setFormData] = useState(task || {
    title: "",
    category: "daily_tasks",
    frequency: "daily",
    custom_interval_weeks: 0,
    custom_interval_days: 0,
    season: autoSeason,
    priority: "medium",
    notes: "",
    due_date: "",
    next_due_date: "",
    livestock_id: "",
    animal_specific_notes: "",
    alert_days_before: 3,
    enable_reminders: true,
    assigned_to_user_id: "",
    assigned_to_email: ""
  });

  const { data: livestock = [] } = useQuery({
    queryKey: ['livestock'],
    queryFn: () => base44.entities.Livestock.list(),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: checkSubscription,
    initialData: { isPro: false, isTeamPlan: false }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: teamSubscription } = useQuery({
    queryKey: ['team-subscription'],
    queryFn: async () => {
      if (!currentUser?.email) return null;
      const subs = await base44.entities.Subscription.filter({ created_by: currentUser.email });
      return subs.find(s => s.plan === 'team_monthly' || s.plan === 'team_yearly') || null;
    },
    enabled: !!currentUser?.email && subscriptionData.isTeamPlan
  });

  const teamMembers = teamSubscription?.team_member_emails || [];

  const activeLivestock = livestock.filter(a => a.status === 'active');

  const calculateNextDueDate = () => {
    if (!formData.due_date) return null;
    
    const startDate = new Date(formData.due_date);
    
    switch(formData.frequency) {
      case 'daily':
        return format(addDays(startDate, 1), 'yyyy-MM-dd');
      case 'weekly':
        return format(addWeeks(startDate, 1), 'yyyy-MM-dd');
      case 'monthly':
        return format(addDays(startDate, 30), 'yyyy-MM-dd');
      case 'seasonal':
        return format(addDays(startDate, 90), 'yyyy-MM-dd');
      case 'custom':
        const totalDays = (formData.custom_interval_weeks * 7) + (formData.custom_interval_days || 0);
        return format(addDays(startDate, totalDays), 'yyyy-MM-dd');
      default:
        return null;
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => {
      const submitData = { ...data };
      if (submitData.frequency !== 'one_time' && submitData.due_date) {
        submitData.next_due_date = calculateNextDueDate();
      }
      // Set team_owner_email for team plans
      if (subscriptionData.isTeamPlan && currentUser?.email) {
        submitData.team_owner_email = currentUser.email;
      }
      return base44.entities.ChecklistItem.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const submitData = { ...data };
      if (submitData.frequency !== 'one_time' && submitData.due_date) {
        submitData.next_due_date = calculateNextDueDate();
      }
      return base44.entities.ChecklistItem.update(id, submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task) {
      updateMutation.mutate({ id: task.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{task ? 'Edit Task' : 'New Task'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Trim horse hooves"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({...formData, frequency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="seasonal">Seasonal (90 days)</SelectItem>
                  <SelectItem value="custom">Custom Interval</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.frequency === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="custom_weeks">Every X Weeks</Label>
                  <Input
                    id="custom_weeks"
                    type="number"
                    min="0"
                    value={formData.custom_interval_weeks || 0}
                    onChange={(e) => setFormData({...formData, custom_interval_weeks: parseInt(e.target.value) || 0})}
                    placeholder="e.g., 6"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom_days">Plus X Days</Label>
                  <Input
                    id="custom_days"
                    type="number"
                    min="0"
                    max="6"
                    value={formData.custom_interval_days || 0}
                    onChange={(e) => setFormData({...formData, custom_interval_days: parseInt(e.target.value) || 0})}
                    placeholder="e.g., 3"
                  />
                  <p className="text-xs text-gray-500">
                    Task repeats every {formData.custom_interval_weeks || 0} weeks + {formData.custom_interval_days || 0} days
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select
                value={formData.season}
                onValueChange={(value) => setFormData({...formData, season: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAllSeasons().map(season => (
                    <SelectItem key={season} value={season}>
                      {getSeasonName(season)}
                      {season === autoSeason && <span className="ml-2 text-xs text-green-600">(Current)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.season === autoSeason && (
                <p className="text-xs text-green-600">✓ Automatically detected for current season</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formData.frequency === 'one_time' ? 'Due Date' : 'First Due Date (Start Date)'}
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date || ''}
              onChange={(e) => setFormData({...formData, due_date: e.target.value})}
            />
            {formData.frequency !== 'one_time' && formData.due_date && (
              <p className="text-xs text-green-600">
                Next occurrence will be automatically calculated: {calculateNextDueDate()}
              </p>
            )}
          </div>

          {formData.category === 'livestock' && activeLivestock.length > 0 && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="livestock_id">Assign to Specific Animal (Optional)</Label>
              <Select
                value={formData.livestock_id || 'none'}
                onValueChange={(value) => setFormData({...formData, livestock_id: value === 'none' ? '' : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select animal or leave blank for general task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific animal (general task)</SelectItem>
                  {activeLivestock.map(animal => (
                    <SelectItem key={animal.id} value={animal.id}>
                      {animal.name_or_tag} ({animal.animal_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.livestock_id && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="animal_specific_notes">Animal-Specific Notes</Label>
                  <Textarea
                    id="animal_specific_notes"
                    value={formData.animal_specific_notes || ''}
                    onChange={(e) => setFormData({...formData, animal_specific_notes: e.target.value})}
                    placeholder="Notes specific to this animal for this task..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {formData.frequency !== 'one_time' && (
            <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <Label className="text-purple-900 font-semibold">Reminder Settings</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enable_reminders"
                  checked={formData.enable_reminders}
                  onCheckedChange={(checked) => setFormData({...formData, enable_reminders: checked})}
                />
                <Label htmlFor="enable_reminders">Enable reminders for this task</Label>
              </div>

              {formData.enable_reminders && (
                <div className="space-y-2">
                  <Label htmlFor="alert_days">Alert me this many days before due date:</Label>
                  <Select
                    value={formData.alert_days_before?.toString() || '3'}
                    onValueChange={(value) => setFormData({...formData, alert_days_before: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="5">5 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                      <SelectItem value="14">2 weeks before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Team Assignment - Only for Team Plan owners */}
          {subscriptionData.isTeamPlan && teamMembers.length > 0 && (
            <div className="space-y-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <Label className="text-indigo-900 font-semibold">Team Assignment</Label>
              </div>
              <p className="text-xs text-indigo-700">Assign this task to a team member</p>
              <Select
                value={formData.assigned_to_email || 'unassigned'}
                onValueChange={(value) => setFormData({
                  ...formData, 
                  assigned_to_email: value === 'unassigned' ? '' : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value={currentUser?.email}>{currentUser?.full_name || currentUser?.email} (You)</SelectItem>
                  {teamMembers.map(email => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">General Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}