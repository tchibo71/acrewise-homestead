import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Share2,
  Users,
  Check,
  Copy,
  Mail,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Twitter,
  Facebook,
  Linkedin,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import ReferralValidator from "../components/referral/ReferralValidator";
import EmailInviteForm from "../components/referral/EmailInviteForm";

export default function ReferralProgram() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return null;
      return base44.auth.me();
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: user?.email });
      return subs.length > 0 ? subs[0] : null;
    },
    enabled: !!user?.email
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const refs = await base44.entities.Referral.list('-created_date');
      return refs.filter(r => r.referrer_email === user?.email);
    },
    enabled: !!user?.email
  });

  const createReferralMutation = useMutation({
    mutationFn: (data) => base44.entities.Referral.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && user) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      createReferralMutation.mutate({
        referrer_email: refCode.replace('-at-', '@'),
        referral_code: refCode,
        referred_email: user.email,
        status: 'signed_up',
        click_date: new Date().toISOString().split('T')[0],
        signup_date: new Date().toISOString().split('T')[0],
        expiration_date: expirationDate.toISOString().split('T')[0]
      });
    }
  }, [user]);

  const transformedEmailRef = user?.email?.replace('@', '-at-') || '';
  const referralUrl = `https://homesteadacres.app/signup?ref=${transformedEmailRef}`;

  const validatedReferrals = referrals.filter(r => r.status === "validated").length;
  const subscribedReferrals = referrals.filter(r => r.status === "subscribed").length;
  const pendingReferrals = referrals.filter(r => r.status === "pending" || r.status === "signed_up").length;
  const expiredReferrals = referrals.filter(r => r.status === "expired").length;

  const getCurrentTier = () => {
    if (validatedReferrals >= 16) return { name: "Elite", discount: 100, color: "purple" };
    if (validatedReferrals >= 6) return { name: "Gold", discount: 50, color: "yellow" };
    if (validatedReferrals >= 1) return { name: "Silver", discount: 25, color: "gray" };
    return { name: "Bronze", discount: 0, color: "orange" };
  };

  const getNextTier = () => {
    if (validatedReferrals >= 16) return null;
    if (validatedReferrals >= 6) return { name: "Elite", needed: 16 - validatedReferrals, discount: 100 };
    if (validatedReferrals >= 1) return { name: "Gold", needed: 6 - validatedReferrals, discount: 50 };
    return { name: "Silver", needed: 1 - validatedReferrals, discount: 25 };
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = "Join Homestead Acres - Manage Your Homestead";
    const body = `Hi!\n\nI've been using Homestead Acres to manage my homestead and thought you might find it useful too.\n\nSign up using my referral link:\n${referralUrl}\n\nBest regards`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaTwitter = () => {
    const text = `I'm using Homestead Acres for my homesteading needs - check it out!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'validated': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'subscribed': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'signed_up': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'expired': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'validated': return 'bg-green-100 text-green-700 border-green-200';
      case 'subscribed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'signed_up': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const addDaysToDate = (dateString, days) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      const futureDate = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
      return format(futureDate, 'MMM d');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <ReferralValidator />
      
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Referral Program</h1>
            <p className="text-gray-600 mt-1">Earn one-time discounts on your next billing cycle</p>
          </div>
        </div>

        {/* IMPORTANT NOTICE */}
        <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-orange-900 text-lg mb-2">
                  ⚠️ IMPORTANT: One-Time Discount Only
                </h3>
                <p className="text-orange-800 mb-2">
                  <strong>All referral rewards are applied ONLY to your next billing cycle.</strong>
                </p>
                <ul className="space-y-1 text-sm text-orange-700 list-disc pl-5">
                  <li>Discounts are NOT permanent</li>
                  <li>Discounts apply to ONE month only (your next billing period)</li>
                  <li>After that month, your subscription returns to regular pricing</li>
                  <li>You must continue referring to earn future discounts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Tier & Progress */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className={`bg-${currentTier.color}-500 text-white text-lg px-4 py-2`}>
                  {currentTier.name} Tier
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Next Month Discount: <span className="font-bold text-2xl text-purple-700">{currentTier.discount}%</span>
                </p>
                <p className="text-xs text-orange-600 font-semibold mt-1">
                  (One-time discount on next billing cycle only)
                </p>
              </div>
              {subscription?.referral_credits > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Available Credits</p>
                  <p className="text-2xl font-bold text-green-600">${subscription.referral_credits.toFixed(2)}</p>
                  <p className="text-xs text-orange-600">For next month only</p>
                </div>
              )}
            </div>

            {nextTier && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress to {nextTier.name} ({nextTier.discount}% off next month)</span>
                  <span>{validatedReferrals} / {validatedReferrals + nextTier.needed}</span>
                </div>
                <Progress 
                  value={(validatedReferrals / (validatedReferrals + nextTier.needed)) * 100} 
                  className="h-3"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {nextTier.needed} more validated referral{nextTier.needed !== 1 ? 's' : ''} needed!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Validated</p>
                  <p className="text-2xl font-bold text-green-900">{validatedReferrals}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Processing</p>
                  <p className="text-2xl font-bold text-blue-900">{subscribedReferrals}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{pendingReferrals}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Expired</p>
                  <p className="text-2xl font-bold text-red-900">{expiredReferrals}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Graduated Rewards System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-bold text-orange-900 mb-2">
                🔔 REMEMBER: These discounts apply ONLY to your next monthly billing cycle
              </p>
              <p className="text-xs text-orange-800">
                Your subscription will return to regular pricing after the discounted month. Keep referring to earn future discounts!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold">Silver Tier</h3>
                </div>
                <p className="text-2xl font-bold text-gray-700 mb-1">25% Off</p>
                <p className="text-sm text-gray-600 mb-1">1-5 validated referrals</p>
                <p className="text-xs text-orange-600 font-semibold">Next month only</p>
              </div>

              <div className="p-4 bg-white rounded-lg border-2 border-yellow-400">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold">Gold Tier</h3>
                </div>
                <p className="text-2xl font-bold text-yellow-600 mb-1">50% Off</p>
                <p className="text-sm text-gray-600 mb-1">6-15 validated referrals</p>
                <p className="text-xs text-orange-600 font-semibold">Next month only</p>
              </div>

              <div className="p-4 bg-white rounded-lg border-2 border-purple-400">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Elite Tier</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600 mb-1">100% Free</p>
                <p className="text-sm text-gray-600 mb-1">16+ validated referrals</p>
                <p className="text-xs text-orange-600 font-semibold">One free month only</p>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold">Share Your Link</h4>
                  <p className="text-sm text-gray-600">Share your unique referral link with friends</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold">They Subscribe</h4>
                  <p className="text-sm text-gray-600">Friend signs up and subscribes within 30 days</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold">7-Day Validation</h4>
                  <p className="text-sm text-gray-600">After 7 days of active subscription, your reward is validated</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-semibold">One-Time Credit Applied</h4>
                  <p className="text-sm text-gray-600">Discount automatically applied to your next billing cycle only</p>
                  <p className="text-xs text-orange-600 font-semibold mt-1">
                    ⚠️ After that month, pricing returns to normal
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                How Discounts Work
              </h4>
              <ul className="space-y-2 text-sm text-yellow-800 list-disc pl-5">
                <li><strong>Month 1:</strong> You earn 3 validated referrals → 25% off next month</li>
                <li><strong>Month 2:</strong> You pay 25% less (one time)</li>
                <li><strong>Month 3:</strong> Back to full price unless you earn more referrals</li>
                <li><strong>To keep discounts:</strong> You must continue referring new subscribers</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                What If I Get Many Referrals at Once?
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Example:</strong> You get 94 validated referrals in one month</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You reach Elite tier (16+ referrals)</li>
                  <li>You get <strong>ONE</strong> free month on your next billing cycle</li>
                  <li>The extra 78 referrals beyond 16 don't give additional free months</li>
                  <li>Your total stays at 94, so you're still at Elite tier</li>
                  <li>To earn another discount, you need to reach the next milestone (110 total = 16 more referrals)</li>
                </ul>
                <p className="font-semibold mt-2">💡 Each milestone gives ONE discounted month. To earn more discounts, keep referring!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Invite Form - Primary CTA */}
        <EmailInviteForm user={user} referralUrl={referralUrl} />

        {/* Share Your Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Or Share Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Your Referral Link</Label>
              <div className="flex gap-2 mt-2">
                <Input value={referralUrl} readOnly className="text-sm" />
                <Button onClick={copyToClipboard} variant="outline">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={shareViaEmail} variant="outline" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Client
              </Button>
              <Button onClick={shareViaTwitter} variant="outline" className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button onClick={shareViaFacebook} variant="outline" className="flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </Button>
              <Button onClick={shareViaLinkedIn} variant="outline" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        {referrals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(referral.status)}
                      <div>
                        <p className="font-semibold">{referral.referred_email}</p>
                        <p className="text-xs text-gray-500">
                          {referral.status === 'validated' && `Validated on ${formatDate(referral.validation_date)}`}
                          {referral.status === 'subscribed' && `Subscribed ${formatDate(referral.subscription_date)} - validates ${addDaysToDate(referral.subscription_date, 7)}`}
                          {referral.status === 'signed_up' && `Signed up ${formatDate(referral.signup_date)} - must subscribe by ${formatDate(referral.expiration_date)}`}
                          {referral.status === 'pending' && `Clicked ${formatDate(referral.click_date)}`}
                          {referral.status === 'expired' && `Expired on ${formatDate(referral.expiration_date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(referral.status)}>
                        {referral.status.replace('_', ' ')}
                      </Badge>
                      {referral.reward_earned > 0 && (
                        <Badge className="bg-purple-100 text-purple-700">
                          {referral.reward_earned}% earned
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}