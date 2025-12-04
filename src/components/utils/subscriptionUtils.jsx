import { base44 } from "@/api/base44Client";

export async function checkSubscription() {
  try {
    // First check if user is authenticated to avoid errors for public/unauthenticated access
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      return { isPro: false, plan: "free", status: "unauthenticated" };
    }

    const user = await base44.auth.me();
    if (!user || !user.email) {
      return { isPro: false, plan: "free", status: "no_user" };
    }

    const subs = await base44.entities.Subscription.filter({ created_by: user.email });
    
    if (subs.length === 0) {
      return { isPro: false, plan: "free", status: "none" };
    }

    const subscription = subs[0];
    
    // Check if subscription is active
    if (subscription.status === "active" && subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      
      if (endDate < now) {
        // Subscription expired
        return { isPro: false, plan: subscription.plan, status: "expired", subscription };
      }
    }

    const isPro = subscription.status === "active" && 
                  (subscription.plan === "monthly" || subscription.plan === "yearly" || 
                   subscription.plan === "team_monthly" || subscription.plan === "team_yearly");

    const isTeamPlan = subscription.plan === "team_monthly" || subscription.plan === "team_yearly";

    return { isPro, plan: subscription.plan, status: subscription.status, subscription, isTeamPlan };
  } catch (error) {
    return { isPro: false, plan: "free", status: "error" };
  }
}

export const FREE_GUIDE_LIMIT = 3;
export const FREE_FEATURES = {
  canViewGuides: true,
  canViewLimitedGuides: true,
  guideLimit: FREE_GUIDE_LIMIT,
  canCreateChecklists: false,
  canPostInForum: false,
  canCommentInForum: false,
  canUpvote: false,
  canViewDashboard: true,
  canExportData: false
};

export const PRO_FEATURES = {
  canViewGuides: true,
  canViewLimitedGuides: false,
  guideLimit: Infinity,
  canCreateChecklists: true,
  canPostInForum: true,
  canCommentInForum: true,
  canUpvote: true,
  canViewDashboard: true,
  canExportData: true
};