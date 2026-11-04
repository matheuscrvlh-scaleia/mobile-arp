import type { SocialProvider } from "@/contracts/app/auth";
import type { SocialAvailability } from "../hooks/useSocialLogin";

/* Web (react-native-web): sem Google e Apple (ver social-providers.web.ts); só o login por e-mail. */

export type SocialButtonsProps = {
  available: SocialAvailability;
  busy: SocialProvider | null;
  onPress: (provider: SocialProvider) => void;
  dividerLabel: string;
};

export function SocialButtons(_props: SocialButtonsProps) {
  return null;
}
