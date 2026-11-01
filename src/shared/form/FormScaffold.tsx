import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import {
  CtaBar,
  createStyles,
  fontFamily,
  layout,
  NavHeader,
  ScreenContainer,
  Text,
  tracking,
  useCtaBarHeight,
} from "@/design";

export type FormScaffoldProps = {
  title: string;
  lead: string;
  headerRight?: ReactNode;
  onBack?: () => void;
  /** Botão(ões) da barra fixa inferior. */
  cta: ReactNode;
  children: ReactNode;
};

/**
 * Base das telas de formulário (conta, recuperação de senha, lojista) (.form): voltar,
 * título grande, texto de apoio, campos e a barra fixa com o botão acima do teclado.
 */
export function FormScaffold({
  title,
  lead,
  headerRight,
  onBack,
  cta,
  children,
}: FormScaffoldProps) {
  const ctaHeight = useCtaBarHeight();
  const styles = useStyles();
  return (
    <ScreenContainer top="none">
      {/* Android é edge-to-edge (a janela não encolhe com o teclado): padding nos dois. */}
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <View style={styles.fill}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingBottom: ctaHeight + 24 }}
          >
            <NavHeader right={headerRight} onBack={onBack} />
            <View style={styles.form}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text variant="muted" style={styles.lead}>
                {lead}
              </Text>
              {children}
            </View>
          </ScrollView>
          <CtaBar>{cta}</CtaBar>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  form: { paddingHorizontal: layout.gutter },
  title: {
    fontFamily: fontFamily(850),
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: tracking(34, -0.045),
    color: t.colors.text,
    marginTop: 24,
    marginBottom: 6,
  },
  lead: { lineHeight: 22, marginBottom: 24 },
}));
