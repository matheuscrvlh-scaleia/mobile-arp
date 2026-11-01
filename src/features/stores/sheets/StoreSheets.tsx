import * as Linking from "expo-linking";
import type { ReactNode } from "react";
import { View } from "react-native";
import type { StoreDetail } from "@/contracts/app/stores";
import {
  Button,
  createStyles,
  Icon,
  type IconName,
  PressableScale,
  radii,
  SheetActions,
  SheetIcon,
  SheetText,
  SheetTitle,
  sheet,
  Text,
  toast,
  useColors,
} from "@/design";
import { type ContactKind, type ContactOption, contactOptions } from "../lib/contact";
import { openStatus, weekSchedule } from "../lib/hours";

/* Painéis da página da loja: semana de horários e formas de contato. O conteúdo é desenhado
   dentro do OverlayHost (abaixo do ThemeProvider), então acompanha o tema. */

function Week({ store, now }: { store: StoreDetail; now: Date }) {
  const styles = useStyles();
  return (
    <View style={styles.week}>
      {weekSchedule(store.hours, now).map((row) => (
        <View key={row.weekday} style={[styles.day, row.isToday && styles.today]}>
          <Text variant={row.isToday ? "bodyStrong" : "body"}>
            {row.isToday ? `${row.day} (hoje)` : row.day}
          </Text>
          <Text
            variant={row.isToday ? "bodyStrong" : "body"}
            tone={row.hours === "Fechado" ? "textMuted" : "text"}
            tabular
          >
            {row.hours}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function openHoursSheet(store: StoreDetail) {
  const now = new Date();
  const status = openStatus(store.hours, now);
  sheet.open(({ close }) => (
    <>
      <SheetIcon name="clock" background="surface" />
      <SheetTitle>Horários da {store.name}</SheetTitle>
      <SheetText>{status.label}</SheetText>
      <Week store={store} now={now} />
      <SheetActions>
        <Button label="Fechar" variant="soft" onPress={close} />
      </SheetActions>
    </>
  ));
}

const CONTACT_ICON: Record<Exclude<ContactKind, "phone">, IconName> = {
  whatsapp: "message-circle",
  instagram: "camera",
  website: "link",
};

function open(url: string) {
  Linking.openURL(url).catch(() => toast.show("Não foi possível abrir agora", "circle-x"));
}

function ContactRow({ option: o, onPress }: { option: ContactOption; onPress: () => void }) {
  const c = useColors();
  const styles = useStyles();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${o.label}: ${o.value}`}
      style={styles.contact}
    >
      <View style={styles.contactIcon}>
        {o.kind === "phone" ? (
          <Icon name="phone" size={20} color={c.onInverse} />
        ) : (
          <Icon name={CONTACT_ICON[o.kind]} color={c.onInverse} />
        )}
      </View>
      <View style={styles.contactText}>
        <Text variant="bodyStrong">{o.label}</Text>
        <Text variant="small" tone="textMuted" numberOfLines={1}>
          {o.value}
        </Text>
      </View>
      <Icon name="arrow-up-right" size={18} color={c.textMuted} />
    </PressableScale>
  );
}

function ContactList({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.contacts}>{children}</View>;
}

export function openContactSheet(store: StoreDetail) {
  const options = contactOptions(store);
  sheet.open(({ closeThen }) => (
    <>
      <SheetIcon name="message-circle" background="brand" />
      <SheetTitle>Falar com a {store.name}</SheetTitle>
      <SheetText>Escolha como prefere falar com a loja.</SheetText>
      <ContactList>
        {options.map((o) => (
          <ContactRow key={o.kind} option={o} onPress={closeThen(() => open(o.url))} />
        ))}
      </ContactList>
    </>
  ));
}

const useStyles = createStyles((t) => ({
  week: { gap: 2, marginBottom: 20 },
  day: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  today: { backgroundColor: t.colors.brand50 },
  contacts: { gap: 10 },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: t.colors.surface,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: t.colors.inverse,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: { flex: 1, minWidth: 0 },
}));
