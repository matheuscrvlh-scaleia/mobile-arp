import * as Clipboard from "expo-clipboard";
import { View } from "react-native";
import type { Claim, WalletStatus } from "@/contracts/app/coupons";
import type { StoreDetail } from "@/contracts/app/stores";
import { mediaUrl } from "@/core/api/media";
import {
  createStyles,
  fontFamily,
  Icon,
  IconButton,
  Photo,
  Text,
  toast,
  tracking,
  useColors,
} from "@/design";
import { storeLocation } from "@/features/stores";
import { QrCode } from "./QrCode";
import { StatusStamp, Tear, TicketFoot } from "./TicketParts";

export { TICKET_SCREEN_BG } from "./TicketParts";

const QR_SIZE = 184;

type TicketProps = {
  claim: Claim;
  /** Situação já considerando o prazo vencido offline (`effectiveStatus`). */
  status: WalletStatus;
  store?: StoreDetail;
  onExpire: () => void;
};

/** Logo da loja (pt). */
const MONO = 44;

/**
 * Bilhete do "meu cupom" (.ticket): loja e oferta, QR + código, e o prazo ou o carimbo.
 * O papel do bilhete segue o tema (`surfaceRaised`); a moldura do QR é `paper` (branca nos dois
 * temas) para o leitor do caixa sempre ver preto no branco.
 */
export function Ticket({ claim, status, store, onExpire }: TicketProps) {
  const styles = useStyles();
  const colors = useColors();
  const active = status === "active";
  const photo = mediaUrl(store?.logoUrl ?? store?.coverImageUrl);

  const copy = () => {
    Clipboard.setStringAsync(claim.code)
      .then(() => toast.show("Código copiado", "copy-check"))
      .catch(() => toast.show("Não foi possível copiar", "copy-x"));
  };

  return (
    <View style={styles.ticket}>
      <View style={styles.sec}>
        <View style={styles.head}>
          {photo ? (
            <Photo source={photo} displayWidth={MONO} style={styles.mono} />
          ) : (
            <View style={[styles.mono, { backgroundColor: claim.store.brandColor }]}>
              <Icon name={claim.store.icon} color={colors.onMedia} />
            </View>
          )}
          <View style={styles.headText}>
            <Text variant="bodyStrong" weight={700} style={styles.storeName} numberOfLines={1}>
              {claim.store.name}
            </Text>
            {store ? (
              <Text variant="small" tone="textMuted" numberOfLines={1}>
                {storeLocation(store)}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.offer}>{claim.coupon.title}</Text>
      </View>

      <Tear />

      <View style={styles.qrSec}>
        <View
          style={[styles.qr, !active && styles.faded]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`QR Code do cupom, código ${claim.code}`}
        >
          <QrCode value={claim.code} size={QR_SIZE} />
        </View>
        <View style={[styles.codeRow, !active && styles.faded]}>
          <Text
            style={styles.code}
            tabular
            selectable
            accessibilityLabel={`Código ${claim.code.split("").join(" ")}`}
          >
            {claim.code}
          </Text>
          <IconButton
            icon="copy"
            size={34}
            iconSize={16}
            onPress={copy}
            accessibilityLabel="Copiar código"
          />
        </View>
        <StatusStamp status={status} />
      </View>

      <Tear />

      <View style={styles.sec}>
        <TicketFoot claim={claim} status={status} onExpire={onExpire} />
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  ticket: {
    marginTop: 18,
    marginHorizontal: 20,
    backgroundColor: t.colors.surfaceRaised,
    borderRadius: 30,
    ...t.shadows.ticket,
  },
  sec: { paddingVertical: 20, paddingHorizontal: 22 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  mono: {
    width: MONO,
    height: MONO,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...t.shadows.hairline,
  },
  headText: { flex: 1, minWidth: 0 },
  storeName: { fontSize: 16, lineHeight: 21 },
  offer: {
    marginTop: 14,
    fontFamily: fontFamily(850),
    fontSize: 25,
    lineHeight: 27,
    letterSpacing: tracking(25, -0.045),
  },
  qrSec: { alignItems: "center", padding: 22 },
  qr: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: t.colors.paper,
    borderWidth: 1.5,
    borderColor: t.colors.border,
  },
  faded: { opacity: 0.25 },
  codeRow: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  code: {
    fontFamily: fontFamily(800),
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: tracking(24, 0.12),
    // fora da moldura do QR: sobre o papel do bilhete (preto no claro, quase branco no escuro)
    color: t.colors.text,
  },
}));
