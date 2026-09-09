import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users,
  Plus,
  Loader2,
  X,
  Trash2,
  Mail,
  User as UserIcon,
  Shield,
  Stethoscope,
  Wrench,
  Calculator,
  HardHat,
  Footprints,
  Heart,
  Briefcase,
  Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "family", label: "Family", icon: Heart },
  { value: "farmhand", label: "Farmhand", icon: UserIcon },
  { value: "veterinarian", label: "Veterinarian", icon: Stethoscope },
  { value: "farrier", label: "Farrier", icon: Footprints },
  { value: "mechanic", label: "Mechanic", icon: Wrench },
  { value: "contractor", label: "Contractor", icon: HardHat },
  { value: "accountant", label: "Accountant", icon: Calculator },
  { value: "consultant", label: "Consultant", icon: Briefcase },
];

const PERMISSIONS = [
  { value: "view_only", label: "View Only", color: "bg-blue-100 text-blue-700" },
  { value: "edit", label: "Edit", color: "bg-amber-100 text-amber-700" },
  { value: "full_access", label: "Full Access", color: "bg-green-100 text-green-700" },
];

const roleIcon = (role) => ROLES.find(r => r.value === role)?.icon || UserIcon;

export default function Team() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    member_email: "",
    member_name: "",
    role: "",
    permissions: "view_only",
    notes: "",
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setShowForm(false);
      setFormData({ member_email: "", member_name: "", role: "", permissions: "view_only", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const handleSubmit = () => {
    if (!formData.member_email || !formData.role || !user?.email) return;
    createMutation.mutate({
      ...formData,
      team_owner_email: user.email,
    });
  };

  const handleDelete = (id) => {
    if (confirm("Remove this team member?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePermissionChange = (member, newPerm) => {
    updateMutation.mutate({ id: member.id, data: { permissions: newPerm } });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Team</h1>
              <p className="text-gray-600 mt-1">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Info Banner */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How team sharing works</p>
            <p>
              Team members you add here share access to your farm records via the <code className="text-xs bg-blue-100 px-1 rounded">team_owner_email</code> field.
              Their permission level is tracked here for your reference. Enforcing these permissions across all entities (e.g. blocking a "view only" farmhand from editing)
              requires updating RLS rules on each entity individually — a larger follow-up task.
            </p>
          </div>
        </div>

        {/* Member List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500 mb-4">Add family, farmhands, vets, and contractors to share your farm records</p>
              <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Team Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {members.map(member => {
              const RoleIcon = roleIcon(member.role);
              const perm = PERMISSIONS.find(p => p.value === member.permissions) || PERMISSIONS[0];
              return (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <RoleIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {member.member_name || member.member_email}
                            </h3>
                            {member.member_name && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 truncate">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                {member.member_email}
                              </p>
                            )}
                          </div>
                          <button onClick={() => handleDelete(member.id)} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="capitalize bg-gray-50">
                            {member.role}
                          </Badge>
                          <Select
                            value={member.permissions}
                            onValueChange={(v) => handlePermissionChange(member, v)}
                          >
                            <SelectTrigger className="h-7 w-auto text-xs border-none shadow-none p-0 pr-6">
                              <Badge className={`${perm.color} cursor-pointer`}>
                                <Shield className="w-3 h-3 mr-1" />
                                {perm.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSIONS.map(p => (
                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {member.notes && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{member.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white">
              <div className="sticky top-0 bg-white z-10 border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Team Member
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input
                    type="email"
                    value={formData.member_email}
                    onChange={(e) => setFormData({ ...formData, member_email: e.target.value })}
                    placeholder="name@example.com"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Name (optional)</Label>
                  <Input
                    value={formData.member_name}
                    onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                    placeholder="Display name"
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          <div className="flex items-center gap-2">
                            <r.icon className="w-4 h-4" />
                            {r.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <Select value={formData.permissions} onValueChange={(v) => setFormData({ ...formData, permissions: v })}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PERMISSIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Tracked for your reference. Actual data access enforcement requires per-entity RLS updates.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Contact info, specialties, availability..."
                    className="bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.member_email || !formData.role || createMutation.isPending}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    {createMutation.isPending ? "Adding..." : "Add Team Member"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}