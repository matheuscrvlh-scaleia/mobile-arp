import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  AppState,
  Keyboard,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { errorMessage } from "@/core/api/errors";
import { isSignedIn } from "@/core/auth/session";
import {
  createStyles,
  IconButton,
  NavHeader,
  overlayStore,
  Spinner,
  Text,
  toast,
  useColors,
  withAlpha,
} from "@/design";
import { requireAuth } from "@/features/auth";
import { haptic } from "@/shared/lib/haptics";
import { SECOND_MS } from "@/shared/lib/time";
import { useChallenges, useScanSeal } from "../api/challenges";
import { CameraPermission } from "../components/CameraPermission";
import { RetryCountdown } from "../components/RetryCountdown";
import { type ScanFailureNotice, ScanPanel } from "../components/ScanPanel";
import { Viewfinder } from "../components/Viewfinder";
import { lastSeal } from "../lib/last-seal";
import { isArpSealPayload } from "../lib/progress";
import { scanFailure } from "../lib/scan-result";
import { openRefusalSheet } from "../sheets/refusal-sheet";

const BARCODE_SETTINGS = { barcodeTypes: ["qr" as const] };
const FINDER = 250;
const HEADER_H = 46;
const HINT_SPACE = 64;
/** Tempo mínimo do visor "ok" antes de ir para a celebração (o protótipo usa 1,1 s). */
const OK_MIN_MS = 700;
const FOREIGN_HINT_MS = 2500;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Leitor de QR (/ler-qr): câmera real, visor animado e o campo "Digitar código". */
export default function ScanScreen() {
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const { desafio } = useLocalSearchParams<{ desafio?: string }>();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const focused = useIsFocused();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const { data } = useChallenges();
  const scan = useScanSeal();

  // trava de leitura: o onBarcodeScanned dispara várias vezes por segundo
  const lock = useRef(false);
  // QR que acabou de falhar: a câmera continua vendo o mesmo código e o reenviaria a cada
  // ~2 s até estourar o limite da API (30/min). Ele só volta pelo "Tentar de novo".
  const blocked = useRef<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ok, setOk] = useState(false);
  const [failure, setFailure] = useState<ScanFailureNotice | null>(null);
  const [foreign, setForeign] = useState(false);
  const [torch, setTorch] = useState(false);
  const [typing, setTyping] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [panelH, setPanelH] = useState(230);
  const [keyboardH, setKeyboardH] = useState(0);

  const challenge = desafio ? (data?.challenges.find((c) => c.id === desafio) ?? null) : null;
  const granted = permission?.granted ?? false;
  const cameraOn = focused && granted && !cameraError;

  // voltou dos ajustes do celular: relê a permissão
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(show, (e) => setKeyboardH(e.endCoordinates.height));
    const b = Keyboard.addListener(hide, () => setKeyboardH(0));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  // 429: leitura travada até o Retry-After; depois o "Tentar de novo" do painel libera.
  const until = failure?.until ?? null;
  useEffect(() => {
    if (until == null) return;
    const timer = setTimeout(
      () => setFailure((f) => (f ? { ...f, until: null } : f)),
      Math.max(0, until - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [until]);
  const coolingDown = until != null;

  const unlock = () => {
    lock.current = false;
  };

  const flashForeign = () => {
    if (!foreign) AccessibilityInfo.announceForAccessibility("Este QR Code não é da ARP");
    setForeign(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setForeign(false), FOREIGN_HINT_MS);
  };

  const fail = (payload: string, error: unknown) => {
    setOk(false);
    blocked.current = payload;
    haptic.error();
    const result = scanFailure(error, data);
    switch (result.kind) {
      case "refusal":
        openRefusalSheet(result.refusal, { context: "scan", onClose: unlock });
        return;
      case "rateLimited":
        setFailure({
          payload,
          message: errorMessage(error),
          until: Date.now() + result.retryAfterSec * SECOND_MS,
        });
        AccessibilityInfo.announceForAccessibility(
          `Muitas tentativas. Tente de novo em ${result.retryAfterSec} segundos.`,
        );
        unlock();
        return;
      case "transient":
        setFailure({ payload, message: errorMessage(error), until: null });
        toast.show(errorMessage(error), "circle-alert");
        unlock();
        return;
    }
  };

  const submit = (payload: string) => {
    lock.current = true;
    setOk(true);
    setForeign(false);
    setFailure(null);
    haptic.light();
    Promise.all([scan.mutateAsync(payload), wait(OK_MIN_MS)])
      .then(([result]) => {
        haptic.success();
        lastSeal.set(result);
        router.replace("/selo-conquistado");
      })
      .catch((error: unknown) => fail(payload, error));
  };

  /** "Tentar de novo" do painel: o único jeito de reenviar o QR que falhou. */
  const retry = () => {
    if (!failure || coolingDown || lock.current) return;
    blocked.current = null;
    submit(failure.payload);
  };

  const handleRead = (text: string, source: "camera" | "typed") => {
    if (lock.current || coolingDown) return;
    if (!isArpSealPayload(text)) {
      flashForeign();
      return;
    }
    const payload = text.trim();
    // a câmera ainda vê o QR que falhou: ignora (digitar o código é um pedido explícito)
    if (source === "camera" && payload === blocked.current) return;
    lock.current = true;
    Keyboard.dismiss();
    if (isSignedIn()) {
      submit(payload);
      return;
    }
    requireAuth(() => submit(payload), {
      title: "Entre para ganhar o selo",
      text: "Crie sua conta (leva 30 segundos) ou entre, e o selo deste QR Code vai direto para a sua coleção.",
    });
    // fechou o convite sem entrar: volta a ler
    const unsubscribe = overlayStore.subscribe((state) => {
      if (state.sheet) return;
      unsubscribe();
      if (!isSignedIn()) unlock();
    });
  };

  // visor centrado entre o cabeçalho e o painel
  const headerBottom = insets.top + 6 + HEADER_H;
  const panelBottom = 10 + keyboardH;
  const panelTop = screenH - panelBottom - panelH;
  const region = panelTop - headerBottom;
  const size = Math.max(150, Math.min(FINDER, region - HINT_SPACE - 40));
  const showFinder = granted && region >= size + HINT_SPACE;
  const finderTop = headerBottom + (region - HINT_SPACE - size) / 2;
  const showPanel = granted || typing;

  let hint = "Procurando QR Code…";
  if (ok) hint = "QR Code válido!";
  else if (foreign) hint = "Este QR Code não é da ARP";
  else if (cameraError) hint = "Câmera indisponível. Digite o código.";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" animated />
      {cameraOn ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={BARCODE_SETTINGS}
          onBarcodeScanned={
            ok || coolingDown ? undefined : (result) => handleRead(result.data, "camera")
          }
          onMountError={() => {
            setCameraError(true);
            setTyping(true);
          }}
        />
      ) : null}

      {showFinder ? (
        <>
          <View style={[styles.finder, { top: finderTop, left: (screenW - size) / 2 }]}>
            <Viewfinder size={size} ok={ok} />
          </View>
          <View
            style={[styles.hint, { top: finderTop + size + 21 }]}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.hintPill}>
              <Text variant="smallStrong" tone="onMedia" style={styles.hintText}>
                {until != null && !ok ? <RetryCountdown until={until} /> : hint}
              </Text>
            </View>
          </View>
        </>
      ) : null}

      {permission === null ? (
        <View style={styles.center}>
          <Spinner color={colors.onMedia} />
        </View>
      ) : !granted && !typing ? (
        <View style={[styles.permission, { paddingTop: headerBottom }]}>
          <CameraPermission
            canAsk={permission.canAskAgain}
            onRequest={() => void requestPermission()}
            onTypeCode={() => setTyping(true)}
          />
        </View>
      ) : null}

      <NavHeader
        title="Ler QR Code"
        light
        backVariant="glass"
        style={styles.header}
        right={
          cameraOn ? (
            <IconButton
              icon="flashlight"
              variant={torch ? "white" : "glass"}
              accessibilityLabel={torch ? "Desligar lanterna" : "Ligar lanterna"}
              onPress={() => setTorch((t) => !t)}
            />
          ) : undefined
        }
      />

      {showPanel ? (
        <View
          style={[styles.panelWrap, { bottom: panelBottom }]}
          onLayout={(e) => setPanelH(e.nativeEvent.layout.height)}
        >
          <ScanPanel
            challenge={challenge}
            typing={typing}
            onToggleTyping={() => setTyping(true)}
            onSubmitCode={(payload) => handleRead(payload, "typed")}
            busy={ok}
            failure={failure}
            onRetry={retry}
            bottomPadding={keyboardH > 0 ? 20 : Math.max(30, insets.bottom + 6)}
          />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  // fundo da câmera: preto nos dois temas
  screen: { flex: 1, backgroundColor: t.colors.scrim, overflow: "hidden" },
  header: { zIndex: 3 },
  finder: { position: "absolute", zIndex: 2 },
  hint: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 3 },
  hintPill: {
    backgroundColor: withAlpha(t.colors.onMedia, 0.14),
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  hintText: { fontSize: 14 },
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  permission: { ...StyleSheet.absoluteFill, paddingBottom: 40 },
  panelWrap: { position: "absolute", left: 10, right: 10, zIndex: 3 },
}));
