import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  MapPin, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  Clock,
  Sprout,
  Package
} from "lucide-react";

export default function FarmStand() {
  const urlParams = new URLSearchParams(window.location.search);
  const farmEmail = urlParams.get('farm');

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['public-listings', farmEmail],
    queryFn: async () => {
      if (!farmEmail) return [];
      const allListings = await base44.entities.MarketplaceListing.list();
      return allListings.filter(l => l.is_public && l.created_by === farmEmail && l.quantity_available > 0);
    },
    enabled: !!farmEmail
  });

  const { data: farmOwner } = useQuery({
    queryKey: ['farm-owner', farmEmail],
    queryFn: async () => {
      if (!farmEmail) return null;
      const users = await base44.entities.User.list();
      return users.find(u => u.email === farmEmail);
    },
    enabled: !!farmEmail
  });

  const categoryIcons = {
    eggs: Package,
    dairy: ShoppingBag,
    meat: ShoppingBag,
    produce: Sprout,
    honey: ShoppingBag,
    plants: Sprout,
    preserves: ShoppingBag,
    baked_goods: ShoppingBag,
    fiber: Package,
    livestock: ShoppingBag,
    other: Package
  };

  const categoryColors = {
    eggs: "bg-yellow-100 text-yellow-800 border-yellow-300",
    dairy: "bg-blue-100 text-blue-800 border-blue-300",
    meat: "bg-red-100 text-red-800 border-red-300",
    produce: "bg-green-100 text-green-800 border-green-300",
    honey: "bg-amber-100 text-amber-800 border-amber-300",
    plants: "bg-emerald-100 text-emerald-800 border-emerald-300",
    preserves: "bg-purple-100 text-purple-800 border-purple-300",
    baked_goods: "bg-orange-100 text-orange-800 border-orange-300",
    fiber: "bg-gray-100 text-gray-800 border-gray-300",
    livestock: "bg-pink-100 text-pink-800 border-pink-300",
    other: "bg-slate-100 text-slate-800 border-slate-300"
  };

  if (!farmEmail) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto text-center py-16">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Farm Stand Not Found</h1>
          <p className="text-gray-600">Invalid farm stand URL. Please check the link.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8 pb-32 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-6xl mx-auto text-center py-16">
          <ShoppingBag className="w-16 h-16 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading farm stand...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {farmOwner?.full_name ? `${farmOwner.full_name}'s Farm Stand` : 'Local Farm Stand'}
          </h1>
          <p className="text-lg text-gray-600">
            Fresh, local products from our homestead to your table
          </p>
        </div>

        {/* Available Products */}
        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h3>
              <p className="text-gray-600">Check back soon for fresh products!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => {
              const CategoryIcon = categoryIcons[listing.category] || Package;
              
              return (
                <Card key={listing.id} className="hover:shadow-xl transition-all duration-300 border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[listing.category]} border`}>
                        <CategoryIcon className="w-6 h-6" />
                      </div>
                      <Badge className="bg-green-600 text-white">
                        Available
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{listing.product_name}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {listing.description && (
                      <p className="text-gray-600 text-sm">{listing.description}</p>
                    )}

                    <div className="flex items-center justify-between py-3 border-t border-b">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-2xl font-bold text-green-700">
                          ${listing.price.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-gray-600">/ {listing.unit}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-bold text-gray-900">
                          {listing.quantity_available} {listing.unit}
                        </span>
                      </div>

                      {listing.pickup_location && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{listing.pickup_location}</span>
                        </div>
                      )}

                      {listing.available_days && listing.available_days.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">
                            {listing.available_days.join(', ')}
                          </span>
                        </div>
                      )}

                      {listing.last_restocked && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Restocked {new Date(listing.last_restocked).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Contact CTA - Framework for future order system */}
                    <div className="pt-4">
                      {listing.contact_method === 'email' && listing.contact_value && (
                        <a href={`mailto:${listing.contact_value}?subject=Inquiry: ${listing.product_name}`}>
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            <Mail className="w-4 h-4 mr-2" />
                            Contact to Purchase
                          </Button>
                        </a>
                      )}
                      {listing.contact_method === 'phone' && listing.contact_value && (
                        <a href={`tel:${listing.contact_value}`}>
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            <Phone className="w-4 h-4 mr-2" />
                            Call to Order
                          </Button>
                        </a>
                      )}
                      {!listing.contact_value && (
                        <Button disabled className="w-full">
                          Contact Farm for Availability
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="py-6">
            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">
                <strong>Powered by Homestead Harmony</strong>
              </p>
              <p>
                This farm stand is managed through Homestead Harmony's farm management platform.
                All products are subject to availability.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}