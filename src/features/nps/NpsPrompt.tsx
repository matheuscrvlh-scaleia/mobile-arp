import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { appApi } from "@/core/api/app-api";
import { useSession } from "@/core/auth/session";
import { kv } from "@/core/storage/kv";
import {
  Button,
  createStyles,
  PressableScale,
  SheetActions,
  SheetText,
  SheetTitle,
  sheet,
  Text,
  toast,
  useColors,
} from "@/design";
import { DAY_MS } from "@/shared/lib/time";

const KEY = "nps.v1";
/** Primeira pergunta: depois de 7 dias com o app e 5 aberturas da Início. */
const FIRST_AFTER_DAYS = 7;
const FIRST_AFTER_OPENS = 5;
/** Respondeu: pergunta de novo em ~4 meses. Fechou sem responder: em 30 dias. */
const AGAIN_AFTER_ANSWER_DAYS = 120;
const AGAIN_AFTER_DISMISS_DAYS = 30;
const SHOW_DELAY_MS = 2500;

type NpsState = { firstSeen: number; opens: number; nextAt: number };

function load(): NpsState | null {
  try {
    const raw = kv.getSync(KEY);
    return raw ? (JSON.parse(raw) as NpsState) : null;
  } catch {
    return null;
  }
}

function save(s: NpsState) {
  try {
    kv.setSync(KEY, JSON.stringify(s));
  } catch {
    // atalho: sem armazenamento, só não lembra (pode perguntar de novo)
  }
}

function snooze(days: number) {
  const s = load() ?? { firstSeen: Date.now(), opens: 0, nextAt: 0 };
  save({ ...s, nextAt: Date.now() + days * DAY_MS });
}

/** Uma vez por abertura do app, no máximo. */
let askedThisRun = false;

/**
 * NPS dentro do app (correções V2): pergunta de 0 a 10 para quem está logado, sem insistir.
 * Usado na Início: conta as aberturas e, quando chega a hora, abre a pergunta.
 */
export function useNpsPrompt() {
  const signedIn = useSession((s) => s.status === "signedIn");
  useEffect(() => {
    if (!signedIn || askedThisRun) return;
    const now = Date.now();
    const s = load() ?? { firstSeen: now, opens: 0, nextAt: now + FIRST_AFTER_DAYS * DAY_MS };
    const next = { ...s, opens: s.opens + 1 };
    save(next);
    askedThisRun = true;
    if (next.opens < FIRST_AFTER_OPENS || now < next.nextAt) return;
    const t = setTimeout(openNpsSheet, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [signedIn]);
}

export function openNpsSheet() {
  let answered = false;
  const done = (close: () => void) => {
    answered = true;
    close();
  };
  sheet.open(({ close }) => <NpsForm onDone={() => done(close)} />, {
    onClose: () => {
      if (!answered) snooze(AGAIN_AFTER_DISMISS_DAYS);
    },
  });
}

const SCORES = Array.from({ length: 11 }, (_, i) => i);

function NpsForm({ onDone }: { onDone: () => void }) {
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
      snooze(AGAIN_AFTER_ANSWER_DAYS);
      onDone();
      toast.show("Obrigado pela sua nota!", "heart");
    } catch {
      setSending(false);
      toast.show("Não foi possível enviar agora", "circle-x");
    }
  };

  return (
    <>
      <SheetTitle>O que você está achando do app?</SheetTitle>
      <SheetText>De 0 a 10, quanto você recomendaria o app da ARP para um amigo?</SheetText>
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
          label="Enviar"
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
