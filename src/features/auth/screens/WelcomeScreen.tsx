import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, createStyles, fontFamily, Text, tracking } from "@/design";
import { TextLink } from "../components/TextLink";
import { COLLAGE_BASE_H, WelcomeCollage } from "../components/WelcomeCollage";
import { onboarding } from "../lib/onboarding";

/** Altura que o texto e os botões precisam abaixo da colagem. */
const BODY_MIN_H = 330;

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const collageH = Math.max(
    260,
    Math.min((COLLAGE_BASE_H * width) / 390, height - BODY_MIN_H - insets.bottom),
  );

  // Qualquer saída conta: a boas-vindas aparece uma vez só.
  const leave = (go: () => void) => () => {
    onboarding.markDone();
    go();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="auto" animated />
      <WelcomeCollage width={width} height={collageH} />
      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
        <Text accessibilityRole="header" align="center" style={styles.title}>
          {"Onde tudo\nacontece."}
        </Text>
        <Text variant="muted" align="center" style={styles.text}>
          Lojas, sabores, eventos e benefícios para quem vive a ARP.
        </Text>
        <View style={styles.buttons}>
          <Button
            label="Criar minha conta"
            iconRight="arrow-right"
            onPress={leave(() => router.push("/cadastro"))}
          />
          <Pressable
            onPress={leave(() => router.replace("/"))}
            accessibilityRole="button"
            style={styles.explore}
          >
            <Text variant="bodyStrong" tone="textMuted">
              Explorar sem cadastro
            </Text>
          </Pressable>
          <TextLink
            prefix="Já tenho conta · "
            label="Entrar"
            onPress={leave(() => router.push("/entrar"))}
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  body: { flex: 1, paddingHorizontal: 26, paddingTop: 10 },
  title: {
    fontFamily: fontFamily(850),
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: tracking(34, -0.045),
    color: t.colors.text,
    marginTop: 6,
    marginBottom: 10,
  },
  text: { lineHeight: 22, maxWidth: 300, alignSelf: "center" },
  buttons: { marginTop: "auto", paddingTop: 20, gap: 6 },
  explore: { height: 50, alignItems: "center", justifyContent: "center" },
}));
