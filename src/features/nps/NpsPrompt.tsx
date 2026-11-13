import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { appApi } from "@/core/api/app-api";
import { useSession } from "@/core/auth/session";
import { kv } from "@/core/storage/kv";
import {
  Button,
  createStyles,
  IconButton,
  PressableScale,
  SheetActions,
  SheetText,
  SheetTitle,
  sheet,
  Text,
  toast,
  useColors,
} from "@/design";

const KEY = "nps.v2";
const SHOW_DELAY_MS = 2500;

/** Mês da abertura ("2026-11"), no relógio do aparelho. */
const monthOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function lastAskedMonth(): string | null {
  try {
    return kv.getSync(KEY);
  } catch {
    return null;
  }
}

function markAsked(month: string) {
  try {
    kv.setSync(KEY, month);
  } catch {
    // atalho: sem armazenamento, só não lembra (pode perguntar de novo; a API guarda uma nota por mês)
  }
}

/** Uma vez por abertura do app, no máximo. */
let askedThisRun = false;

/**
 * NPS dentro do app (revisão V2): uma vez por mês, na primeira vez que a pessoa
 * logada abre o app no mês. Respondendo ou fechando no X, só volta no mês
 * seguinte. Usado na Início.
 */
export function useNpsPrompt() {
  const signedIn = useSession((s) => s.status === "signedIn");
  useEffect(() => {
    if (!signedIn || askedThisRun) return;
    askedThisRun = true;
    const month = monthOf(new Date());
    if (lastAskedMonth() === month) return;
    markAsked(month);
    const t = setTimeout(openNpsSheet, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [signedIn]);
}

export function openNpsSheet() {
  sheet.open(({ close }) => <NpsForm onClose={close} />);
}

const SCORES = Array.from({ length: 11 }, (_, i) => i);

function NpsForm({ onClose }: { onClose: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (score === null || sending) return;
    setSending(true);
    try {
      const text = comment.trim();
      await appApi.nps({ score, ...(text ? { comment: text } : {}) });
      onClose();
      toast.show("Obrigado pela sua nota!", "heart");
    } catch {
      setSending(false);
      toast.show("Não foi possível enviar agora", "circle-x");
    }
  };

  return (
    <>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text variant="bodyStrong">ARP</Text>
          <Text variant="caption" tone="textMuted">
            Sua experiência importa
          </Text>
        </View>
        <IconButton icon="x" accessibilityLabel="Fechar sem responder" onPress={onClose} />
      </View>
      <SheetTitle>De 0 a 10, quanto você recomendaria a ARP para um amigo ou familiar?</SheetTitle>
      <SheetText>
        Sua resposta nos ajuda a melhorar a experiência de todos que visitam a ARP.
      </SheetText>
      <View style={styles.scores} accessibilityRole="radiogroup">
        {SCORES.map((n) => {
          const on = score === n;
          return (
            <PressableScale
              key={n}
              onPress={() => setScore(n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`Nota ${n}`}
              style={[styles.score, on && styles.scoreOn]}
            >
              <Text variant="bodyStrong" style={on ? styles.scoreTextOn : undefined}>
                {n}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Text variant="caption" tone="textMuted">
          Nada provável
        </Text>
        <Text variant="caption" tone="textMuted">
          Muito provável
        </Text>
      </View>
      {score !== null ? (
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Quer contar o porquê? (opcional)"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          accessibilityLabel="Comentário opcional"
          style={styles.comment}
        />
      ) : null}
      <SheetActions>
        <Button
          label="Enviar avaliação"
          variant="dark"
          disabled={score === null}
          loading={sending}
          onPress={() => void send()}
        />
      </SheetActions>
    </>
  );
}

const useStyles = createStyles((t) => ({
  head: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headText: { gap: 2 },
  scores: {
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  score: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.colors.surface,
  },
  scoreOn: { backgroundColor: t.colors.brand },
  scoreTextOn: { color: t.colors.onBrand },
  legend: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  comment: {
    alignSelf: "stretch",
    minHeight: 72,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: t.colors.surface,
    color: t.colors.text,
    textAlignVertical: "top",
    fontSize: 15,
  },
}));
