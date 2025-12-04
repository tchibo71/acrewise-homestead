import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// This component runs validation logic in the background
export default function ReferralValidator() {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const { data: allReferrals = [] } = useQuery({
    queryKey: ['all-referrals-validation'],
    queryFn: async () => {
      return await base44.entities.Referral.list();
    },
    enabled: isAuthenticated, // Only run if authenticated
    refetchInterval: 60000, // Check every minute
  });

  const { data: allSubscriptions = [] } = useQuery({
    queryKey: ['all-subscriptions-validation'],
    queryFn: async () => {
      return await base44.entities.Subscription.list();
    },
    enabled: isAuthenticated, // Only run if authenticated
    refetchInterval: 60000,
  });

  const updateReferralMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-referrals-validation'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
  });

  // Calculate reward tier based on validated referral count
  const calculateRewardTier = (validatedCount) => {
    if (validatedCount >= 16) return 100; // Free month
    if (validatedCount >= 6) return 50;   // 50% off
    if (validatedCount >= 1) return 25;   // 25% off
    return 0;
  };

  // Main validation logic
  useEffect(() => {
    if (allReferrals.length === 0) return;

    const now = new Date();

    allReferrals.forEach(async (referral) => {
      const updates = {};
      let shouldUpdate = false;

      // 1. Check for expiration (30 days after click, no subscription)
      if (referral.status === 'pending' || referral.status === 'signed_up') {
        const clickDate = new Date(referral.click_date);
        const expirationDate = new Date(clickDate);
        expirationDate.setDate(expirationDate.getDate() + 30);

        if (now > expirationDate && referral.status !== 'expired') {
          updates.status = 'expired';
          updates.expiration_date = expirationDate.toISOString().split('T')[0];
          shouldUpdate = true;
        }
      }

      // 2. Check if referred user has subscribed
      if (referral.status === 'signed_up' && referral.referred_email) {
        const userSubscription = allSubscriptions.find(
          sub => sub.created_by === referral.referred_email && 
                 (sub.status === 'active' || sub.status === 'trial')
        );

        if (userSubscription && !referral.subscription_date) {
          updates.status = 'subscribed';
          updates.subscription_date = userSubscription.start_date || new Date().toISOString().split('T')[0];
          shouldUpdate = true;
        }
      }

      // 3. Check for 7-day validation
      if (referral.status === 'subscribed' && referral.subscription_date) {
        const subscriptionDate = new Date(referral.subscription_date);
        const validationDate = new Date(subscriptionDate);
        validationDate.setDate(validationDate.getDate() + 7);

        if (now >= validationDate) {
          // Check if subscription is still active
          const userSubscription = allSubscriptions.find(
            sub => sub.created_by === referral.referred_email && sub.status === 'active'
          );

          if (userSubscription) {
            // Get count of validated referrals for this referrer
            const referrerValidatedCount = allReferrals.filter(
              r => r.referrer_email === referral.referrer_email && r.status === 'validated'
            ).length;

            // Calculate new tier (including this one)
            const rewardTier = calculateRewardTier(referrerValidatedCount + 1);

            updates.status = 'validated';
            updates.validation_date = now.toISOString().split('T')[0];
            updates.reward_earned = rewardTier;
            shouldUpdate = true;

            // Apply reward to referrer's subscription
            await applyRewardToReferrer(referral.referrer_email, rewardTier, referrerValidatedCount + 1);
          } else {
            // Subscription was cancelled before 7 days
            updates.status = 'expired';
            updates.expiration_date = now.toISOString().split('T')[0];
            shouldUpdate = true;
          }
        }
      }

      // Apply updates if needed
      if (shouldUpdate && Object.keys(updates).length > 0) {
        await updateReferralMutation.mutateAsync({ id: referral.id, data: updates });
      }
    });
  }, [allReferrals, allSubscriptions]);

  // Apply reward to referrer's subscription
  const applyRewardToReferrer = async (referrerEmail, discountPercent, totalValidated) => {
    try {
      const referrerSubscriptions = allSubscriptions.filter(
        sub => sub.created_by === referrerEmail && sub.status === 'active'
      );

      if (referrerSubscriptions.length > 0) {
        const subscription = referrerSubscriptions[0];
        
        // Calculate discount amount
        const basePrice = subscription.plan === 'monthly' ? 4.99 : 35.88;
        const discountAmount = (basePrice * discountPercent) / 100;

        // Store the credit for next billing cycle
        const currentCredits = subscription.referral_credits || 0;
        const newCredits = currentCredits + discountAmount;

        await updateSubscriptionMutation.mutateAsync({
          id: subscription.id,
          data: {
            referral_credits: newCredits,
            referral_discount_percent: discountPercent,
            total_validated_referrals: totalValidated
          }
        });

        // Send notification email to referrer
        try {
          await base44.integrations.Core.SendEmail({
            to: referrerEmail,
            subject: "🎉 Referral Reward Unlocked!",
            body: `Congratulations! Your referral has been validated after 7 days.

You've earned: ${discountPercent}% off your next billing cycle!

Total validated referrals: ${totalValidated}
Current tier: ${discountPercent === 100 ? 'FREE MONTH' : discountPercent === 50 ? '50% OFF' : '25% OFF'}

Your discount will be automatically applied to your next billing cycle.

Keep sharing to reach the next tier:
• 1-5 referrals: 25% off
• 6-15 referrals: 50% off
• 16+ referrals: FREE month!

Thank you for spreading the word about Homestead Acres!`
          });
        } catch (emailError) {
          console.log("Email notification failed:", emailError);
        }
      }
    } catch (error) {
      console.error("Error applying reward:", error);
    }
  };

  // This component doesn't render anything
  return null;
}