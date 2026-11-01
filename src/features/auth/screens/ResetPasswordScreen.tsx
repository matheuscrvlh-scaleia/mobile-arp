import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import type { z } from "zod";
import { resetPasswordBodySchema } from "@/contracts/app/auth";
import { errorMessage, isApiError } from "@/core/api/errors";
import { Button, Text, toast } from "@/design";
import { AuthField } from "@/shared/form/AuthField";
import { FormAlert } from "@/shared/form/FormAlert";
import { FormScaffold } from "@/shared/form/FormScaffold";
import { applyServerErrors } from "@/shared/form/form-errors";
import { FIELD_MAX } from "@/shared/form/limits";
import { useNow } from "@/shared/hooks/useNow";
import { useRateLimit } from "@/shared/hooks/useRateLimit";
import { haptic } from "@/shared/lib/haptics";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../api/auth";
import { CodeInput } from "../components/CodeInput";
import { PasswordHint } from "../components/PasswordHint";
import { TextLink } from "../components/TextLink";
import { useCompleteAuth } from "../hooks/useCompleteAuth";
import { formatSeconds, RESEND_WAIT_MS, RESET_UNAVAILABLE, secondsLeft } from "../lib/reset-code";

const resetFormSchema = resetPasswordBodySchema.pick({ code: true, password: true });
type ResetForm = z.input<typeof resetFormSchema>;

/** "Reenviar em 0:45" (o relógio de 1 s só roda enquanto há espera). */
function ResendWait({ until, onDone }: { until: number; onDone: () => void }) {
  const now = useNow(1000);
  const left = secondsLeft(until, now);
  useEffect(() => {
    if (left === 0) onDone();
  }, [left, onDone]);
  return (
    <Text variant="body" tone="textMuted" align="center" style={styles.wait}>
      Reenviar código em {formatSeconds(left)}
    </Text>
  );
}

/**
 * Esqueci a senha, passo 2: o código de 6 dígitos do e-mail + a senha nova.
 * Deu certo = já entra (a API devolve a sessão) e sai das telas de conta como
 * no login, rodando a ação pendente.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; sentAt?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const completeAuth = useCompleteAuth({ keepPendingOnLeave: true });
  const reset = useResetPasswordMutation();
  const resend = useForgotPasswordMutation();
  const rateLimit = useRateLimit();
  const [resendUntil, setResendUntil] = useState<number | null>(() => {
    const sentAt = Number(params.sentAt);
    return (Number.isFinite(sentAt) && sentAt > 0 ? sentAt : Date.now()) + RESEND_WAIT_MS;
  });

  const form = useForm<ResetForm, unknown, z.output<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { code: "", password: "" },
  });
  const { control, handleSubmit, setError, clearErrors, setValue, setFocus, getValues, formState } =
    form;
  const alert = rateLimit.message ?? formState.errors.root?.message;

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      const session = await reset.mutateAsync({ email, ...values });
      await completeAuth(session, "reset");
    } catch (error) {
      if (rateLimit.block(error)) {
        haptic.error();
        return;
      }
      // "Código inválido ou vencido" (fieldErrors.code) e regras da senha.
      if (applyServerErrors(form, error, ["code", "password"])) {
        haptic.error();
        return;
      }
      toast.show(errorMessage(error), "circle-alert", { haptic: "light" });
    }
  });
  const onSubmit = () => {
    if (!rateLimit.blocked) void submit();
  };

  const onResend = async () => {
    if (resend.isPending || resendUntil !== null) return;
    try {
      await resend.mutateAsync({ email });
    } catch (error) {
      if (isApiError(error) && error.code === "SERVICE_UNAVAILABLE") {
        setError("root", { message: RESET_UNAVAILABLE });
        return;
      }
      if (rateLimit.block(error)) {
        haptic.error();
        return;
      }
      toast.show(errorMessage(error), "circle-alert", { haptic: "light" });
      return;
    }
    // O código novo substitui o anterior.
    setValue("code", "");
    clearErrors();
    setResendUntil(Date.now() + RESEND_WAIT_MS);
    toast.show("Se houver conta com este e-mail, enviamos um novo código.", "mail", {
      haptic: "light",
    });
  };

  if (!email) return <Redirect href="/senha/esqueci" />;

  return (
    <FormScaffold
      title="Crie a senha nova"
      lead={`Se houver uma conta com ${email}, enviamos um código de 6 dígitos. Confira também a caixa de spam.`}
      cta={
        <Button
          label="Salvar e entrar"
          iconRight="arrow-right"
          loading={reset.isPending}
          disabled={rateLimit.blocked}
          onPress={onSubmit}
        />
      }
    >
      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <CodeInput
            ref={field.ref}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            onComplete={() => {
              if (!getValues("password")) setFocus("password");
            }}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <>
            <AuthField
              ref={field.ref}
              icon="lock"
              label="Senha nova"
              placeholder="Crie uma senha"
              password
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              passwordRules="minlength: 8; required: lower, upper; required: digit;"
              maxLength={FIELD_MAX.password}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {fieldState.error ? null : <PasswordHint value={field.value} />}
          </>
        )}
      />
      {alert ? <FormAlert message={alert} /> : null}
      <View style={styles.links}>
        {resendUntil !== null ? (
          <ResendWait until={resendUntil} onDone={() => setResendUntil(null)} />
        ) : (
          <TextLink
            prefix="Não chegou? · "
            label={resend.isPending ? "Enviando…" : "Reenviar código"}
            onPress={() => void onResend()}
          />
        )}
        <TextLink prefix="Outro e-mail? · " label="Trocar e-mail" onPress={() => router.back()} />
      </View>
    </FormScaffold>
  );
}

const styles = StyleSheet.create({
  links: { marginTop: 8 },
  wait: { minHeight: 44, lineHeight: 44 },
});
