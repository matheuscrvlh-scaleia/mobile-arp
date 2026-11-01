import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { forgotPasswordBodySchema } from "@/contracts/app/auth";
import { errorMessage, isApiError } from "@/core/api/errors";
import { Button, toast } from "@/design";
import { AuthField } from "@/shared/form/AuthField";
import { FormAlert } from "@/shared/form/FormAlert";
import { FormScaffold } from "@/shared/form/FormScaffold";
import { applyServerErrors } from "@/shared/form/form-errors";
import { FIELD_MAX } from "@/shared/form/limits";
import { PrivacyNote } from "@/shared/form/PrivacyNote";
import { useRateLimit } from "@/shared/hooks/useRateLimit";
import { haptic } from "@/shared/lib/haptics";
import { useForgotPasswordMutation } from "../api/auth";
import { RESET_UNAVAILABLE } from "../lib/reset-code";

type ForgotForm = z.input<typeof forgotPasswordBodySchema>;

/** Esqueci a senha, passo 1: o e-mail da conta. A API sempre responde igual (não revela se há conta). */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const forgot = useForgotPasswordMutation();
  const rateLimit = useRateLimit();

  const form = useForm<ForgotForm, unknown, z.output<typeof forgotPasswordBodySchema>>({
    resolver: zodResolver(forgotPasswordBodySchema),
    defaultValues: { email: typeof params.email === "string" ? params.email : "" },
  });
  const { control, handleSubmit, setError, clearErrors, formState } = form;
  const alert = rateLimit.message ?? formState.errors.root?.message;

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    try {
      await forgot.mutateAsync(values);
      router.push({
        pathname: "/senha/nova",
        params: { email: values.email, sentAt: String(Date.now()) },
      });
    } catch (error) {
      if (isApiError(error) && error.code === "SERVICE_UNAVAILABLE") {
        haptic.error();
        setError("root", { message: RESET_UNAVAILABLE });
        return;
      }
      if (rateLimit.block(error)) {
        haptic.error();
        return;
      }
      if (applyServerErrors(form, error)) return;
      toast.show(errorMessage(error), "circle-alert", { haptic: "light" });
    }
  });
  const onSubmit = () => {
    if (!rateLimit.blocked) void submit();
  };

  return (
    <FormScaffold
      title="Esqueceu a senha?"
      lead="Informe o e-mail da sua conta. Enviamos um código de 6 dígitos para você criar uma senha nova."
      cta={
        <Button
          label="Enviar código"
          iconRight="arrow-right"
          loading={forgot.isPending}
          disabled={rateLimit.blocked}
          onPress={onSubmit}
        />
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <AuthField
            ref={field.ref}
            icon="mail"
            label="E-mail"
            placeholder="voce@email.com"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            maxLength={FIELD_MAX.email}
            returnKeyType="send"
            autoFocus={!params.email}
            onSubmitEditing={onSubmit}
          />
        )}
      />
      {alert ? <FormAlert message={alert} /> : null}
      <PrivacyNote>
        Criou a conta com o Google ou a Apple? Ela não tem senha: entre pelo botão do Google ou da
        Apple.
      </PrivacyNote>
    </FormScaffold>
  );
}
