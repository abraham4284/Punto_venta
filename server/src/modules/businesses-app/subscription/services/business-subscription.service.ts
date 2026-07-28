import { getCurrentBusinessSubscriptionService } from "@/modules/platform/subscriptions/services/subscriptions.service.js";
import type { CurrentBusinessSubscriptionResponse } from "@/modules/platform/subscriptions/types/index.js";
import { getSubscriptionUsageSummaryForPlan } from "./subscription-limits.service.js";

export type BusinessSubscriptionOverview = CurrentBusinessSubscriptionResponse & {
  usage: Awaited<ReturnType<typeof getSubscriptionUsageSummaryForPlan>>;
};

export async function getBusinessSubscriptionOverviewService(
  idBusiness: number,
): Promise<BusinessSubscriptionOverview> {
  const subscription = await getCurrentBusinessSubscriptionService(idBusiness);
  const usage = await getSubscriptionUsageSummaryForPlan(
    idBusiness,
    subscription.plan,
  );

  return {
    ...subscription,
    usage,
  };
}
