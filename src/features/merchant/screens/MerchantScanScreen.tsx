import { CameraView, useCameraPermissions } from "expo-camera";
import { Redirect, useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMerchantSession } from "@/core/merchant/merchant-session";
import {
  Button,
  createStyles,
  IconButton,
  layout,
  NavHeader,
  Spinner,
  Text,
  toast,
  useColors,
  withAlpha,
} from "@/design";
import { goBackOr } from "@/navigation/navigate";
import { haptic } from "@/shared/lib/haptics";
import { CameraGate } from "../components/CameraGate";
import { CodeField } from "../components/CodeField";
import { ScanFrame } from "../components/ScanFrame";
import { useValidateCode } from "../hooks/useValidateCode";
import { codeFromScan, fullCode, INCOMPLETE_CODE, isCompleteBody } from "../lib/code";

const BARCODE_SETTINGS = { barcodeTypes: ["qr" as const] };
const FINDER_MAX = 250;
const FINDER_MIN = 140;
/** Espaço da pílula de dica abaixo do visor. */
const HINT_SPACE = 64;
const FOREIGN_HINT_MS = 2500;
/** Depois de um resultado, a câmera ignora o MESMO código por um tempo (ele continua à vista). */
const SAME_CODE_COOLDOWN_MS = 3000;

/**
 * /lojista/validar: leitor do QR do ticket (o QR é o próprio código) em tela cheia, com o campo
 * para digitar. Mesmo fluxo de dois passos do painel: consulta → confirmação → uso.
 */
export default function MerchantScanScreen() {
  const signedIn = useMerchantSession((s) => s.status === "signedIn");
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const { check } = useValidateCode();

  // trava de leitura: o onBarcodeScanned dispara várias vezes por segundo
  const lock = useRef(false);
  const cooldown = useRef<{ code: string; until: number } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState(false);
  const [foreign, setForeign] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [middleH, setMiddleH] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const granted = permission?.granted ?? false;
  const cameraOn = focused && granted && !cameraError;

  // voltou dos ajustes do celular: relê a permissão
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void getPermission();
    });
    return () => sub.remove();
  }, [getPermission]);

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  const flashForeign = () => {
    if (!foreign) AccessibilityInfo.announceForAccessibility("Este QR Code não é de um cupom ARP");
    setForeign(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setForeign(false), FOREIGN_HINT_MS);
  };

  const run = (code: string, source: "camera" | "typed") => {
    if (lock.current) return;
    const blocked = cooldown.current;
    if (source === "camera" && blocked?.code === code && Date.now() < blocked.until) return;
    lock.current = true;
    setBusy(true);
    setForeign(false);
    Keyboard.dismiss();
    if (source === "camera") haptic.light();
    const release = () => {
      lock.current = false;
      setBusy(false);
    };
    const started = check(code, {
      onRedeemed: () => {
        release();
        if (source === "typed") setBody("");
        goBackOr("/lojista");
      },
      onDismissed: () => {
        release();
        cooldown.current = { code, until: Date.now() + SAME_CODE_COOLDOWN_MS };
      },
    });
    if (!started) release();
  };

  const onScanned = (data: string) => {
    if (lock.current) return;
    const code = codeFromScan(data);
    if (!code) {
      flashForeign();
      return;
    }
    run(code, "camera");
  };

  const submitTyped = () => {
    if (!body) {
      haptic.error();
      toast.show("Digite o código do cliente", "keyboard", { haptic: "none" });
      return;
    }
    if (!isCompleteBody(body)) {
      haptic.error();
      setError(INCOMPLETE_CODE);
      return;
    }
    run(fullCode(body), "typed");
  };

  const onMiddleLayout = (e: LayoutChangeEvent) => setMiddleH(e.nativeEvent.layout.height);

  if (!signedIn) return <Redirect href="/lojista/entrar" />;

  const size = Math.min(FINDER_MAX, middleH - HINT_SPACE - 24);
  const showFinder = granted && !cameraError && size >= FINDER_MIN;

  let hint = "Aponte para o QR Code do ticket do cliente";
  if (busy) hint = "Conferindo o código…";
  else if (foreign) hint = "Este QR Code não é de um cupom ARP";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" animated />
      {cameraOn ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={BARCODE_SETTINGS}
          onBarcodeScanned={busy ? undefined : (result) => onScanned(result.data)}
          onMountError={() => setCameraError(true)}
        />
      ) : null}

      <KeyboardAvoidingView behavior="padding" style={styles.column}>
        <View
          style={[styles.middle, { marginTop: insets.top + 6 + HEADER_H }]}
          onLayout={onMiddleLayout}
        >
          {permission === null ? (
            <Spinner color={colors.onMedia} />
          ) : !granted ? (
            <CameraGate
              canAsk={permission.canAskAgain}
              onRequest={() => void requestPermission()}
            />
          ) : cameraError ? (
            <Text variant="bodyStrong" tone="onMedia" align="center" style={styles.cameraError}>
              Câmera indisponível. Digite o código do cliente abaixo.
            </Text>
          ) : showFinder ? (
            <>
              <ScanFrame size={size} busy={busy} />
              <View style={styles.hint} accessibilityLiveRegion="polite">
                <Text variant="smallStrong" tone="onMedia" style={styles.hintText}>
                  {hint}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 12) + 14 }]}>
          <Text variant="h4">Ou digite o código</Text>
          <Text variant="small" tone="textMuted" style={styles.panelSub}>
            Está embaixo do QR, no ticket do cupom.
          </Text>
          <View style={styles.row}>
            <CodeField
              value={body}
              onChangeText={(next) => {
                setBody(next);
                if (error) setError(null);
              }}
              onSubmit={submitTyped}
              invalid={!!error}
              onRaised
            />
            <Button
              label="Validar"
              size="sm"
              loading={busy}
              onPress={submitTyped}
              style={styles.button}
            />
          </View>
          {error ? (
            <Text
              variant="small"
              tone="dangerText"
              style={styles.error}
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <NavHeader
        title="Ler QR do cliente"
        light
        backVariant="glass"
        onBack={() => goBackOr("/lojista")}
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
    </View>
  );
}

const HEADER_H = 46;

const useStyles = createStyles((t) => ({
  // fundo da câmera: preto nos dois temas
  screen: { flex: 1, backgroundColor: t.colors.scrim, overflow: "hidden" },
  header: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 3 },
  column: { flex: 1 },
  // abaixo do cabeçalho (status bar + 6 + 46, somados na tela)
  middle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  hint: {
    marginTop: 21,
    backgroundColor: withAlpha(t.colors.onMedia, 0.14),
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  hintText: { fontSize: 14 },
  cameraError: { paddingHorizontal: 40 },
  panel: {
    zIndex: 2,
    marginHorizontal: 10,
    marginBottom: 10,
    paddingTop: 20,
    paddingHorizontal: layout.gutter,
    borderRadius: 32,
    backgroundColor: t.colors.surfaceRaised,
    ...t.shadows.float,
  },
  panelSub: { marginTop: 2, marginBottom: 12 },
  row: { flexDirection: "row", gap: 8 },
  button: { width: 110, height: 54, borderRadius: 18, alignSelf: "auto" },
  error: { marginTop: 8, marginLeft: 4 },
}));
