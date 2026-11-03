import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import type { QrCurrent } from "@/contracts/gamification";
import { QR_TTL_OPTIONS } from "@/contracts/gamification";
import { errorMessage } from "@/core/api/errors";
import { merchantApi } from "@/core/merchant/merchant-api";
import {
  Button,
  createStyles,
  fontFamily,
  layout,
  NavHeader,
  ScreenContainer,
  Segmented,
  Switch,
  Text,
  toast,
} from "@/design";
import { QrCode } from "@/features/coupons";
import { useNow } from "@/shared/hooks/useNow";

const SHORT: Record<number, string> = { 45: "45 s", 300: "5 min", 3600: "1 h", 86400: "24 h" };
type Ttl = `${(typeof QR_TTL_OPTIONS)[number]["seconds"]}`;
const OPTIONS = QR_TTL_OPTIONS.map((o) => ({
  value: String(o.seconds) as Ttl,
  label: SHORT[o.seconds] ?? o.label,
}));

/**
 * /lojista/qr: QR Code do selo de um desafio da loja (Fase 2). Escolhe o prazo,
 * pode renovar sozinho (telão) e mostra a contagem. Vencido, o código some.
 */
export default function MerchantQrScreen() {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { challengeId = "", title = "" } = useLocalSearchParams<{
    challengeId: string;
    title: string;
  }>();
  const [ttl, setTtl] = useState<Ttl>("300");
  const [rotating, setRotating] = useState(false);
  const [qr, setQr] = useState<{ id: string } | null>(null);
  const [current, setCurrent] = useState<QrCurrent | null>(null);
  const [busy, setBusy] = useState(false);
  const now = useNow(250);
  const expiresAt = current ? new Date(current.expiresAt).getTime() : 0;
  const left = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const expired = current !== null && left === 0 && !current.rotating;

  // Telão: ao virar a janela, busca o código novo (o anterior deixa de valer).
  useEffect(() => {
    if (!qr || !current?.rotating || left > 0) return;
    let alive = true;
    void merchantApi.qrCodes
      .current(qr.id)
      .then((next) => alive && setCurrent(next))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [qr, current?.rotating, left]);

  const generate = async () => {
    setBusy(true);
    try {
      const created = await merchantApi.qrCodes.create(challengeId, {
        label: `${title || "QR"} (app do lojista)`.slice(0, 60),
        ttlSeconds: Number(ttl),
        rotating,
      });
      setQr(created);
      setCurrent(await merchantApi.qrCodes.current(created.id));
    } catch (e) {
      toast.show(errorMessage(e), "circle-alert");
    } finally {
      setBusy(false);
    }
  };

  const size = Math.min(300, width - layout.gutter * 2 - 40);
  return (
    <ScreenContainer top="none">
      <ScrollView showsVerticalScrollIndicator={false}>
        <NavHeader title="QR Code do selo" />
        <View style={styles.pad}>
          <Text variant="title" accessibilityRole="header">
            {title || "Desafio"}
          </Text>
          <Text variant="small" tone="textMuted" style={styles.lead}>
            O visitante lê com o app ARP e ganha o selo. Todo código tem prazo e o vencido é
            recusado, inclusive print.
          </Text>

          {current && !expired ? (
            <View style={styles.qrBox}>
              <View style={styles.qrPaper}>
                <QrCode value={current.payload} size={size} />
              </View>
              <Text style={styles.count} tabular accessibilityLiveRegion="polite">
                {formatLeft(left)}
              </Text>
              <Text variant="small" tone="textMuted" align="center">
                {current.rotating ? "até o código mudar" : "até o QR Code vencer"}
              </Text>
              <Button
                label="Gerar outro"
                variant="soft"
                onPress={() => {
                  setQr(null);
                  setCurrent(null);
                }}
              />
            </View>
          ) : (
            <View style={styles.form}>
              {expired ? (
                <Text variant="bodyStrong" tone="dangerText" align="center">
                  QR Code vencido
                </Text>
              ) : null}
              <Text variant="smallStrong">Prazo</Text>
              <Segmented options={OPTIONS} value={ttl} onChange={setTtl} />
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text variant="bodyStrong">Renovar sozinho (para telão)</Text>
                  <Text variant="caption" tone="textMuted">
                    O código muda a cada prazo e o anterior deixa de valer.
                  </Text>
                </View>
                <Switch
                  value={rotating}
                  onValueChange={setRotating}
                  accessibilityLabel="Renovar sozinho (para telão)"
                />
              </View>
              <Button
                label="Gerar QR Code"
                iconLeft="qr-code"
                loading={busy}
                disabled={!challengeId}
                onPress={() => void generate()}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function formatLeft(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const useStyles = createStyles((t) => ({
  pad: { paddingHorizontal: layout.gutter, paddingBottom: 40 },
  lead: { marginTop: 6 },
  qrBox: { alignItems: "center", gap: 10, marginTop: 22 },
  qrPaper: { padding: 16, borderRadius: 28, backgroundColor: "#ffffff" },
  count: {
    fontFamily: fontFamily(850),
    fontSize: 44,
    lineHeight: 50,
    marginTop: 6,
    color: t.colors.text,
  },
  form: { gap: 14, marginTop: 22 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: t.colors.surface,
  },
  switchText: { flex: 1, minWidth: 0, gap: 2 },
}));
