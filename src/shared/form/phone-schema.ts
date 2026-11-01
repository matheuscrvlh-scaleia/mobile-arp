import { registerBodySchema } from "@/contracts/app/auth";
import { isValidOptionalPhone } from "@/shared/lib/phone";

/**
 * Celular no formulário (cadastro e "Seus dados"): o texto do contrato
 * (`registerBodySchema.shape.phone`, sem o null/opcional) que, se preenchido,
 * precisa estar completo com DDD. Para a API, converta com `phoneForApi`.
 */
export const phoneFormSchema = registerBodySchema.shape.phone
  .unwrap()
  .unwrap()
  .refine(isValidOptionalPhone, "Celular incompleto. Use DDD + número.");
