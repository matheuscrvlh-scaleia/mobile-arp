import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, Share, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScanResult } from "@/contracts/app/challenges";
import {
  Button,
  createStyles,
  easings,
  fontFamily,
  IconButton,
  Text,
  tracking,
  withAlpha,
} from "@/design";
import { formatPoints } from "@/features/club";
import { BigBadge } from "../components/BigBadge";
import { Confetti } from "../components/Confetti";
import { lastSeal, useLastSeal } from "../lib/last-seal";
import { goToChallenges } from "../sheets/refusal-sheet";

/** Off-white da celebração (igual nos dois temas, como o confete). */
const OFF_WHITE = "#f7f4ec";
const INK = "#131813";
const LOGO = require("../../../../assets/images/logo.png");

const rise = (delay: number) => FadeInUp.delay(delay).duration(600).easing(easings.ease);

/** Celebração do selo ganho (/selo-conquistado). Lê o resultado guardado pelo leitor. */
export default function SealWonScreen() {
  // foto do resultado na montagem: a tela continua de pé mesmo depois de limpar o store
  const [result] = useState(() => useLastSeal.getState().result);
  useEffect(() => () => lastSeal.clear(), []);
  // aberta sem selo (link direto, app reaberto): volta às abas, sem empilhar outra barra
  useEffect(() => {
    if (!result) goToChallenges();
  }, [result]);
  const styles = useStyles();

  if (!result) return <View style={styles.screen} />;
  return <SealWon result={result} />;
}

/** Fase 2: fundo claro, selo no círculo verde, trevos caindo e os pontos do Clube. */
function SealWon({ result }: { result: ScanResult }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { seal, challenge, points, totalPoints } = result;
  const title = challenge.title.trim().replace(/[.!]+$/, "");

  const share = () => {
    void Share.share({
      message: `Ganhei o selo ${seal.name} (+${formatPoints(points)}) no Clube ARP!`,
    }).catch(() => undefined);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" animated />
      <Confetti shape="trevo" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 6, paddingBottom: Math.max(40, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.head}>
          <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel="ARP" />
          <IconButton
            icon="x"
            variant="white"
            accessibilityLabel="Fechar"
            onPress={goToChallenges}
          />
        </View>

        <View style={styles.circle}>
          <BigBadge seal={seal} />
        </View>

        <Animated.View entering={rise(400)}>
          <Text style={styles.k} color={styles.brandText.color} align="center">
            Selo conquistado
          </Text>
        </Animated.View>
        <Animated.View entering={rise(500)}>
          <Text style={styles.h1} color={INK} align="center" accessibilityRole="header">
            {seal.name}
          </Text>
        </Animated.View>
        <Animated.View entering={rise(600)}>
          <Text style={styles.p} color={withAlpha(INK, 0.65)} align="center">
            {title}.
          </Text>
        </Animated.View>

        <Animated.View entering={rise(750)} style={styles.points}>
          <Text style={styles.plus} color={INK} align="center">
            +{formatPoints(points)}
          </Text>
          <Text variant="body" color={withAlpha(INK, 0.7)} align="center">
            Você tem {formatPoints(totalPoints)} no Clube ARP
          </Text>
        </Animated.View>

        <Animated.View entering={rise(900)} style={styles.btns}>
          <Button label="Compartilhar" variant="brand" iconLeft="share-2" onPress={share} />
          <Button label="Continuar" variant="white" onPress={goToChallenges} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: OFF_WHITE, overflow: "hidden" },
  scroll: { zIndex: 2 },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24 },
  head: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  /* logo.png é 425×200 */
  logo: { width: 68, height: 32 },
  circle: {
    marginTop: 28,
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 24px 40px -18px ${withAlpha(t.colors.brand700, 0.6)}`,
  },
  brandText: { color: t.colors.brand700 },
  k: {
    marginTop: 30,
    fontFamily: fontFamily(700),
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: tracking(13, 0.12),
    textTransform: "uppercase",
  },
  h1: {
    fontFamily: fontFamily(850),
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: tracking(42, -0.05),
    marginTop: 6,
    marginBottom: 8,
  },
  p: { lineHeight: 22, maxWidth: 290 },
  points: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: withAlpha(t.colors.brand, 0.14),
    gap: 2,
  },
  plus: { fontFamily: fontFamily(850), fontSize: 30, lineHeight: 34 },
  btns: { alignSelf: "stretch", marginTop: "auto", paddingTop: 26, gap: 10 },
}));
