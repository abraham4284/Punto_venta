import { useBusinessSubscriptionStore } from "../store/businessSubscription.store";

export const useBusinessSubscription = () => {
  const subscriptionState = useBusinessSubscriptionStore(
    (state) => state.subscriptionState,
  );
  const loading = useBusinessSubscriptionStore((state) => state.loading);
  const error = useBusinessSubscriptionStore((state) => state.error);
  const fetchSubscription = useBusinessSubscriptionStore(
    (state) => state.fetchSubscription,
  );
  const refreshSubscription = useBusinessSubscriptionStore(
    (state) => state.refreshSubscription,
  );

  return {
    subscriptionState,
    loading,
    error,
    fetchSubscription,
    refreshSubscription,
  };
};
