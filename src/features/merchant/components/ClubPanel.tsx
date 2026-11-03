import { useRouter } from "expo-router";
import { View } from "react-native";
import type { MerchantClub } from "@/contracts/app/merchant";
import { Button, createStyles, fontFamily, Text } from "@/design";
import { Panel } from "./Panel";

/**
 * Clube ARP e atalhos do lojista (Fase 2): selos dados no mês (base da cobrança),
 * a posição da loja em cupons usados (nunca números de outras lojas), QR dos
 * desafios da loja, cupons e vagas.
 */
export function ClubPanel({ club }: { club: MerchantClub }) {
  const styles = useStyles();
  const router = useRouter();
  return (
    <Panel
      title="Clube ARP"
      subtitle={
        club.couponsRank
          ? `Sua loja está em ${club.couponsRank}º em cupons usados no mês.`
          : "Nenhum cupom usado no mês ainda."
      }
    >
      <View style={styles.stat}>
        <Text style={styles.big} tabular>
          {club.sealsMonth.toLocaleString("pt-BR")}
        </Text>
        <Text variant="small" tone="textMuted">
          {club.sealsMonth === 1 ? "selo dado no mês" : "selos dados no mês"}
        </Text>
      </View>

      {club.challenges.map((c) => (
        <View key={c.id} style={styles.row}>
          <View style={styles.rowText}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {c.product ?? c.title}
            </Text>
            <Text variant="caption" tone="textMuted">
              Selo {c.sealName}
            </Text>
          </View>
          <Button
            label="Gerar QR"
            size="sm"
            variant="dark"
            iconLeft="qr-code"
            onPress={() =>
              router.push({
                pathname: "/lojista/qr",
                params: { challengeId: c.id, title: c.product ?? c.title },
              })
            }
          />
        </View>
      ))}

      <View style={styles.links}>
        <Button
          label="Seus cupons"
          size="sm"
          variant="soft"
          iconLeft="ticket-percent"
          onPress={() => router.push("/lojista/cupons")}
        />
        <Button
          label="Vagas"
          size="sm"
          variant="soft"
          iconLeft="briefcase"
          onPress={() => router.push("/lojista/vagas")}
        />
      </View>
    </Panel>
  );
}

const useStyles = createStyles((t) => ({
  stat: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 10 },
  big: { fontFamily: fontFamily(800), fontSize: 34, lineHeight: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: t.colors.surfaceRaised,
  },
  rowText: { flex: 1, minWidth: 0 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
}));
