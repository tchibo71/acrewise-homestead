import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShoppingBag, 
  Plus, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2,
  MessageSquare
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import CustomerInquiryModal from "./CustomerInquiryModal";

export default function ManageListings() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [inquiryListing, setInquiryListing] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: () => base44.entities.MarketplaceListing.list('-created_date'),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => base44.entities.InventoryItem.list(),
  });

  const togglePublicMutation = useMutation({
    mutationFn: ({ id, isPublic }) => base44.entities.MarketplaceListing.update(id, { is_public: isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketplaceListing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
    },
  });

  const publicListings = listings.filter(l => l.is_public);
  const farmStandUrl = user ? `${window.location.origin}/FarmStand?farm=${user.email}` : "";

  const copyFarmStandUrl = () => {
    navigator.clipboard.writeText(farmStandUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
            Public Farm Stand
          </span>
          <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Listing
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Farm Stand URL */}
        {publicListings.length > 0 && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <Label className="text-green-900 font-semibold">Your Public Farm Stand URL</Label>
                <p className="text-xs text-green-700 mt-1">Share this link with customers</p>
              </div>
              <Badge className="bg-green-600 text-white">
                {publicListings.length} Live
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Input value={farmStandUrl} readOnly className="bg-white text-sm" />
              <Button onClick={copyFarmStandUrl} variant="outline" size="sm">
                {copiedUrl ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <a href={farmStandUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Framework Notice */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">🚀 Future Features Framework Ready</h4>
          <p className="text-sm text-purple-800 mb-2">
            This farm stand is currently display-only. The framework is in place for future paid features:
          </p>
          <ul className="text-xs text-purple-700 space-y-1 list-disc pl-5">
            <li><strong>Customer Inquiries:</strong> Allow customers to send questions about products</li>
            <li><strong>Order Placement System:</strong> Accept and manage customer orders online</li>
            <li><strong>Payment Integration:</strong> Process payments through the platform</li>
            <li><strong>Delivery Scheduling:</strong> Coordinate pickup times and locations</li>
          </ul>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No marketplace listings yet</p>
            <Button onClick={() => setShowAddModal(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Listing
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => (
              <div key={listing.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{listing.product_name}</h4>
                      <Badge variant="outline" className="capitalize">
                        {listing.category.replace(/_/g, ' ')}
                      </Badge>
                      {listing.is_public ? (
                        <Badge className="bg-green-600 text-white">
                          <Eye className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <span><strong>Price:</strong> ${listing.price}/{listing.unit}</span>
                      <span><strong>Available:</strong> {listing.quantity_available} {listing.unit}</span>
                      {listing.pickup_location && <span><strong>Pickup:</strong> {listing.pickup_location}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={listing.is_public}
                      onCheckedChange={(checked) => togglePublicMutation.mutate({ id: listing.id, isPublic: checked })}
                    />
                    {listing.category === "plants" && (
                      <Button variant="outline" size="sm" onClick={() => setInquiryListing(listing)}>
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Reserve/Inquire
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setEditingListing(listing); setShowAddModal(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { if(confirm('Delete this listing?')) deleteMutation.mutate(listing.id); }}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddListingModal
            listing={editingListing}
            inventory={inventory}
            onClose={() => { setShowAddModal(false); setEditingListing(null); }}
          />
        )}
        {inquiryListing && (
          <CustomerInquiryModal
            listing={inquiryListing}
            onClose={() => setInquiryListing(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Add Listing Modal Component
function AddListingModal({ listing, inventory, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(listing || {
    product_name: "",
    category: "produce",
    description: "",
    quantity_available: "",
    unit: "",
    price: "",
    is_public: false,
    pickup_location: "",
    available_days: [],
    contact_method: "email",
    contact_value: "",
    allow_inquiries: false,
    allow_orders: false
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => listing
      ? base44.entities.MarketplaceListing.update(listing.id, data)
      : base44.entities.MarketplaceListing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      quantity_available: parseFloat(formData.quantity_available),
      price: parseFloat(formData.price),
      contact_value: formData.contact_value || user?.email
    };

    createMutation.mutate(submitData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? 'Edit' : 'Create'} Marketplace Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eggs">Eggs</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="honey">Honey</SelectItem>
                    <SelectItem value="plants">Plants</SelectItem>
                    <SelectItem value="preserves">Preserves</SelectItem>
                    <SelectItem value="baked_goods">Baked Goods</SelectItem>
                    <SelectItem value="fiber">Fiber</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your product..."
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity_available">Quantity *</Label>
                <Input
                  id="quantity_available"
                  type="number"
                  step="0.01"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({...formData, quantity_available: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="dozen, lbs, each"
                  required
                />
              </div>

              <div>
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pickup_location">Pickup Location</Label>
              <Input
                id="pickup_location"
                value={formData.pickup_location || ""}
                onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
                placeholder="e.g., 123 Farm Road, at the farm stand"
              />
            </div>

            <div>
              <Label htmlFor="contact_method">Customer Contact Method</Label>
              <Select
                value={formData.contact_method}
                onValueChange={(value) => setFormData({...formData, contact_method: value})}
              >
                <SelectTrigger id="contact_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="form">Contact Form (future)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contact_value">Contact Email/Phone</Label>
              <Input
                id="contact_value"
                value={formData.contact_value || ""}
                onChange={(e) => setFormData({...formData, contact_value: e.target.value})}
                placeholder={formData.contact_method === 'phone' ? '(555) 123-4567' : 'your@email.com'}
              />
              <p className="text-xs text-gray-500 mt-1">Defaults to your account email if not specified</p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({...formData, is_public: checked})}
              />
              <Label htmlFor="is_public" className="cursor-pointer">
                Make this listing public on my farm stand
              </Label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>🔮 Future Features:</strong> Customer inquiries and order placement framework is already built in. 
                These will be available as paid add-ons in future updates.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {listing ? 'Update' : 'Create'} Listing
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}