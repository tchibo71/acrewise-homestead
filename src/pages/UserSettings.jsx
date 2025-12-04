import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  User as UserIcon, 
  Cloud, 
  MapPin, 
  Bell,
  Save,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function UserSettings() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    full_name: "",
    property_latitude: "",
    property_longitude: "",
    weather_alerts_enabled: true,
    frost_alert_threshold: 32
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        property_latitude: user.property_latitude || "",
        property_longitude: user.property_longitude || "",
        weather_alerts_enabled: user.weather_alerts_enabled !== false,
        frost_alert_threshold: user.frost_alert_threshold || 32
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      refetchUser(); // Added refetchUser call
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.property_latitude) submitData.property_latitude = parseFloat(submitData.property_latitude);
    if (submitData.property_longitude) submitData.property_longitude = parseFloat(submitData.property_longitude);
    if (submitData.frost_alert_threshold) submitData.frost_alert_threshold = parseFloat(submitData.frost_alert_threshold);
    updateMutation.mutate(submitData);
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            property_latitude: position.coords.latitude.toFixed(6),
            property_longitude: position.coords.longitude.toFixed(6)
          });
        },
        (error) => {
          alert("Unable to detect location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and preferences</p>
          </div>
        </div>

        {saved && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Settings saved successfully!</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="weather">
                <Cloud className="w-4 h-4 mr-2" />
                Weather
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label>Role</Label>
                    <Badge className="capitalize">{user?.role || "user"}</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weather">
              <Card>
                <CardHeader>
                  <CardTitle>Weather Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Cloud className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Weather Powered by Tomorrow.io</h3>
                        <p className="text-sm text-blue-800 mb-2">
                          Get accurate weather forecasts and alerts for your homestead automatically.
                          Just set your property location below.
                        </p>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Weather API Configured
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <Label className="mb-0">Property Location</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={detectLocation}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Detect Location
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Latitude</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={formData.property_latitude}
                          onChange={(e) => setFormData({...formData, property_latitude: e.target.value})}
                          placeholder="40.7128"
                        />
                      </div>
                      <div>
                        <Label>Longitude</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={formData.property_longitude}
                          onChange={(e) => setFormData({...formData, property_longitude: e.target.value})}
                          placeholder="-74.0060"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Tip: Right-click on your property in Google Maps to get coordinates
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle>Weather Alerts & Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Weather Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about important weather conditions</p>
                    </div>
                    <Switch
                      checked={formData.weather_alerts_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, weather_alerts_enabled: checked})}
                    />
                  </div>

                  <div className="border-t pt-6">
                    <Label>Frost Alert Threshold (°F)</Label>
                    <Input
                      type="number"
                      value={formData.frost_alert_threshold}
                      onChange={(e) => setFormData({...formData, frost_alert_threshold: e.target.value})}
                      placeholder="32"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Get alerts when temperature drops below this value
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">Alert Types</h4>
                    <ul className="space-y-2 text-sm text-amber-800">
                      <li>• Frost warnings for plant protection</li>
                      <li>• High heat advisories for livestock</li>
                      <li>• Rain forecasts for irrigation planning</li>
                      <li>• High wind warnings for equipment safety</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}