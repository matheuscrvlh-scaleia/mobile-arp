/* API pública da conta: outras features importam só daqui. */
export { CheckRow } from "./components/CheckRow";
export { useFinishOnboarding } from "./hooks/useCompleteAuth";
export { onboarding } from "./lib/onboarding";
export { offerPushNotifications, type PushOfferOptions } from "./sheets/push-offer";
export { requireAuth } from "./sheets/require-auth";
