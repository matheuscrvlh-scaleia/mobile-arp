import type { StyleProp, ViewStyle } from "react-native";
import { EmptyState } from "./EmptyState";
import type { IconName } from "./Icon";

export type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** Mostra o loader no botão enquanto tenta de novo. */
  retrying?: boolean;
  /** `offline` troca o ícone e o texto padrão para falta de conexão. */
  offline?: boolean;
  icon?: IconName;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  title,
  message,
  onRetry,
  retrying,
  offline = false,
  icon,
  compact,
  style,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={icon ?? (offline ? "wifi-off" : "cloud-off")}
      title={title ?? (offline ? "Sem conexão" : "Algo deu errado")}
      text={
        message ??
        (offline
          ? "Confira sua internet e tente de novo."
          : "Não conseguimos carregar agora. Tente de novo em instantes.")
      }
      action={
        onRetry
          ? {
              label: "Tentar de novo",
              onPress: onRetry,
              variant: "soft",
              icon: "rotate-ccw",
              loading: retrying,
            }
          : undefined
      }
      compact={compact}
      style={style}
    />
  );
}
