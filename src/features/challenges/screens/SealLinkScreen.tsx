import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useStore } from "zustand";
import { errorMessage } from "@/core/api/errors";
import { useSession } from "@/core/auth/session";
import { EmptyState, NavHeader, overlayStore, ScreenContainer, Spinner, Text } from "@/design";
import { requireAuth } from "@/features/auth";
import { haptic } from "@/shared/lib/haptics";
import { getCachedChallenges, useScanSeal } from "../api/challenges";
import { lastSeal } from "../lib/last-seal";
import { QR_PREFIX } from "../lib/progress";
import { refusalCopy, scanRefusal } from "../lib/scan-result";
import { goToChallenges, openRefusalSheet } from "../sheets/refusal-sheet";

/**
 * Link de selo (/selo/[token]): a câmera do celular abriu arp://selo/<token>.
 * Pede conta se precisar, valida na API e vai para a celebração.
 */
export default function SealLinkScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const status = useSession((s) => s.status);
  const focused = useIsFocused();
  const sheetOpen = useStore(overlayStore, (s) => s.sheet !== null);
  const scan = useScanSeal();
  const [error, setError] = useState<unknown>(null);
  const started = useRef(false);
  const gateShown = useRef(false);
  const gatePending = useRef(false);

  const submit = () => {
    setError(null);
    scan
      .mutateAsync(`${QR_PREFIX}${token ?? ""}`)
      .then((result) => {
        haptic.success();
        lastSeal.set(result);
        router.replace("/selo-conquistado");
      })
      .catch((err: unknown) => {
        haptic.error();
        setError(err);
        const kind = scanRefusal(err, getCachedChallenges());
        if (kind) openRefusalSheet(kind, { context: "link" });
      });
  };

  // espera a sessão restaurar (link abrindo o app frio) antes de decidir se pede conta
  useEffect(() => {
    if (status === "restoring" || started.current) return;
    started.current = true;
    if (status === "guest") gatePending.current = true;
    requireAuth(submit, {
      title: "Entre para ganhar o selo",
      text: "Crie sua conta (leva 30 segundos) ou entre, e o selo deste QR Code vai direto para a sua coleção.",
    });
  });

  // visitante fechou o convite (ou voltou do cadastro) sem entrar: vai para os desafios
  useEffect(() => {
    if (!gatePending.current) return;
    if (sheetOpen) {
      gateShown.current = true;
      return;
    }
    if (gateShown.current && status === "guest" && focused) {
      gatePending.current = false;
      goToChallenges();
    }
  }, [sheetOpen, status, focused]);

  const kind = error ? scanRefusal(error, getCachedChallenges()) : null;
  const copy = kind ? refusalCopy(kind) : null;

  return (
    <ScreenContainer top="none">
      <NavHeader title="Selo" onBack={goToChallenges} />
      <View style={styles.center}>
        {error ? (
          <EmptyState
            icon={copy?.icon ?? "circle-alert"}
            title={copy?.title ?? "Não deu para validar o selo"}
            text={copy?.text ?? errorMessage(error)}
            action={
              kind
                ? { label: "Ver desafios", onPress: goToChallenges, icon: "award" }
                : { label: "Tentar de novo", onPress: submit, icon: "rotate-ccw" }
            }
          />
        ) : (
          <View style={styles.loading} accessibilityLiveRegion="polite">
            <Spinner size={28} />
            <Text variant="bodyStrong" align="center">
              Validando seu selo…
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", paddingBottom: 60 },
  loading: { alignItems: "center", gap: 14 },
});
