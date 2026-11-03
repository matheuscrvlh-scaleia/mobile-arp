import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { ALL_WEEKDAYS, WEEKDAY_SHORT, weekdaysLabel } from "@/contracts/common";
import type { Coupon } from "@/contracts/promotions";
import { errorMessage } from "@/core/api/errors";
import { merchantApi } from "@/core/merchant/merchant-api";
import { useMerchantSession } from "@/core/merchant/merchant-session";
import { queryKeys } from "@/core/query/keys";
import {
  Button,
  createStyles,
  layout,
  NavHeader,
  Pill,
  type PillVariant,
  ScreenContainer,
  Spinner,
  Text,
  toast,
} from "@/design";
import { AuthField } from "@/shared/form/AuthField";
import { useMerchantCoupons } from "../api/merchant";

const REVIEW: Record<Coupon["review"], { label: string; variant: PillVariant }> = {
  pending: { label: "Aguardando ARP", variant: "clay" },
  approved: { label: "Aprovado", variant: "brand" },
  rejected: { label: "Recusado", variant: "dark" },
};

/** /lojista/cupons: cupons da loja e criar novo (fica "Aguardando ARP" até aprovar). */
export default function MerchantCouponsScreen() {
  const styles = useStyles();
  const storeId = useMerchantSession((s) => s.profile?.storeId ?? "");
  const coupons = useMerchantCoupons(storeId);
  const [creating, setCreating] = useState(false);

  return (
    <ScreenContainer top="none">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <NavHeader title="Seus cupons" />
        <View style={styles.pad}>
          {creating ? (
            <NewCouponForm storeId={storeId} onDone={() => setCreating(false)} />
          ) : (
            <Button
              label="Novo cupom"
              iconLeft="ticket-percent"
              onPress={() => setCreating(true)}
            />
          )}
          {coupons.isLoading ? <Spinner /> : null}
          {(coupons.data ?? []).map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text variant="bodyStrong" style={styles.flex} numberOfLines={2}>
                  {c.title}
                </Text>
                <Pill label={REVIEW[c.review].label} variant={REVIEW[c.review].variant} />
              </View>
              <Text variant="small" tone="textMuted">
                {c.headline} · {c.totalQuantity} cupons · vale {weekdaysLabel(c.weekdays)}
              </Text>
              {c.review === "rejected" && c.reviewNote ? (
                <Text variant="small" tone="dangerText">
                  Motivo: {c.reviewNote}
                </Text>
              ) : null}
            </View>
          ))}
          {coupons.data?.length === 0 ? (
            <Text variant="small" tone="textMuted">
              Nenhum cupom ainda.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function NewCouponForm({ storeId, onDone }: { storeId: string; onDone: () => void }) {
  const styles = useStyles();
  const qc = useQueryClient();
  const store = useMerchantSession((s) => s.profile?.stores.find((x) => x.id === storeId));
  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [quantity, setQuantity] = useState("50");
  const [days, setDays] = useState<number[]>([...ALL_WEEKDAYS]);
  const [busy, setBusy] = useState(false);

  const toggle = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const submit = async () => {
    const total = Number.parseInt(quantity, 10);
    if (title.trim().length < 3 || !headline.trim() || !(total > 0) || days.length === 0) {
      toast.show("Preencha oferta, destaque, quantidade e ao menos um dia", "circle-alert");
      return;
    }
    setBusy(true);
    try {
      await merchantApi.coupons.create({
        storeId,
        title: title.trim(),
        headline: headline.trim(),
        totalQuantity: total,
        redeemWindowHours: 24,
        tone: "green",
        icon: store?.icon ?? "ticket-percent",
        startsAt: new Date().toISOString(),
        weekdays: days,
        status: "active",
      });
      void qc.invalidateQueries({ queryKey: queryKeys.merchant.coupons(storeId) });
      toast.show("Cupom enviado. Ele fica “Aguardando ARP” até a aprovação.");
      onDone();
    } catch (e) {
      toast.show(errorMessage(e), "circle-alert");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <AuthField
        icon="ticket-percent"
        label="Oferta"
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        hint="Ex.: Café + pão de queijo"
      />
      <AuthField
        icon="badge-percent"
        label="Destaque"
        value={headline}
        onChangeText={setHeadline}
        maxLength={16}
        hint="Ex.: 20% OFF"
      />
      <AuthField
        icon="ticket-check"
        label="Quantidade"
        value={quantity}
        onChangeText={(v) => setQuantity(v.replace(/\D/g, ""))}
        keyboardType="number-pad"
        maxLength={6}
      />
      <Text variant="smallStrong">Dias em que vale</Text>
      <View style={styles.days}>
        {ALL_WEEKDAYS.map((d) => {
          const on = days.includes(d);
          return (
            <Pressable
              key={d}
              onPress={() => toggle(d)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[styles.day, on && styles.dayOn]}
            >
              <Text variant="smallStrong" tone={on ? "onBrand" : "text"}>
                {WEEKDAY_SHORT[d]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button label="Enviar para a ARP" loading={busy} onPress={() => void submit()} />
      <Button label="Cancelar" variant="soft" onPress={onDone} />
    </View>
  );
}

const useStyles = createStyles((t) => ({
  pad: { paddingHorizontal: layout.gutter, paddingBottom: 40, gap: 12 },
  flex: { flex: 1 },
  card: { padding: 14, borderRadius: 20, backgroundColor: t.colors.surface, gap: 4 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  form: { gap: 12, padding: 14, borderRadius: 22, backgroundColor: t.colors.surface },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  day: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: t.colors.surfaceRaised,
  },
  dayOn: { backgroundColor: t.colors.brand },
}));
