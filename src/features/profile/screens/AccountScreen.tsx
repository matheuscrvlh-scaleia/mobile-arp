import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, ScrollView, type TextInputInstance, View } from "react-native";
import type { z } from "zod";
import { registerBodySchema, updateMeBodySchema, type VisitorProfile } from "@/contracts/app/auth";
import { errorMessage } from "@/core/api/errors";
import { useSession } from "@/core/auth/session";
import {
  BottomSpacer,
  Button,
  CtaBar,
  createStyles,
  EmptyState,
  layout,
  NavHeader,
  radii,
  ScreenContainer,
  Skeleton,
  Switch,
  Text,
  toast,
  useCtaBarHeight,
} from "@/design";
import { goBackOr } from "@/navigation/navigate";
import { AuthField } from "@/shared/form/AuthField";
import { applyServerErrors } from "@/shared/form/form-errors";
import { FIELD_MAX } from "@/shared/form/limits";
import { PrivacyNote } from "@/shared/form/PrivacyNote";
import { phoneFormSchema } from "@/shared/form/phone-schema";
import { maskPhone, phoneForApi } from "@/shared/lib/phone";
import { useMe, useUpdateMeMutation } from "../api/me";

/*
 * O updateMeBodySchema do servidor na forma do formulário: todos os campos
 * presentes, o nome com as mensagens do cadastro e o celular com máscara
 * (vazio ou completo; vira null para a API).
 */
const accountFormSchema = updateMeBodySchema.required({ marketingOptIn: true }).extend({
  name: registerBodySchema.shape.name,
  phone: phoneFormSchema,
});
type AccountForm = z.input<typeof accountFormSchema>;

const toForm = (visitor: VisitorProfile): AccountForm => ({
  name: visitor.name,
  phone: maskPhone(visitor.phone ?? ""),
  marketingOptIn: visitor.marketingOptIn,
});

export default function AccountScreen() {
  const router = useRouter();
  const signedIn = useSession((s) => s.status === "signedIn");
  const visitor = useSession((s) => s.visitor);
  const styles = useStyles();
  // Atualiza o perfil guardado (e, com ele, o formulário) ao abrir.
  useMe();

  if (!signedIn) {
    return (
      <ScreenContainer top="none">
        <NavHeader title="Seus dados" />
        <EmptyState
          icon="user"
          title="Entre para ver seus dados"
          text="Com a conta você pega cupons, ganha selos e escolhe o que quer receber da ARP."
          action={{ label: "Entrar", onPress: () => router.replace("/entrar") }}
        />
      </ScreenContainer>
    );
  }

  if (!visitor) {
    return (
      <ScreenContainer top="none">
        <NavHeader title="Seus dados" />
        <View style={styles.skeleton}>
          <Skeleton height={62} radius={radii.chip} />
          <Skeleton height={62} radius={radii.chip} />
          <Skeleton height={62} radius={radii.chip} />
        </View>
      </ScreenContainer>
    );
  }

  return <AccountEditor visitor={visitor} />;
}

function AccountEditor({ visitor }: { visitor: VisitorProfile }) {
  const ctaHeight = useCtaBarHeight();
  const styles = useStyles();
  const update = useUpdateMeMutation();
  const phoneRef = useRef<TextInputInstance>(null);

  const form = useForm<AccountForm, unknown, z.output<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: toForm(visitor),
  });
  const { control, handleSubmit, reset, formState } = form;

  // Perfil novo do servidor (GET /me) sem edição em andamento: mostra o atual.
  const { isDirty } = formState;
  useEffect(() => {
    if (!isDirty) reset(toForm(visitor));
  }, [visitor, isDirty, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        name: values.name,
        phone: phoneForApi(values.phone),
        marketingOptIn: values.marketingOptIn,
      });
      reset(values);
      toast.show("Dados atualizados", "circle-check");
      goBackOr("/perfil");
    } catch (error) {
      if (applyServerErrors(form, error)) return;
      toast.show(errorMessage(error), "circle-alert", { haptic: "light" });
    }
  });

  return (
    <ScreenContainer top="none">
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <View style={styles.fill}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingBottom: ctaHeight + 8 }}
          >
            <NavHeader title="Seus dados" />
            <View style={styles.form}>
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <AuthField
                    ref={field.ref}
                    icon="user"
                    label="Nome"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                    maxLength={FIELD_MAX.name}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                  />
                )}
              />
              <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <AuthField
                    ref={(input) => {
                      field.ref(input);
                      phoneRef.current = input;
                    }}
                    icon="smartphone"
                    label="Celular (opcional)"
                    placeholder="(24) 98888-1234"
                    value={field.value}
                    onChangeText={(text) => field.onChange(maskPhone(text))}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                )}
              />
              <AuthField
                icon="mail"
                label="E-mail"
                value={visitor.email}
                readOnly
                hint="O e-mail identifica sua conta e não pode ser trocado pelo app."
              />

              <Controller
                control={control}
                name="marketingOptIn"
                render={({ field }) => (
                  <View style={styles.optIn}>
                    <View style={styles.optInText}>
                      <Text variant="bodyStrong">Novidades e ofertas</Text>
                      <Text variant="small" tone="textMuted">
                        Aceito receber comunicações da ARP. Você pode mudar quando quiser.
                      </Text>
                    </View>
                    <Switch
                      value={field.value}
                      onValueChange={field.onChange}
                      accessibilityLabel="Receber novidades e ofertas da ARP"
                    />
                  </View>
                )}
              />

              <PrivacyNote>
                Não pedimos CPF nem endereço. Guardamos só nome, e-mail e, se você quiser, o
                celular, para sua conta, seus cupons e seus selos.
              </PrivacyNote>
            </View>
            <BottomSpacer kind="safe" />
          </ScrollView>
          <CtaBar>
            <Button
              label="Salvar"
              iconLeft="check"
              loading={update.isPending}
              disabled={!isDirty}
              onPress={() => void onSubmit()}
            />
          </CtaBar>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const useStyles = createStyles((t) => ({
  fill: { flex: 1 },
  form: { paddingHorizontal: layout.gutter, paddingTop: 24 },
  skeleton: { padding: layout.gutter, gap: 12 },
  optIn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: t.colors.surface,
  },
  optInText: { flex: 1, gap: 2 },
}));
