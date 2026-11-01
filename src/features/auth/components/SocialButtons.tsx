import * as AppleAuthentication from "expo-apple-authentication";
import { View } from "react-native";
import type { SocialProvider } from "@/contracts/app/auth";
import { createStyles, PressableScale, Spinner, Text, useColors, useTheme } from "@/design";
import type { SocialAvailability } from "../hooks/useSocialLogin";
import { GoogleLogo } from "./GoogleLogo";
import { OrDivider } from "./OrDivider";

export type SocialButtonsProps = {
  available: SocialAvailability;
  /** Provedor em andamento (desliga os dois botões). */
  busy: SocialProvider | null;
  onPress: (provider: SocialProvider) => void;
  /** Texto da linha abaixo dos botões (ex.: "ou com seus dados"). */
  dividerLabel: string;
};

const HEIGHT = 54;
const RADIUS = 18;

/**
 * Entrar com Google / Apple (.social) + a linha "ou". Some inteiro quando
 * nenhum provedor está disponível (sem client id do Google; Android sem Apple).
 * A Apple usa o botão oficial (diretrizes de revisão da App Store), preto no
 * tema claro e branco no escuro; o Google segue o estilo do protótipo com o G
 * oficial nas quatro cores.
 */
export function SocialButtons({ available, busy, onPress, dividerLabel }: SocialButtonsProps) {
  const styles = useStyles();
  const colors = useColors();
  const { dark } = useTheme();
  if (!available.google && !available.apple) return null;
  const blocked = busy !== null;
  return (
    <>
      <View style={styles.list}>
        {available.google ? (
          <PressableScale
            onPress={() => onPress("google")}
            disabled={blocked}
            accessibilityLabel="Continuar com o Google"
            accessibilityState={{ disabled: blocked, busy: busy === "google" }}
            style={[styles.google, blocked && busy !== "google" && styles.dim]}
          >
            {busy === "google" ? <Spinner size={18} color={colors.text} /> : <GoogleLogo />}
            <Text variant="bodyStrong">Continuar com o Google</Text>
          </PressableScale>
        ) : null}
        {available.apple ? (
          <View
            pointerEvents={blocked ? "none" : "auto"}
            style={blocked && styles.dim}
            accessibilityState={{ disabled: blocked, busy: busy === "apple" }}
          >
            <AppleAuthentication.AppleAuthenticationButton
              // remonta ao trocar o tema: o estilo do botão nativo é fixado na criação
              key={dark ? "white" : "black"}
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={
                dark
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={RADIUS}
              onPress={() => onPress("apple")}
              style={styles.apple}
            />
          </View>
        ) : null}
      </View>
      <OrDivider label={dividerLabel} />
    </>
  );
}

const useStyles = createStyles((t) => ({
  list: { gap: 10 },
  // .social button: altura 54, raio 18, contorno 1.5 `border`
  google: {
    height: HEIGHT,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  // o botão da Apple precisa de largura e altura explícitas (sem fundo nem raio próprios)
  apple: { width: "100%", height: HEIGHT },
  dim: { opacity: 0.45 },
}));
