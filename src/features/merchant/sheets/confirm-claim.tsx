import { type ReactNode, useState } from "react";
import { View } from "react-native";
import type { MerchantClaim } from "@/contracts/app/merchant";
import {
  Button,
  Countdown,
  createStyles,
  fontFamily,
  Pill,
  SheetActions,
  type SheetApi,
  SheetIcon,
  SheetText,
  SheetTitle,
  Text,
  tracking,
} from "@/design";
import { useNow } from "@/shared/hooks/useNow";
import { MINUTE_MS } from "@/shared/lib/time";
import { useRedeemClaim } from "../api/merchant";
import { dayTimeLabel } from "../lib/overview";

export type ConfirmClaimSheetProps = {
  claim: MerchantClaim;
  api: SheetApi;
  /** O código foi usado (a resposta do servidor). */
  onRedeemed: (claim: MerchantClaim) => void;
  /** O servidor recusou o uso (já usado em outro caixa, venceu agora…). */
  onFailed: (error: unknown) => void;
};

/**
 * Segundo passo do caixa: o cupom, o primeiro nome do cliente, quando pegou e quanto falta do
 * prazo. Só "Confirmar uso" gasta o código (evita usar o código errado por engano).
 */
export function ConfirmClaimSheet({ claim, api, onRedeemed, onFailed }: ConfirmClaimSheetProps) {
  const styles = useStyles();
  const redeem = useRedeemClaim();
  const now = useNow(MINUTE_MS);
  const [expired, setExpired] = useState(() => Date.parse(claim.expiresAt) <= Date.now());
  const busy = redeem.isPending;

  const confirm = () => {
    if (busy || expired) return;
    // A promessa resolve mesmo se o painel já tiver fechado: o aviso de "validado" sempre sai.
    redeem.mutateAsync(claim.code).then(onRedeemed, onFailed);
  };

  return (
    <>
      <SheetIcon name="ticket-check" background="brand" />
      <View style={styles.kicker}>
        <Text variant="label" tone="textMuted">
          Confira com o cliente
        </Text>
        <Pill
          variant={expired ? "clay" : "brand"}
          icon={expired ? "clock-alert" : "circle-check"}
          label={expired ? "Prazo encerrado" : "Dentro do prazo"}
        />
      </View>
      <SheetTitle>{claim.coupon.headline}</SheetTitle>
      <SheetText>{claim.coupon.title}</SheetText>

      <View style={styles.facts}>
        <Fact label="Cliente" value={claim.visitor.firstName || "Visitante"} />
        <Fact label="Código" value={<Text style={styles.code}>{claim.code}</Text>} />
        <Fact label="Pego" value={dayTimeLabel(claim.claimedAt, now)} />
        <Fact
          label="Vence em"
          last
          value={
            expired ? (
              <Text variant="bodyStrong" tone="dangerText">
                Venceu
              </Text>
            ) : (
              <Countdown
                to={claim.expiresAt}
                variant="bodyStrong"
                onEnd={() => setExpired(true)}
                accessibilityLabel="Tempo até o código vencer"
              />
            )
          }
        />
      </View>

      <SheetActions>
        <Button
          label="Confirmar uso"
          variant="brand"
          iconLeft="check"
          loading={busy}
          disabled={expired}
          onPress={confirm}
          accessibilityHint="Marca o código como usado. Não dá para desfazer."
        />
        <Button label="Cancelar" variant="soft" disabled={busy} onPress={api.close} />
      </SheetActions>
    </>
  );
}

function Fact({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  const styles = useStyles();
  return (
    <View style={[styles.fact, !last && styles.divider]}>
      <Text variant="small" tone="textMuted">
        {label}
      </Text>
      {typeof value === "string" ? (
        <Text variant="bodyStrong" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  kicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  facts: {
    backgroundColor: t.colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 48,
    paddingVertical: 10,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  value: { flexShrink: 1, textAlign: "right" },
  code: {
    fontFamily: fontFamily(700),
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: tracking(15, 0.06),
    color: t.colors.text,
  },
}));
