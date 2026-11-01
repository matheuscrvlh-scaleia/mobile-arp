import { View } from "react-native";
import type { CouponCard } from "@/contracts/app/coupons";
import { createStyles, Icon, type IconName, radii, Text } from "@/design";
import { formatDayMonth, formatTime, plural } from "@/shared/lib/format";

type Rule = { icon: IconName; title: string; text: string };

function rulesFor(coupon: CouponCard): Rule[] {
  const rules: Rule[] = [
    {
      icon: "timer",
      title: `${plural(coupon.redeemWindowHours, "hora", "horas")} para usar`,
      text: "O prazo começa quando você pega o cupom",
    },
    {
      icon: "rotate-ccw",
      title: "Não usou? Ele volta",
      text: "Depois do prazo, o cupom volta pra outra pessoa",
    },
    { icon: "fingerprint", title: "Código único", text: "Vale uma vez, um por pessoa" },
    {
      icon: "store",
      title: "Mostre no caixa",
      text: `A ${coupon.store.name} valida o seu código`,
    },
  ];
  if (coupon.endsAt) {
    rules.push({
      icon: "calendar-days",
      title: `Promoção até ${formatDayMonth(coupon.endsAt)} às ${formatTime(coupon.endsAt)}`,
      text: "Depois disso, não dá mais para pegar",
    });
  }
  return rules;
}

/** Regras do cupom (.rules): prazo, devolução, código único e validação no caixa. */
export function CouponRules({ coupon }: { coupon: CouponCard }) {
  const styles = useStyles();
  const rules = rulesFor(coupon);
  return (
    <View style={styles.box}>
      {rules.map((r, i) => (
        <View key={r.icon} style={[styles.rule, i === rules.length - 1 && styles.last]}>
          <View style={styles.icon}>
            <Icon name={r.icon} size={19} />
          </View>
          <View style={styles.texts}>
            <Text variant="bodyStrong">{r.title}</Text>
            <Text variant="small" tone="textMuted">
              {r.text}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = createStyles((t) => ({
  box: {
    marginTop: 24,
    backgroundColor: t.colors.surface,
    borderRadius: radii.xl,
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 2,
  },
  rule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  last: { borderBottomWidth: 0 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: t.colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1 },
}));
