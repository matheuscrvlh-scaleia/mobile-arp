import { StyleSheet, View } from "react-native";
import { Avatar, fontFamily, layout, Pill, Text, tracking } from "@/design";

export type ProfileHeadProps = {
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  initials?: string;
  guest?: boolean;
  /** Pill abaixo (nível e selos). */
  badge?: string;
};

/** Topo do perfil (.pf-head): avatar grande, nome e linha de apoio. */
export function ProfileHead({
  title,
  subtitle,
  avatarUrl,
  initials,
  guest,
  badge,
}: ProfileHeadProps) {
  return (
    <View style={styles.head}>
      <Avatar source={avatarUrl} initials={initials} guest={guest} size={92} ring="brand" />
      <Text accessibilityRole="header" align="center" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" tone="textMuted" align="center" style={styles.subtitle}>
        {subtitle}
      </Text>
      {badge ? <Pill label={badge} icon="award" variant="brand" style={styles.badge} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: "center", paddingTop: 8, paddingHorizontal: layout.gutter },
  title: {
    fontFamily: fontFamily(800),
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: tracking(26, -0.035),
    marginTop: 16,
    marginBottom: 2,
  },
  subtitle: { fontSize: 14, lineHeight: 20 },
  badge: { marginTop: 10, alignSelf: "center" },
});
