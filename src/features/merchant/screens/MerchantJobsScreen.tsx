import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { JOB_DEFAULT_DAYS } from "@/contracts/content";
import { errorMessage } from "@/core/api/errors";
import { merchantApi } from "@/core/merchant/merchant-api";
import { useMerchantSession } from "@/core/merchant/merchant-session";
import { queryKeys } from "@/core/query/keys";
import {
  Button,
  createStyles,
  layout,
  NavHeader,
  ScreenContainer,
  Spinner,
  Text,
  toast,
} from "@/design";
import { AuthField } from "@/shared/form/AuthField";
import { useMerchantJobs } from "../api/merchant";

const DAY_MS = 86_400_000;

/** /lojista/vagas: publicar e tirar vagas do ar. Saem sozinhas no prazo padrão da ARP (JOB_DEFAULT_DAYS). */
export default function MerchantJobsScreen() {
  const styles = useStyles();
  const qc = useQueryClient();
  const storeId = useMerchantSession((s) => s.profile?.storeId ?? "");
  const jobs = useMerchantJobs(storeId);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.merchant.jobs(storeId) });

  const publish = async () => {
    setBusy(true);
    try {
      await merchantApi.jobs.create({
        storeId,
        title: title.trim(),
        text: text.trim(),
        imageUrl: null,
        whatsapp,
        days: JOB_DEFAULT_DAYS,
      });
      setTitle("");
      setText("");
      void refresh();
      toast.show("Vaga publicada");
    } catch (e) {
      toast.show(errorMessage(e), "circle-alert");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await merchantApi.jobs.remove(id);
      void refresh();
      toast.show("Vaga fora do ar");
    } catch (e) {
      toast.show(errorMessage(e), "circle-alert");
    }
  };

  return (
    <ScreenContainer top="none">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <NavHeader title="Vagas" />
        <View style={styles.pad}>
          <View style={styles.form}>
            <AuthField
              icon="briefcase"
              label="Vaga"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
            />
            <AuthField
              icon="book-open"
              label="Texto"
              value={text}
              onChangeText={setText}
              maxLength={1500}
              multiline
            />
            <AuthField
              icon="message-circle"
              label="WhatsApp (com DDD)"
              value={whatsapp}
              onChangeText={(v) => setWhatsapp(v.replace(/\D/g, ""))}
              keyboardType="phone-pad"
              maxLength={13}
            />
            <Button
              label="Publicar vaga"
              loading={busy}
              disabled={!title.trim() || whatsapp.length < 10}
              onPress={() => void publish()}
            />
          </View>

          {jobs.isLoading ? <Spinner /> : null}
          {(jobs.data ?? []).map((j) => {
            const days = Math.max(
              1,
              Math.ceil((new Date(j.expiresAt).getTime() - Date.now()) / DAY_MS),
            );
            return (
              <View key={j.id} style={styles.card}>
                <Text variant="bodyStrong">{j.title}</Text>
                <Text variant="small" tone="textMuted">
                  Sai do ar em {days} {days === 1 ? "dia" : "dias"}
                </Text>
                <Button
                  label="Tirar do ar"
                  size="sm"
                  variant="soft"
                  onPress={() => void remove(j.id)}
                />
              </View>
            );
          })}
          {jobs.data?.length === 0 ? (
            <Text variant="small" tone="textMuted">
              Nenhuma vaga no ar.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const useStyles = createStyles((t) => ({
  pad: { paddingHorizontal: layout.gutter, paddingBottom: 40, gap: 12 },
  form: { gap: 12, padding: 14, borderRadius: 22, backgroundColor: t.colors.surface },
  card: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: t.colors.surface,
    gap: 6,
    alignItems: "flex-start",
  },
}));
