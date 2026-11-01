import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, Share, View } from "react-native";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChallengeItem, ScanResult } from "@/contracts/app/challenges";
import {
  Button,
  createStyles,
  easings,
  fontFamily,
  Icon,
  IconButton,
  RadialGlow,
  Text,
  tracking,
  useColors,
  withAlpha,
} from "@/design";
import { useChallenges } from "../api/challenges";
import { BigBadge } from "../components/BigBadge";
import { Confetti } from "../components/Confetti";
import { SealRays } from "../components/SealRays";
import { lastSeal, useLastSeal } from "../lib/last-seal";
import { campaignShortName, justReachedTier, lowerFirst, missingSealsLabel } from "../lib/progress";
import { goToChallenges } from "../sheets/refusal-sheet";

/*
 * radial-gradient(circle at 50% 32%, #2f7d3d 0, #143a1c 42%, #0a170d 75%): dois brilhos
 * nativos (brand700 por cima de brand900) sobre o fundo `chrome` (escuro nos dois temas). Os raios estão em fração do
 * maior lado (num celular ~390×844, 42%/75% da distância ao canto ≈ 30%/54% da altura).
 */
const BG_CENTER = { x: 0.5, y: 0.32 };

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

function SealWon({ result }: { result: ScanResult }) {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { data } = useChallenges();
  const { seal, challenge, campaign, progress } = result;
  const reached = justReachedTier(progress);
  const next = progress.nextTier;
  const title = challenge.title.trim().replace(/[.!]+$/, "");

  const share = () => {
    void Share.share({ message: `Ganhei o selo ${seal.name} na ARP!` }).catch(() => undefined);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" animated />
      <RadialGlow color={colors.brand900} center={BG_CENTER} radius={0.54} />
      <RadialGlow color={colors.brand700} center={BG_CENTER} radius={0.3} />
      <SealRays top={insets.top + 70} />
      <Confetti />
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
          <IconButton
            icon="x"
            variant="glass"
            accessibilityLabel="Fechar"
            onPress={goToChallenges}
          />
        </View>

        <BigBadge seal={seal} />

        <Animated.View entering={rise(400)}>
          <Text style={styles.k} color={colors.brand} align="center">
            Selo conquistado
          </Text>
        </Animated.View>
        <Animated.View entering={rise(500)}>
          <Text style={styles.h1} tone="onChrome" align="center" accessibilityRole="header">
            {seal.name}
          </Text>
        </Animated.View>
        <Animated.View entering={rise(600)}>
          <Text style={styles.p} color={withAlpha(colors.onChrome, 0.65)} align="center">
            {title}. O selo já está na sua coleção de {campaignShortName(campaign.name)}.
          </Text>
        </Animated.View>

        {data?.challenges.length ? (
          <Animated.View entering={rise(700)} style={styles.prog}>
            {data.challenges.map((c) => (
              <ProgressDot key={c.id} item={c} isNew={c.id === challenge.id} />
            ))}
          </Animated.View>
        ) : null}

        {reached ? (
          <Animated.View entering={rise(900)} style={styles.unlock}>
            <View style={styles.uIc}>
              <Icon name="gift" color={colors.onBrand} />
            </View>
            <View style={styles.unlockText}>
              <Text variant="bodyStrong" weight={700} tone="onChrome" style={styles.ub}>
                Benefício desbloqueado!
              </Text>
              <Text variant="small" tone="onChrome">
                {reached.label}
              </Text>
            </View>
          </Animated.View>
        ) : next ? (
          <Animated.View entering={rise(900)} style={styles.unlock}>
            <View style={[styles.uIc, styles.uIcSoft]}>
              <Icon name={next.icon} color={colors.onChrome} />
            </View>
            <View style={styles.unlockText}>
              <Text variant="bodyStrong" weight={700} tone="onChrome" style={styles.ub}>
                {missingSealsLabel(Math.max(1, next.missing))}
              </Text>
              <Text variant="small" tone="onChrome">
                para {lowerFirst(next.label)}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={rise(1000)} style={styles.btns}>
          <Button label="Continuar" variant="brand" onPress={goToChallenges} />
          <Button label="Compartilhar" variant="lineLight" iconLeft="share-2" onPress={share} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ProgressDot({ item, isNew }: { item: ChallengeItem; isNew: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  const ok = item.earned || isNew;
  const dot = (
    <View
      style={[styles.dot, ok && styles.dotOk, isNew && styles.dotNew]}
      accessible
      accessibilityLabel={`Selo ${item.seal.name}${ok ? ", conquistado" : ", ainda não"}`}
    >
      <Icon
        name={ok ? item.seal.icon : "lock"}
        size={17}
        color={ok ? colors.onBrand : colors.onChromeMuted}
      />
    </View>
  );
  if (!isNew) return dot;
  // .w-prog i.new: popin com atraso de 1,2 s
  return <Animated.View entering={ZoomIn.delay(1200).springify().damping(10)}>{dot}</Animated.View>;
}

const useStyles = createStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.chrome, overflow: "hidden" },
  scroll: { zIndex: 2 },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 24 },
  head: { alignSelf: "stretch", flexDirection: "row", justifyContent: "flex-end" },
  k: {
    marginTop: 34,
    fontFamily: fontFamily(700),
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: tracking(13, 0.12),
    textTransform: "uppercase",
  },
  h1: {
    fontFamily: fontFamily(850),
    fontSize: 46,
    lineHeight: 50,
    letterSpacing: tracking(46, -0.05),
    marginTop: 6,
    marginBottom: 8,
  },
  p: { lineHeight: 22, maxWidth: 290 },
  prog: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 26,
  },
  dot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: withAlpha(t.colors.onChrome, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  dotOk: { backgroundColor: t.colors.brand },
  dotNew: { boxShadow: `0 0 0 4px ${withAlpha(t.colors.brand, 0.3)}` },
  unlock: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 20,
    backgroundColor: withAlpha(t.colors.onChrome, 0.08),
  },
  uIc: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: t.colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  uIcSoft: { backgroundColor: withAlpha(t.colors.onChrome, 0.12) },
  unlockText: { flexShrink: 1 },
  ub: { fontSize: 14, lineHeight: 18 },
  btns: { alignSelf: "stretch", marginTop: "auto", paddingTop: 26, gap: 10 },
}));
